import common from "@/i18n/common";

export const MAIN_TABS = ["swipe", "shop", "index"];

export const shownTab = (name?: string) => (name && MAIN_TABS.includes(name) ? name : "index");

/** Accessible name of a tab, shared by every skin's tab bar. */
export const tabAria = (name: string) => common.tabs[name as keyof typeof common.tabs] ?? name;
