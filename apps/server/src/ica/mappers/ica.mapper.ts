import { z } from 'zod';
import { ShoppingList, ShoppingListItem } from '../entities/shopping-list.entity';
import { ShoppingListSchema } from '../schemas/ica.schemas';
import type { AuthPollResult } from '../ports/ica-auth.port';

export type ShoppingListHttp = z.infer<typeof ShoppingListSchema>;

export class IcaMapper {
  static toListHttp(list: ShoppingList): ShoppingListHttp {
    return {
      id: list.id,
      name: list.name,
      rows: list.rows.map((r) => ({
        id: r.id,
        text: r.text,
        isStriked: r.isStriked,
      })),
    };
  }

  static toListsHttp(lists: ShoppingList[]): ShoppingListHttp[] {
    return lists.map(IcaMapper.toListHttp);
  }

  static toPollHttp(result: AuthPollResult) {
    return {
      status: result.status,
      qrCode: 'qrCode' in result ? result.qrCode : undefined,
      message: 'message' in result ? result.message : undefined,
    };
  }
}
