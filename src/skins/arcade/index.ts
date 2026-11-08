import type { SkinSource } from "../types";
import arcadeCopy from "./copy";

const NARROW = new Set([..."iljtfrI1.,:;'!|()[]-"]);
const WIDE = new Set([..."mwMW%@"]);

const navy = "#0B2E59";
const purple = "#6A3FC8";
const yellow = "#FFD84D";
const white = "#FFFFFF";
const coral = "#FF8E8E";
const mint = "#7CF29A";
const pale = "#E3EEFB";

export const arcadePalette = {
  navy,
  purple,
  yellow,
  white,
  coral,
  mint,
  pale,
  deepNavy: "#1E4C86",
  softNavy: "#BFD2F0",
  dash: "#4D6C99",
  plank: "#FFC9AE",
  lilac: "#D9CCF5",
  shutter: "#B9A6E8",
  dimInk: "#5B6B85",
  grip: "#C9D4E5",
  plankShadow: "rgba(11,46,89,0.55)",
};

const arcade: SkinSource = {
  id: "arcade",
  name: "Arcade",
  premium: false,
  statusBarOnGround: "light",
  textCase: "none",
  game: {
    stamp: "sticker",
    strikeInventoryTab: false,
  },
  fonts: {
    display: {
      family: "MadimiOne-Regular",
      lineHeight: 1.18,
      charWidth: (char) => {
        if (char === " ") return 0.26;
        if (NARROW.has(char)) return 0.32;
        if (WIDE.has(char)) return 0.82;
        if (char >= "A" && char <= "Z") return 0.64;
        return 0.54;
      },
    },
    mono: "SpaceMono-Regular",
  },
  colors: {
    ground: purple,
    onGround: white,
    accent: white,
    muted: "#D9CCF5",
    raised: "#5530A8",
    paper: white,
    onPaper: navy,
    placeholder: "#5B6B85",
    scrim: "rgba(11,46,89,0.62)",
    danger: coral,
    alert: coral,
    onAlert: navy,
    success: mint,
    levels: {
      1: mint,
      2: "#C9F7B0",
      3: "#E3EEFB",
      4: "#FFC9AE",
      5: coral,
    },
    onLevel: navy,
    sheets: [
      { fill: purple, ink: white },
      { fill: "#1A6FD1", ink: white },
      { fill: "#0B6E78", ink: white },
      { fill: white, ink: navy },
    ],
  },
  actions: {
    primary: { fill: yellow, ink: navy, line: navy },
    secondary: { fill: "transparent", ink: white, line: white },
    secondaryOnLight: { fill: "transparent", ink: navy, line: navy },
    danger: { fill: "transparent", ink: coral, line: coral },
    ghost: { fill: "transparent", ink: white, line: "transparent" },
    attached: { fill: "#E3EEFB", ink: navy, line: navy },
  },
  panel: {
    fill: white,
    ink: navy,
    title: navy,
    line: navy,
    radius: 30,
    secondary: "secondaryOnLight",
  },
  shape: {
    border: 3,
    divider: 3,
    accentBorder: 3,
    radius: 22,
    pressedOpacity: 0.8,
    stampShadow: 0,
    fieldBorder: 3,
    shadow: { offset: 5, color: navy },
  },
  spacing: {
    hair: 2,
    tight: 4,
    small: 8,
    page: 48,
    gutter: 24,
    inline: 12,
    stack: 16,
    dock: 14,
    section: 20,
    top: 20,
  },
  size: {
    button: { xs: 44, sm: 52, md: 60, lg: 68, xl: 76 },
    row: { list: 62, shop: 72, stripe: 58 },
    tabBar: 82,
    input: 52,
    toggle: 50,
    check: 28,
    meter: 14,
    swatch: 22,
    scanner: 220,
    qr: 210,
    panelList: 420,
    icon: { action: 32, row: 44, card: 150 },
  },
  type: {
    mono: 15,
    caption: 15,
    label: 17,
    body: 19,
    lead: 24,
    title: 28,
    headline: 34,
    display: { sm: 34, md: 44, lg: 52, xl: 96, stamp: 30 },
  },
  copies: arcadeCopy,
};

export default arcade;
