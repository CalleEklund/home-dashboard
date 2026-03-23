export type AuthPollResult =
  | { status: 'pending'; qrCode: string }
  | { status: 'complete' }
  | { status: 'failed'; message?: string };

export abstract class IcaAuthPort {
  abstract getAccessToken(): Promise<string>;
  abstract refreshAccessToken(): Promise<void>;
  abstract isAuthenticated(): boolean;
  abstract startLogin(): Promise<{ qrCode: string }>;
  abstract pollLogin(): Promise<AuthPollResult>;
  abstract cancelLogin(): Promise<void>;
  abstract logout(): void;
}
