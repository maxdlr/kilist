import {
  generateColorGradient,
  generateColorVariants,
  hexToHsl,
  hslToHex,
  transparentColor,
} from "@/utils/colorUtils";
import type { CalmElements } from "./index";

export const CUSTOM_NAME = { en: "Custom", fr: "Perso" };

export const DEFAULT_CUSTOM_COLOR = "#390000";

const MAX_LIGHTNESS = 0.4;
const EMPHASIS_HUE_SHIFT = -36;
const EMPHASIS_LIGHTEN = 2.5;
const EMPHASIS_MAX_LIGHTNESS = 0.55;

const colors = {
  sage500: "#7FA982",
  sage300: "#B9D1B2",
  coral: "#FF9A88",
};

export const readableBase = (hex: string) => {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex({ h, s, l: Math.min(l, MAX_LIGHTNESS) });
};

const emphasisOf = (hex: string) => {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex({
    h: (h + EMPHASIS_HUE_SHIFT + 360) % 360,
    s,
    l: Math.min(EMPHASIS_MAX_LIGHTNESS, l * EMPHASIS_LIGHTEN),
  });
};

export const customElements = (color: string): CalmElements => {
  const baseHex = readableBase(color);
  const base = generateColorVariants(baseHex);
  const foods = generateColorGradient("#FFFFFF", base[50]);
  const emphasis = generateColorVariants(emphasisOf(baseHex));
  const veil = transparentColor(base[100], 0.5);

  return {
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
    scrim: veil,
    gameCard: {
      front: { fill: base[5], border: base[20] },
      behind: { fill: base[40], border: base[60], contentOpacity: 0.35 },
      border: { width: 1, radius: 39 },
      title: base[70],
      question: base[60],
      buttons: {
        idle: { fill: base[60], border: base[60], ink: base[5] },
        active: { fill: base[10], border: base[5], ink: base[80] },
        haveItIcon: base[20],
        unsure: {
          idle: { fill: "transparent", border: base[40], ink: base[50] },
          active: { fill: base[10], border: base[5], ink: base[5] },
        },
      },
    },
    gameHeader: {
      icon: base[20],
      iconActive: base[5],
      iconStroke: 1.8,
      undoDisabledOpacity: 0.3,
      counter: base[20],
      hint: { out: base[5], unsure: base[20], haveIt: base[20] },
      progress: { track: base[70], fill: base[5], height: 2 },
    },
    newsCard: {
      fill: base[60],
      border: base[40],
      title: base[5],
      body: base[20],
      icon: colors.sage300,
      close: base[30],
    },
    sortCard: {
      fill: base[5],
      border: base[30],
      title: base[100],
      facts: base[70],
      icon: base[100],
      arrow: base[100],
    },
    bottomPanel: {
      glassSettings: {
        enabled: true,
        blur: 30,
        androidReduction: 4,
        veil: 0.8,
      },
      border: {
        gradientStroke: {
          start: "white",
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
      line: base[40],
      fieldLine: base[40],
      ring: emphasis[30],
      fill: base[5],
      onFill: emphasis[70],
      danger: colors.coral,
    },
  };
};
