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
          idle: { fill: "transparent", border: base[40], ink: base[60] },
          active: { fill: "transparent", border: base[5], ink: base[5] },
        },
      },
    },
    introDemo: { rowBorder: base[40] },
    tutorialCaption: {
      fill: base[60],
      border: base[60],
      title: base[5],
      line: base[20],
      hint: { left: base[5], up: base[20], right: colors.sage300 },
    },
    shopList: {
      header: {
        idle: { fill: base[70], title: base[5], subtitle: base[20] },
        running: {
          fill: base[5],
          title: base[80],
          subtitle: base[40],
          toggleLabel: base[40],
        },
      },
      aisle: {
        title: {
          idle: base[40],
          focused: base[20],
          targeted: base[5],
          next: base[20],
        },
        corner: { idle: base[40], focused: base[30], started: colors.sage300 },
        track: { idle: base[40], focused: base[30] },
        progress: colors.sage300,
        nextBar: base[5],
        dimmedOpacity: 0.2,
      },
      row: {
        fill: base[70],
        selected: base[60],
        divider: base[60],
        swipe: {
          idle: { fill: base[60], ink: base[20] },
          buy: { fill: colors.sage300, ink: base[90] },
          later: { fill: base[20], ink: base[80] },
        },
        done: { opacity: 0.45, tagLine: base[40], tagInk: base[20] },
      },
      next: {
        idle: { fill: base[70], line: base[70] },
        running: { fill: base[70], line: base[70] },
      },
      rail: {
        pip: base[40],
        pipOn: base[5],
        pill: { fill: base[80], line: base[70], ink: base[20] },
        pillOn: { fill: base[5], ink: base[80], shadow: veil },
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
