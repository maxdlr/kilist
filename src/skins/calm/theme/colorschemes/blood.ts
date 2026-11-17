import {
  generateColorGradient,
  generateColorVariants,
  transparentColor,
} from "@/utils/colorUtils";
import type { CalmElements } from "../index";

export const name = { en: "Blood", fr: "Sang" };

const base = generateColorGradient("#C9FFBC", "#710000");
const foods = generateColorGradient("#FFFFFF", base[50]);
const emphasis = generateColorVariants("#38C615");

export const colors = {
  sage500: "#7FA982",
  sage300: "#B9D1B2",
  veil: transparentColor(base[100], 0.5),
  coral: "#FF9A88",
};

export const elements: CalmElements = {
  statusBar: "light",
  ground: base[70],
  card: base[80],
  tint: base[60],
  text: base[5],
  textSoft: base[20],
  textFaint: base[40],
  line: base[70],
  fieldLine: base[40],
  ring: base[30],
  fill: base[5],
  onFill: base[80],
  positive: colors.sage300,
  onPositive: base[90],
  negative: base[5],
  danger: colors.coral,
  success: colors.sage500,
  pendingDot: foods[30],
  barMaybe: foods[50],
  levels: {
    1: foods[5],
    2: foods[30],
    3: foods[50],
    4: foods[60],
    5: foods[90],
  },
  onLevel: base[5],
  scrim: colors.veil,
  bottomPanel: {
    glassSettings: {
      enabled: true,
      blur: 30,
      androidReduction: 4,
      veil: 0.8,
    },
    border: {
      gradientStroke: {
        start: base[5],
        end: base[70],
        midPoint: 0.5,
      },
      width: 1,
    },
    grip: {
      width: 48,
      height: 5,
      color: base[5],
      opacity: 0.3,
    },
  },
  em: {
    ground: emphasis[70],
    card: base[80],
    tint: emphasis[50],
    text: base[5],
    textSoft: base[20],
    textFaint: base[30],
    line: emphasis[40],
    fieldLine: emphasis[40],
    ring: emphasis[30],
    fill: base[5],
    onFill: emphasis[80],
    danger: colors.coral,
  },
};
