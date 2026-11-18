import { router } from "expo-router";
import { Linking } from "react-native";
export type NewsTrigger = { id: string; label: string; param: string; value: string };
export type NewsView = { id: string; label: string; route: string; triggers: NewsTrigger[] };

const panel = (id: string, label: string): NewsTrigger => ({ id, label, param: "panel", value: id });

export const NEWS_VIEWS: NewsView[] = [
  { id: "home", label: "Home", route: "/", triggers: [] },
  { id: "game", label: "Game", route: "/swipe", triggers: [] },
  { id: "list", label: "Shopping list", route: "/shop", triggers: [panel("add", "Add a product")] },
  {
    id: "inventory",
    label: "Inventory",
    route: "/inventory",
    triggers: [{ id: "add", label: "Add a product", param: "add", value: "1" }],
  },
  {
    id: "account",
    label: "Account settings",
    route: "/account",
    triggers: [
      panel("theme", "Theme"),
      panel("language", "Language"),
      panel("notifications", "Notifications"),
      panel("name", "Username"),
      panel("credits", "Credits"),
    ],
  },
  { id: "looks", label: "Looks", route: "/looks", triggers: [] },
];

export const WEB_LINK = "link";

const WEB_URL = /^https?:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#]\S*)?$/i;

export const isWebUrl = (url: string | null | undefined): boolean =>
  typeof url === "string" && url.length <= 255 && WEB_URL.test(url);

export const openNewsUrl = (url: string | null | undefined) => {
  if (url && isWebUrl(url)) {
    Linking.openURL(url).catch(() => {});
    return;
  }
  if (typeof url === "string" && url.startsWith("/")) router.navigate(url as never);
};

export const ACCOUNT_LINK_PANELS = ["theme", "language", "notifications", "name", "credits"] as const;

export const newsUrl = (viewId: string | null, triggerId: string | null) => {
  const view = NEWS_VIEWS.find((entry) => entry.id === viewId);
  if (!view) return null;
  const trigger = view.triggers.find((entry) => entry.id === triggerId);
  return trigger ? `${view.route}?${trigger.param}=${trigger.value}` : view.route;
};

export const describeNewsUrl = (url: string | null) => {
  if (!url) return "No action";
  if (isWebUrl(url)) return `Web link → ${url.replace(/^https?:\/\//i, "")}`;
  const [route, query = ""] = url.split("?");
  const view = NEWS_VIEWS.find((entry) => entry.route === route);
  if (!view) return url;
  const trigger = view.triggers.find((entry) => query === `${entry.param}=${entry.value}`);
  return trigger ? `${view.label} → ${trigger.label}` : view.label;
};

export const parseNewsUrl = (url: string | null) => {
  if (!url) return { viewId: null, triggerId: null };
  if (isWebUrl(url)) return { viewId: WEB_LINK, triggerId: null };
  const [route, query = ""] = url.split("?");
  const view = NEWS_VIEWS.find((entry) => entry.route === route);
  const trigger = view?.triggers.find((entry) => query === `${entry.param}=${entry.value}`);
  return { viewId: view?.id ?? null, triggerId: trigger?.id ?? null };
};
