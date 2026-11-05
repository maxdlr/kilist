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
  icon?: string | null;
  lists: ListType[] | number[];
  description?: string;
  inStockScore: number;
  snoozedUntil?: Date;
  foodHistories?: number[];
}

export interface ShopListType {
  id: number;
  foods: FoodType[];
  startFoods: FoodType[];
  boughtFoods: FoodType[];
}

export interface HouseholdMemberType {
  id: number;
  username: string;
  type: "user" | "admin";
}

export interface FoodBankItemType {
  name: string;
  description?: string;
  icon?: string;
}

export interface HouseholdType {
  id: number;
  name?: string;
  joinCode: string;
}

export interface HouseholdWithMembersType extends HouseholdType {
  members: HouseholdMemberType[];
}

export interface UserType {
  id: number;
  username: string;
  email: string;
  description?: string;
  type: "user" | "admin";
  skin?: string;
  household: HouseholdType;
}
