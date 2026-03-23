import { Injectable, HttpException } from '@nestjs/common';
import { ShoppingListPort } from '../ports/shopping-list.port';
import {
  ShoppingList,
  ShoppingListItem,
} from '../entities/shopping-list.entity';

const BASE_URL =
  'https://apimgw-pub.ica.se/sverige/digx/shopping-list/v1/api';

function icaHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json; charset=UTF-8',
    Accept: '*/*',
    Origin: 'https://www.ica.se',
    Referer: 'https://www.ica.se/',
  };
}

function parseList(l: {
  id: string;
  name: string;
  rows?: unknown[];
}): ShoppingList {
  return new ShoppingList(
    l.id,
    l.name,
    (l.rows ?? []).map(
      (r: { id?: string; text?: string; isStriked?: boolean }) =>
        new ShoppingListItem(
          r.id ?? '',
          r.text ?? '',
          r.isStriked ?? false,
        ),
    ),
  );
}

@Injectable()
export class ShoppingListAdapter extends ShoppingListPort {
  async getAllLists(accessToken: string): Promise<ShoppingList[]> {
    const res = await fetch(`${BASE_URL}/list/all`, {
      headers: icaHeaders(accessToken),
    });

    if (!res.ok) {
      throw new HttpException('Failed to fetch ICA lists', res.status);
    }

    const data = await res.json();
    const lists = Array.isArray(data) ? data : data.items ?? [];
    return lists.map(parseList);
  }

  async createList(accessToken: string, name: string): Promise<ShoppingList> {
    const res = await fetch(`${BASE_URL}/list`, {
      method: 'POST',
      headers: icaHeaders(accessToken),
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      throw new HttpException('Failed to create list', res.status);
    }

    const data = await res.json();
    return parseList(data);
  }

  async deleteList(accessToken: string, listId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/list/${listId}`, {
      method: 'DELETE',
      headers: icaHeaders(accessToken),
    });

    if (!res.ok) {
      throw new HttpException('Failed to delete list', res.status);
    }
  }

  async addItem(
    accessToken: string,
    listId: string,
    text: string,
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/list/${listId}/row`, {
      method: 'POST',
      headers: icaHeaders(accessToken),
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new HttpException('Failed to add item', res.status);
    }
  }

  async removeItem(accessToken: string, rowId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/row/${rowId}`, {
      method: 'DELETE',
      headers: icaHeaders(accessToken),
    });

    if (!res.ok) {
      throw new HttpException('Failed to remove item', res.status);
    }
  }
}
