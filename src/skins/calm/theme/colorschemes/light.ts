import { generateColorGradient } from "@/utils/colorUtils";
import type { CalmElements } from "../index";

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
  brick: "#A8432F",
};

const foods = generateColorGradient(colors.ink, colors.paper);

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
  danger: colors.brick,
  success: colors.sage600,
  pendingDot: colors.sage600,
  barMaybe: colors.stone400,
  levels: {
    1: foods[10],
    2: foods[40],
    3: foods[50],
    4: foods[60],
    5: foods[80],
  },
  onLevel: colors.ink,
  scrim: colors.veil,
  gameCard: {
    front: { fill: colors.white, border: colors.stone200 },
    behind: {
      fill: colors.stone100,
      border: colors.stone100,
      contentOpacity: 0.35,
    },
    border: { width: 1, radius: 39 },
    title: colors.ink,
    question: colors.stone700,
    buttons: {
      idle: { fill: colors.stone100, border: colors.stone100, ink: colors.ink },
      active: { fill: colors.ink, border: colors.ink, ink: colors.paper },
      haveItIcon: colors.sage700,
      unsure: {
        idle: {
          fill: "transparent",
          border: colors.stone300,
          ink: colors.stone700,
        },
        active: { fill: "transparent", border: colors.ink, ink: colors.ink },
      },
    },
  },
  gameHeader: {
    icon: colors.stone700,
    iconActive: colors.ink,
    iconStroke: 1.8,
    undoDisabledOpacity: 0.3,
    counter: colors.stone700,
    hint: { out: colors.ink, unsure: colors.stone700, haveIt: colors.sage700 },
    progress: { track: colors.stone200, fill: colors.ink, height: 2 },
  },
  newsCard: {
    fill: colors.stone100,
    border: colors.stone300,
    title: colors.ink,
    body: colors.stone700,
    icon: colors.sage700,
    close: colors.stone500,
  },
  sortCard: {
    fill: colors.white,
    border: colors.stone200,
    title: colors.ink,
    facts: colors.stone700,
    icon: colors.sage700,
    arrow: colors.stone500,
  },
  bottomPanel: {
    border: {
      gradientStroke: {
        start: colors.white,
        end: colors.ink,
        midPoint: 0.8,
      },
      width: 2,
    },
    grip: {
      width: 48,
      height: 5,
      color: colors.ink,
      opacity: 0.3,
    },
  },
  em: {
    card: colors.paper,
    line: colors.white,
  },
};
