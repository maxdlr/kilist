export const MAIN_TABS = ["swipe", "shop", "index"];

export const shownTab = (name?: string) => (name && MAIN_TABS.includes(name) ? name : "index");
