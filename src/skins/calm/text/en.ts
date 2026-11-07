const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

const foods = (count: number) => `${count} ${count === 1 ? "food" : "foods"}`;

const en = {
  date: (date: Date) => {
    const parts = dateFormat.formatToParts(date);
    const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
    return `${part("weekday")}, ${part("day")} ${part("month")}`;
  },
  openList: "Open the list",
  browseFoods: "Browse foods",
  close: "Close",
  back: "Back",
  done: "Done.",
  loading: "Loading",
  trying: "Trying…",
  tryAgain: "Try again",
  errorTitle: "Couldn't connect.",
  errorLine: "Check your connection and try again. Nothing was lost.",
  tabWaiting: (tab: string) => `${tab}, a check is waiting`,
  intent: { left: "Need it", up: "Not sure", right: "Have it" },
  home: {
    check: (count: number) => `Check ${foods(count)}`,
    allSetLine: "Nothing to check and nothing to buy. Kilist will ask when something might be running low.",
    toCheck: (count: number) => `${foods(count)} to check`,
    checkLine: "About half a minute. It keeps the list right, and each answer earns points toward other looks.",
    onTheList: "On the list",
    more: (count: number) => `and ${count} more`,
  },
  play: {
    question: "Do you still have some?",
    position: (at: number, total: number) => `${at} of ${total}`,
    ariaOut: "Out of stock",
    ariaIn: "In stock",
    added: (count: number) => `${foods(count)} added to your list.`,
    nothingNew: "Nothing new to buy. The list is up to date.",
    points: "Points toward other looks",
    pointsTotal: (earned: number, total: number) => `+${earned} · ${total} in total`,
  },
  shop: {
    title: "List",
    toBuy: (count: number) => `${count} to buy`,
    hint: "Swipe right when it's in the basket, left for next time.",
    hintAria: "Swipe right when it's in the basket, left to keep it for next time",
    inBasket: "In the basket",
    inBasketAria: (name: string) => `${name}, in the basket`,
    nextTime: "Next time",
    later: "Later",
    usuallyNext: "Usually next",
    result: (bought: number, left: number) => `${bought} bought${left ? `, ${left} left for next time` : ""}.`,
    backToday: "Back to today",
    doneShopping: "Done shopping",
  },
  foods: {
    clear: "Clear",
    addQuery: (query: string) => `Add “${query}”`,
    noResultsLine: "Add it and Kilist will start keeping track of it.",
    emptyLine: "Add the foods you usually buy, and Kilist keeps the list for you.",
  },
  settings: {
    title: "Settings",
    account: "Account",
    with: (names: string[]) => `with ${names.join(", ")}`,
    justYou: "Just you",
    invite: "Invite someone",
    share: "Share the code",
    app: "App",
  },
};

export type CalmText = typeof en;

export default en;
