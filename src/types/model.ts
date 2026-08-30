export interface GroceryListType {
  id: number;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  items: GroceryItemType[];
}

export interface GroceryItemType {
  id: number;
  name: string;
  imageUrl?: string;
  lists: GroceryListType[] | number[];
  description?: string;
}
