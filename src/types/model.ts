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
  barcodes?: string[];
  quantity?: string | null;
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
  key?: string;
  months?: number[];
  name: string;
  description?: string;
  icon?: string;
  staple?: boolean;
  tags?: string[];
  group?: string;
}

export type EaterProfileType = { id: string; kind: "exclude" | "include"; ask?: string };

export type DeclinedSuggestionType = { at: string; count: number };

export interface HouseholdType {
  id: number;
  name?: string;
  joinCode: string;
}

export interface HouseholdWithMembersType extends HouseholdType {
  members: HouseholdMemberType[];
  eaterProfiles?: string[];
  declinedSuggestions?: Record<string, DeclinedSuggestionType>;
}

export interface UserType {
  id: number;
  username: string;
  email: string;
  emailConfirmedAt?: string | null;
  notifications?: Record<string, string> | null;
  description?: string;
  type: "user" | "admin";
  skin?: string;
  language?: string | null;
  household: HouseholdType;
}
