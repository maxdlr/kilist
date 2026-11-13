import type { CalmElements } from "../themes";

export const name = { en: "Light", fr: "Clair" };

export const colors = {
  paper: "#F6F4EF",
  white: "#FFFFFF",
  ink: "#23221F",
  stone700: "#5F5D57",
  stone500: "#8B887F",
  stone400: "#A8A399",
  stone300: "#D6D1C6",
  stone200: "#E4E0D7",
  stone100: "#EFECE5",
  sage700: "#3F6A47",
  sage600: "#5E8A63",
  sage500: "#7FA982",
  sage300: "#B9D1B2",
  sand: "#D8D2C4",
  peach: "#E3C3AE",
  clay: "#D49A8F",
  veil: "rgba(35,34,31,0.32)",
};

export const elements: CalmElements = {
  statusBar: "dark",
  ground: colors.paper,
  card: colors.white,
  tint: colors.stone100,
  text: colors.ink,
  textSoft: colors.stone700,
  textFaint: colors.stone500,
  line: colors.stone200,
  fieldLine: colors.stone300,
  ring: colors.stone400,
  fill: colors.ink,
  onFill: colors.paper,
  positive: colors.sage700,
  onPositive: colors.white,
  negative: colors.ink,
  danger: colors.ink,
  success: colors.sage600,
  pendingDot: colors.sage600,
  barMaybe: colors.stone400,
  levels: {
    1: colors.sage500,
    2: colors.sage300,
    3: colors.sand,
    4: colors.peach,
    5: colors.clay,
  },
  onLevel: colors.ink,
  scrim: colors.veil,
};
