import db from "@/offline/db";
import { useLanguage } from "@/providers/LanguageProvider";
import axios from "@/services/axios";
import { openNewsUrl } from "@/notifications/actions";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";

export type News = { id: number; title: string; body: string; url: string | null; at: string };

const KEY_NEWS = "keep:news";
const KEY_DISMISSED = "keep:newsDismissed";
const KEEP_DISMISSED = 50;

type NewsState = { items: News[]; dismissed: number[] };

let state: NewsState = {
  items: db.loadValue<News[]>(KEY_NEWS) ?? [],
  dismissed: db.loadValue<number[]>(KEY_DISMISSED) ?? [],
};
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

const setState = (next: Partial<NewsState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getState = () => state;

const firstUnread = ({ items, dismissed }: NewsState) => items.find((item) => !dismissed.includes(item.id)) ?? null;

export const refreshNews = () => {
  if (loading) return loading;
  loading = axios
    .get<News[]>("/news", { network: true } as object)
    .then(({ data }) => {
      if (!Array.isArray(data)) return;
      db.saveValue(KEY_NEWS, data);
      setState({ items: data });
    })
    .catch(() => {})
    .finally(() => {
      loading = null;
    });
  return loading;
};

export const useUnreadNews = () => firstUnread(useSyncExternalStore(subscribe, getState, getState));

export const useNewsRefresh = (trigger?: unknown) => {
  const { lang } = useLanguage();

  useEffect(() => {
    refreshNews();
  }, [lang, trigger]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") refreshNews();
    });
    return () => subscription.remove();
  }, []);
};

const useNews = () => {
  const news = useUnreadNews();
  useNewsRefresh();

  useFocusEffect(
    useCallback(() => {
      refreshNews();
    }, []),
  );

  const dismiss = () => {
    if (!news) return;
    const next = [news.id, ...state.dismissed].slice(0, KEEP_DISMISSED);
    db.saveValue(KEY_DISMISSED, next);
    setState({ dismissed: next });
  };

  const open = () => {
    if (!news?.url) return;
    const url = news.url;
    dismiss();
    openNewsUrl(url);
  };

  return { news, open, dismiss };
};

export default useNews;
