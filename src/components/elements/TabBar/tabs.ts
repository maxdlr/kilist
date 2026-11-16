import common from "@/i18n/common";

export const MAIN_TABS = ["swipe", "shop", "index"];

export const shownTab = (name?: string) => (name && MAIN_TABS.includes(name) ? name : "index");

export const tabAria = (name: string) => common.tabs[name as keyof typeof common.tabs] ?? name;
