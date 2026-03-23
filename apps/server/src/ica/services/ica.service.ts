import { Injectable } from '@nestjs/common';
import { IcaAuthPort } from '../ports/ica-auth.port';
import type { AuthPollResult } from '../ports/ica-auth.port';
import { ShoppingListPort } from '../ports/shopping-list.port';
import type { ShoppingList } from '../entities/shopping-list.entity';

@Injectable()
export class IcaService {
  constructor(
    private readonly auth: IcaAuthPort,
    private readonly shoppingList: ShoppingListPort,
  ) {}

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  async startLogin(): Promise<{ qrCode: string }> {
    return this.auth.startLogin();
  }

  async pollLogin(): Promise<AuthPollResult> {
    return this.auth.pollLogin();
  }

  async cancelLogin(): Promise<void> {
    return this.auth.cancelLogin();
  }

  logout(): void {
    this.auth.logout();
  }

  /** Run an action with the access token, auto-refreshing once on 401. */
  private async withToken<T>(action: (token: string) => Promise<T>): Promise<T> {
    const token = await this.auth.getAccessToken();
    try {
      return await action(token);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 401) {
        await this.auth.refreshAccessToken();
        const freshToken = await this.auth.getAccessToken();
        return action(freshToken);
      }
      throw err;
    }
  }

  async getLists(): Promise<ShoppingList[]> {
    return this.withToken((t) => this.shoppingList.getAllLists(t));
  }

  async createList(name: string): Promise<ShoppingList> {
    return this.withToken((t) => this.shoppingList.createList(t, name));
  }

  async deleteList(listId: string): Promise<void> {
    return this.withToken((t) => this.shoppingList.deleteList(t, listId));
  }

  async addItem(listId: string, text: string): Promise<void> {
    return this.withToken((t) => this.shoppingList.addItem(t, listId, text));
  }

  async removeItem(rowId: string): Promise<void> {
    return this.withToken((t) => this.shoppingList.removeItem(t, rowId));
  }
}
