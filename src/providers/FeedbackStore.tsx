import type { Feedback } from "@/components/elements/Feedback/FeedbackCard";
import { createContext, type ReactNode, useContext, useState, useSyncExternalStore } from "react";

export type FeedbackPlace = "list" | "inventory" | "play" | "account" | "admin";

export const createFeedbackStore = () => {
  const entries = new Map<FeedbackPlace, Feedback>();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  return {
    of: (place: FeedbackPlace) => entries.get(place) ?? null,
    report: (place: FeedbackPlace, feedback: Feedback | null) => {
      if (!feedback && !entries.has(place)) return;
      if (feedback) entries.set(place, feedback);
      else entries.delete(place);
      emit();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export type FeedbackStore = ReturnType<typeof createFeedbackStore>;

const FeedbackStoreContext = createContext<FeedbackStore | null>(null);

export const FeedbackStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(createFeedbackStore);
  return <FeedbackStoreContext.Provider value={store}>{children}</FeedbackStoreContext.Provider>;
};

const none = () => () => {};

export const useFeedback = (place: FeedbackPlace) => {
  const store = useContext(FeedbackStoreContext);
  return useSyncExternalStore(store?.subscribe ?? none, () => store?.of(place) ?? null);
};

export const useReportFeedback = () => {
  const store = useContext(FeedbackStoreContext);
  return store?.report ?? (() => {});
};
