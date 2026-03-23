import { ShoppingList } from '../entities/shopping-list.entity';

export abstract class ShoppingListPort {
  abstract getAllLists(accessToken: string): Promise<ShoppingList[]>;
  abstract createList(accessToken: string, name: string): Promise<ShoppingList>;
  abstract deleteList(accessToken: string, listId: string): Promise<void>;
  abstract addItem(accessToken: string, listId: string, text: string): Promise<void>;
  abstract removeItem(accessToken: string, rowId: string): Promise<void>;
}
