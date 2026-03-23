export class ShoppingListItem {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly isStriked: boolean,
  ) {}
}

export class ShoppingList {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly rows: ShoppingListItem[],
  ) {}
}
