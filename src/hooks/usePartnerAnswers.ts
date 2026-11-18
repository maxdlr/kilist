import { partnerAnswersToday } from "@/offline/domain";
import { getState, subscribeStore } from "@/offline/store";
import type { LocalState } from "@/offline/types";
import { useState, useSyncExternalStore } from "react";

const usePartnerAnswers = (foodId: number) => {
  const state = useSyncExternalStore(subscribeStore, getState, getState) as LocalState | null;
  const [now] = useState(() => ({ at: Date.now(), tzOffset: new Date().getTimezoneOffset() }));
  const food = state?.foods.find((entry) => entry.id === foodId);
  const members = state?.household?.members ?? [];
  if (!state?.user || !food || members.length < 2) return [];
  return partnerAnswersToday(food, members, state.user.id, now.at, now.tzOffset);
};

export default usePartnerAnswers;
