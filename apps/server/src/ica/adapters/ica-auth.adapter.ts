import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer-core';
import type { Browser, Page } from 'puppeteer-core';
import { IcaAuthPort } from '../ports/ica-auth.port';
import type { AuthPollResult } from '../ports/ica-auth.port';

const LOGIN_URL = 'https://www.ica.se/logga-in/';
const USER_INFO_URL = 'https://www.ica.se/api/user/information';
const CHROME_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

type BrowserSession = { browser: Browser; page: Page };

@Injectable()
export class IcaAuthAdapter extends IcaAuthPort {
  private readonly logger = new Logger(IcaAuthAdapter.name);
  private readonly chromeWs: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.chromeWs = this.config.getOrThrow<string>('CHROME_WS_ENDPOINT');
  }
  private accessToken: string | null = null;
  private sessionId: string | null = null;
  private session: BrowserSession | null = null;

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  logout(): void {
    this.accessToken = null;
    this.sessionId = null;
    this.logger.log('Session cleared');
  }

  async getAccessToken(): Promise<string> {
    if (!this.accessToken || !this.sessionId) {
      throw new UnauthorizedException('Not authenticated. Please log in.');
    }
    return this.accessToken;
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.sessionId) {
      throw new UnauthorizedException('No session. Please log in again.');
    }

    this.logger.log('Refreshing access token via thSessionId...');
    const res = await fetch(USER_INFO_URL, {
      headers: {
        Cookie: `thSessionId=${this.sessionId}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      this.accessToken = null;
      this.sessionId = null;
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    const data = await res.json();
    if (!data.accessToken) {
      this.accessToken = null;
      this.sessionId = null;
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    this.accessToken = data.accessToken;
    this.logger.log('Access token refreshed');
  }

  async startLogin(): Promise<{ qrCode: string }> {
    await this.closeSession();

    const browser = await puppeteer.connect({ browserWSEndpoint: this.chromeWs });
    const page = await browser.newPage();
    await page.setUserAgent(CHROME_UA);

    this.session = { browser, page };

    try {
      // Navigate to ICA login — redirects to IMS
      await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      this.logger.log(`Login: landed on ${page.url()}`);

      // We should be on the IMS login page now. Click the BankID QR option if needed.
      const bankIdLink = await page.$('a[href*="icase-bankid-qr"]');
      if (bankIdLink) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
          bankIdLink.click(),
        ]);
        this.logger.log(`Login: navigated to BankID page`);
      }

      // Wait for the QR code image to appear
      await page.waitForSelector('img#autostartTokenQr[src^="data:image"]', {
        timeout: 20000,
      });

      const qrCode = await this.extractQr(page);
      if (!qrCode) throw new Error('No QR code found');

      this.logger.log('Login: BankID QR extracted');
      return { qrCode };
    } catch (err) {
      await this.closeSession();
      throw err;
    }
  }

  async pollLogin(): Promise<AuthPollResult> {
    if (!this.session) {
      return { status: 'failed', message: 'No login session active' };
    }

    const { page } = this.session;

    try {
      const currentUrl = page.url();

      // Check if we've been redirected back to ica.se (login complete)
      if (currentUrl.includes('ica.se') && !currentUrl.includes('ims.icagruppen.se')) {
        this.logger.log(`Login: redirected back to ica.se`);
        await this.extractSessionCookie();
        await this.closeSession();
        return { status: 'complete' };
      }

      // Still on IMS — try to get updated QR
      const qrCode = await this.extractQr(page);
      if (qrCode) {
        return { status: 'pending', qrCode };
      }

      // No QR but still on IMS — might be mid-navigation or on the auto-submit form
      // Try to submit any blocked form
      const formAction = await page.evaluate(() => {
        const form = document.getElementById('form1') as HTMLFormElement | null;
        return form?.action ?? null;
      });

      if (formAction) {
        this.logger.log('Login: submitting blocked auto-submit form');
        await page.evaluate(() => {
          (document.getElementById('form1') as HTMLFormElement).submit();
        });
        // Wait a moment for navigation
        await new Promise((r) => setTimeout(r, 1000));

        // Check if we ended up on ica.se
        const newUrl = page.url();
        if (newUrl.includes('ica.se') && !newUrl.includes('ims.icagruppen.se')) {
          this.logger.log('Login: redirected to ica.se after form submit');
          await this.extractSessionCookie();
          await this.closeSession();
          return { status: 'complete' };
        }
      }

      return { status: 'pending', qrCode: '' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Page navigating — expected during login flow
      if (msg.includes('context') || msg.includes('navigation') || msg.includes('detached')) {
        this.logger.log(`Login: page navigating... (${msg.substring(0, 60)})`);
        return { status: 'pending', qrCode: '' };
      }
      this.logger.error('Login poll error', err);
      await this.closeSession();
      return { status: 'failed', message: 'Login failed' };
    }
  }

  async cancelLogin(): Promise<void> {
    await this.closeSession();
  }

  private async extractQr(page: Page): Promise<string | null> {
    try {
      return await page.evaluate(() => {
        const img = document.getElementById('autostartTokenQr') as HTMLImageElement | null;
        return img?.src ?? null;
      });
    } catch {
      return null;
    }
  }

  private async extractSessionCookie(): Promise<void> {
    if (!this.session) throw new Error('No browser session');

    const cookies = await this.session.page.cookies('https://www.ica.se');
    const sessionCookie = cookies.find((c) => c.name === 'thSessionId');

    if (!sessionCookie) {
      throw new Error('thSessionId cookie not found after login');
    }

    this.sessionId = sessionCookie.value;
    this.logger.log('Login: extracted thSessionId cookie');

    // Exchange for Bearer token
    const res = await fetch(USER_INFO_URL, {
      headers: {
        Cookie: `thSessionId=${this.sessionId}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Token exchange failed: ${res.status}`);
    }

    const data = await res.json();
    if (!data.accessToken) {
      throw new Error('No access token in user info response');
    }

    this.accessToken = data.accessToken;
    this.logger.log('Login: access token obtained');
  }

  private async closeSession(): Promise<void> {
    if (!this.session) return;
    const { page, browser } = this.session;
    this.session = null;
    try {
      await page.close();
      browser.disconnect();
    } catch { /* ignore */ }
  }
}
