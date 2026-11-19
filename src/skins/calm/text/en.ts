const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const foods = (count: number) => `${count} ${count === 1 ? "item" : "items"}`;

const joined = (names: string[]) => {
  const words = names.map((name, index) =>
    index === 0 ? name : name.toLowerCase(),
  );
  return words.length < 2
    ? (words[0] ?? "")
    : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
};

const en = {
  date: (date: Date) => {
    const parts = dateFormat.formatToParts(date);
    const part = (type: string) =>
      parts.find((entry) => entry.type === type)?.value ?? "";
    return `${part("weekday")}, ${part("day")} ${part("month")}`;
  },
  browseInventory: "Open the pantry",
  close: "Close",
  done: "Done.",
  loading: "Loading",
  trying: "Trying…",
  tryAgain: "Try again",
  errorTitle: "Couldn't connect.",
  errorLine: "Check your connection and try again. Nothing was lost.",
  tabNews: (tab: string) => `${tab}, there is news`,
  tabWaiting: (tab: string) => `${tab}, a sort is waiting`,
  intent: { left: "Need it", up: "Not sure", right: "Have it" },
  home: {
    allSetLine:
      "Nothing to sort and nothing to buy. Kilist will ask when something might be running low.",
    toCheck: (count: number) => `${foods(count)} to sort`,
    checkLine:
      "About half a minute. It keeps the list right, and each answer earns points toward other looks.",
    onTheList: "On the list",
    more: (count: number) => `and ${count} more`,
    ready: "Your list is ready.",
    goShop: "Go shopping",
    sortTime: "30 s",
    sortPoints: (points: number) => `+${points} points`,
  },
  stock: { sure: "To buy", maybe: "Maybe", stocked: "In stock" },
  play: {
    question: "Do you still have some?",
    partnerSaid: (name: string, isInStock: boolean | null) =>
      `${name}: ${isInStock === null ? "not sure" : isInStock ? "still some" : "none left"}`,
    position: (at: number, total: number) => `${at} of ${total}`,
    showLabels: "Show button labels",
    undo: "Undo the last card",
    ariaOut: "Out of stock",
    ariaIn: "In stock",
    added: (count: number) => `${foods(count)} added to your list.`,
    nothingNew: "Nothing new to buy. The list is up to date.",
    replay: "Replay today's round",
    sorted: "Sorted",
    today: "For today.",
    playAgainTip: "Play another game to sort more items",
    howAria: "How it works",
  },
  shop: {
    otherAisle: "Other",
    manageAisles: "Manage",
    manageAislesAria: "Give an aisle to the items in Other",
    aislesTitle: "Give them an aisle",
    aisleSearch: "Aisle or item name",
    aisleNoMatch: "No aisle matches.",
    aisleClear: "Clear search",
    aisleOpen: (name: string) => `Choose an aisle for ${name}`,
    aislePicked: (name: string, aisle: string) => `${name}, ${aisle}. Change the aisle`,
    aislesDone: "Done",
    aislesConfirmTitle: "Keep the aisles you picked?",
    aislesConfirmLine: (count: number) =>
      count === 1 ? "1 item has a new aisle." : `${count} items have a new aisle.`,
    aislesConfirmKeep: "Keep editing",
    aislesConfirmSave: "Save them",
    aislesConfirmDiscard: "Discard all",
    title: "List",
    toBuy: (count: number) => `${count} to buy`,
    hint: "Swipe right when it's in the basket, left for next time.",
    hintAria:
      "Swipe right when it's in the basket, left to keep it for next time",
    inBasket: "In the basket",
    inBasketAria: (name: string) => `${name}, in the basket`,
    nextTime: "Next time",
    later: "Later",
    usuallyNext: "Usually next",
    result: (bought: number, left: number) =>
      `${bought} bought${left ? `, ${left} left for next time` : ""}.`,
    closeRun: "Done",
    legendBasket: "In the basket",
    howAria: "How it works",
    selectToEdit: "Tap to postpone, hold to edit",
    holdToEdit: "Hold to edit",
  },
  inventory: {
    closeSearch: "Close search",
    addQuery: (query: string) => `Add “${query}”`,
    noResultsLine: "Add it and Kilist will start keeping track of it.",
    emptyLine:
      "Add the items you usually buy, and Kilist keeps the list for you.",
  },
  tutorial: {
    skip: "Skip",
    profileTitle: "What do you eat?",
    profileLine: "We fill your inventory for you. You can change it later.",
    questionAt: (at: number, total: number) => `Question ${at} of ${total}`,
    questionNext: "Next",
    questionBack: "Back",
    questions: {
      diet: {
        title: "What do you eat?",
        line: "Pick the closest one.",
      },
      avoid: {
        title: "What don't you eat?",
        line: "Pick all that apply, or none.",
      },
      drinks: {
        title: "What do you drink?",
        line: "Pick all that apply, or none.",
      },
      home: {
        title: "Any pets?",
        line: "Pick all that apply, or none.",
      },
      kids: { title: "Kids?", line: "Children who live with you." },
      extras: {
        title: "Anything else you buy?",
        line: "Not just food. Pick all that apply, or none.",
      },
      baking: { title: "Do you bake?", line: "Flour, sugar and the like." },
    },
    answers: {
      everything: "A bit of everything",
      noPork: "No pork",
      noMeat: "Fish, but no meat",
      veggie: "Vegetarian",
      dairy: "Dairy",
      gluten: "Gluten",
      shellfish: "Shellfish",
      egg: "Eggs",
      peanut: "Peanuts",
      nuts: "Tree nuts",
      soy: "Soy",
      coffee: "Coffee",
      tea: "Tea",
      soda: "Soda",
      beer: "Beer",
      wine: "Wine",
      spirits: "Spirits",
      cat: "A cat",
      dog: "A dog",
      bird: "A bird",
      rabbit: "A rabbit",
      rodent: "A hamster or guinea pig",
      aquarium: "Fish",
      bathroom: "Bathroom",
      cleaning: "Cleaning products",
      dishwasher: "Dishwasher",
      yes: "Yes",
      no: "No",
    } as Record<string, string>,
    profileCount: (count: number) =>
      `${foods(count)} will be added to your inventory.`,
    reviewTitle: "Refine your selection",
    reviewLine: "Picked from your answers. Tap any item to add or remove it.",
    refineTitle: "Your items",
    refineLine:
      "The items you already have are selected. Tap any item to add or remove it.",
    refineCount: (add: number, remove: number) =>
      add + remove === 0
        ? "No changes yet."
        : [add > 0 && `${add} to add`, remove > 0 && `${remove} to remove`]
            .filter(Boolean)
            .join(", ") + ".",
    profileOffline:
      "The item list isn't downloaded yet. You can add your items later from the inventory.",
    profileDone: "Done",
    profileAdding: "Adding…",
    samples: ["Bananas", "Milk", "Rice", "Eggs", "Coffee"],
    readyLabel: "Practice",
    readyTitle: "Let's practice.",
    readyLine: (cards: number) => `${cards} cards, then a short list.\nNothing is saved.`,
    readyGo: "Let's go",
    practiceLabel: (at: number, total: number) =>
      `Practice · ${at} of ${total}`,
    stamps: { left: "Out", right: "Have it", up: "Not sure" },
    promptFirst: (name: string) => `Do you still have ${name.toLowerCase()}?`,
    summaryTitle: "Here's what happened",
    summaryOut: (names: string[]) =>
      `${joined(names)} ${names.length > 1 ? "go" : "goes"} on your shopping list.`,
    summaryIn: (names: string[]) =>
      `${joined(names)} ${names.length > 1 ? "stay" : "stays"} off your list, you still have some.`,
    summaryUnsure: (names: string[]) =>
      `We'll ask you about ${joined(names).toLowerCase()} again later.`,
    summaryEnd:
      "A few swipes now and then, and your shopping list is always up to date.",
    seeList: "See my shopping list",
    shopLabel: "Practice · your list",
    shopTitle: (count: number) => `${count} to buy`,
    shopBought: "Bought. It's back in stock.",
    shopSwipeTitle: "When shopping",
    shopSwipeHint: "Swipe it right into your basket.",
    shopLaterTitle: "Not today?",
    shopLaterHint: "Swipe it left to keep it for next time.",
    doneLabel: "Practice done",
    doneTitle: "That's all there is to it.",
    doneSteps: [
      "Each day, sort 10 items.",
      "What you're out of lands on your list.",
      "In the store,\nswipe products to your basket.",
    ],
    doneNote:
      "That was practice, nothing was saved.\nYour first real round earns points.",
    start: "Start my first round",
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
