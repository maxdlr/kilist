import {
  generateColorGradient,
  generateColorVariants,
  transparentColor,
} from "@/utils/colorUtils";
import type { CalmElements } from "../themes";

export const name = { en: "Dark", fr: "Sombre" };

const base = generateColorVariants("#312855");
const foods = generateColorGradient("#287EFF", "#49C67B");
const emphasis = generateColorVariants("#492AC6");
// const accent = generateColorVariants("#FFB443");
const accentToBaseGradient = generateColorGradient("#A1C7FF", base[50]);

export const colors = {
  // paper: "#F6F4EF",
  // white: "#FFFFFF",
  // black: "#000000",
  // ink: "#23221F",
  // stone700: "#5F5D57",
  // stone500: "#8B887F",
  // stone400: "#A8A399",
  // stone300: "#D6D1C6",
  // stone200: "#E4E0D7",
  // stone100: "#EFECE5",
  // sage700: "#3F6A47",
  // sage600: "#5E8A63",
  sage500: "#7FA982",
  sage300: "#B9D1B2",
  // sand: "#D8D2C4",
  // peach: "#E3C3AE",
  // clay: "#D49A8F",
  veil: transparentColor(base[100], 0.5),
};

export const elements: CalmElements = {
  statusBar: "light",
  ground: base[70],
  card: base[80],
  tint: base[50],
  text: accentToBaseGradient[5],
  textSoft: accentToBaseGradient[30],
  textFaint: accentToBaseGradient[50],
  line: base[70],
  fieldLine: base[40],
  ring: base[30],
  fill: base[10],
  onFill: base[80],
  positive: colors.sage300,
  onPositive: base[90],
  negative: base[5],
  danger: base[5],
  success: colors.sage500,
  pendingDot: foods[30],
  barMaybe: foods[50],
  levels: {
    1: foods[20],
    2: foods[40],
    3: foods[50],
    4: foods[60],
    5: foods[80],
  },
  onLevel: base[5],
  scrim: colors.veil,
  em: {
    ground: emphasis[70],
    card: emphasis[80],
    tint: emphasis[50],
    text: accentToBaseGradient[5],
    textSoft: accentToBaseGradient[50],
    textFaint: accentToBaseGradient[60],
    line: emphasis[70],
    fieldLine: accentToBaseGradient[80],
    ring: emphasis[30],
    fill: accentToBaseGradient[30],
    onFill: emphasis[80],
    danger: emphasis[5],
  },
};
