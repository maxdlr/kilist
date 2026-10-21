export interface ListType {
  id: number;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  items: FoodType[];
}

export interface FoodType {
  id: number;
  name: string;
  imageUrl?: string;
  lists: ListType[] | number[];
  description?: string;
  inStockScore: number;
  snoozedUntil?: Date;
}

export interface ShopListType {
  id: number;
  startFoods: FoodType[];
  boughtFoods: FoodType[];
}
