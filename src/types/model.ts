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
}
