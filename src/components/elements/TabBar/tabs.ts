export const MAIN_TABS = ["index", "swipe", "shop"];

export const shownTab = (name?: string) => (name && MAIN_TABS.includes(name) ? name : "index");
