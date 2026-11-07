import axios from "@/services/axios";
import useToast from "@/providers/ToastProvider";
import { useCallback, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";

export type Paged<T> = { total: number; items: T[] };
export type AdminAction = { id: number; summary: string; admin: string | null; targetType: string; targetId: number; at: string };
export type Ref = { id: number; name: string | null };

export type AdminUserRow = {
  id: number;
  username: string;
  email: string;
  type: "user" | "admin";
  skin: string;
  language: string | null;
  deviceLanguage: string | null;
  household: Ref | null;
  lastActive: string | null;
};

export type AdminUser = Omit<AdminUserRow, "household"> & {
  createdAt: string;
  stats: { answers: number; trips: number; points: number; sessions: number };
  household: Ref & { members: number; foods: number; lists: number; trips: number };
  unlocks: { prizeId: string; source: "points" | "gift" | "purchase"; at: string }[];
  skins: { prizeId: string; skin: string; name: string; price: number; owned: boolean }[];
  actions: AdminAction[];
};

export type AdminHouseholdRow = {
  id: number;
  name: string | null;
  joinCode: string;
  members: number;
  foods: number;
  needed: number;
  lastActive: string | null;
};

export type AdminHousehold = {
  id: number;
  name: string | null;
  joinCode: string;
  createdAt: string;
  lastActive: string | null;
  members: { id: number; username: string; email: string; type: string }[];
  lists: { id: number; title: string; isMain: boolean; foods: number }[];
  foods: number;
  needed: number;
  trips: { count: number; last: string | null };
  races: { count: number; last: string | null };
  actions: AdminAction[];
};

export type FoodScope = { household: Ref; user: { id: number; username: string } | null } | null;

export type AdminFoodRow = {
  id: number;
  name: string;
  icon: string | null;
  inStockScore: number;
  snoozedUntil: string | null;
  household: Ref | null;
};

export type AdminFood = AdminFoodRow & {
  description: string;
  createdAt: string;
  household: Ref;
  history: { user: string | null; answer: "have" | "need" | "unsure"; at: string }[];
  lists: { id: number; title: string; isMain: boolean }[];
  usuallyNext: { id: number; name: string; times: number }[];
  actions: AdminAction[];
};

export type AdminListRow = { id: number; title: string; isMain: boolean; foods: number; household: Ref | null };

export type AdminList = {
  id: number;
  title: string;
  isMain: boolean;
  household: Ref;
  foods: { id: number; name: string }[];
  available: { id: number; name: string }[];
  actions: AdminAction[];
};

type Rate = { rate: number | null; cohort: number };

export type AdminStats = {
  period: number;
  growth: {
    users: number;
    newUsers: number;
    households: number;
    newHouseholds: number;
    foods: number;
    peoplePerHousehold: number | null;
    soloHouseholds: number;
    sharedHouseholds: number;
    signups: { day: string; count: number }[];
    languages: { fr: number; en: number; phone: number; phoneFr: number; phoneEn: number };
  };
  firstDays: { pickedFive: Rate; firstGame: Rate; firstTrip: Rate; retention: { day1: Rate; day7: Rate; day30: Rate } };
  use: {
    activeToday: number;
    activeWeek: number;
    gamesFinished: number | null;
    unsure: number | null;
    mostUnsure: string[];
    skins: { skin: string; share: number | null }[];
  };
  shopping: {
    trips: number;
    itemsPerTrip: number | null;
    tripMinutes: number | null;
    suggestionsShown: number;
    suggestionsTaken: number | null;
    mostBought: { name: string; count: number }[];
  };
  business: {
    earned: number;
    spent: number;
    givenByAdmins: number;
    averageBalance: number;
    nearUnlock: number;
    unlocks: { skin: string; total: number; points: number; gift: number; purchase: number }[];
  };
  health: { foodsWithoutIcon: number; topMissingIcons: string[]; emptyHouseholds: number; neverActive: number };
};

export const query = (params: Record<string, string | number | undefined | false>) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== "" && value !== false);
  return entries.length ? `?${entries.map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`).join("&")}` : "";
};

const swrOptions = { revalidateOnFocus: true, keepPreviousData: true };

export const useAdmin = <T,>(path: string | null) => useSWR<T>(path ? { url: `/admin${path}` } : null, swrOptions);

export const refreshAdmin = () =>
  globalMutate((key) => typeof key === "object" && key !== null && String((key as { url?: string }).url ?? "").startsWith("/admin"));

const reasonOf = (error: unknown) => {
  const data = (error as { response?: { data?: { message?: string; error?: { detail?: string } } } })?.response?.data;
  return data?.error?.detail || data?.message || "Something went wrong";
};

export const useAdminCall = () => {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const call = useCallback(
    async <T = unknown,>(method: "post" | "put" | "delete", path: string, body?: unknown, success?: string) => {
      setBusy(true);
      try {
        const res = await axios.request<T>({ method, url: `/admin${path}`, data: body });
        await refreshAdmin();
        if (success) showToast(success, "success");
        return res.data;
      } catch (error) {
        showToast(reasonOf(error));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [showToast],
  );

  return { call, busy };
};
