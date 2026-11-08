import type { SkinSource } from "../types";
import versusCopy from "./copy";

const NARROW = new Set([..."IJ1.,:;'!|()[]-"]);
const WIDE = new Set([..."MW%@"]);

const ground = "#16122E";
const panel = "#221C44";
const white = "#FFFFFF";
const yellow = "#FFD23F";
const coral = "#FF8E8E";
const mint = "#7CF29A";

export const versusPalette = {
  ground,
  panel,
  panelHigh: "#2C2552",
  line: "#3A3266",
  bar: "#0F0C22",
  white,
  soft: "#D6D1F0",
  muted: "#B7B0D9",
  faint: "#8C85B5",
  you: "#FF5FA2",
  youSoft: "#FF9CC6",
  mates: ["#3FD7F2", "#B79CFF", "#FFB86B", "#7CF29A"],
  action: yellow,
  actionShadow: "#A88512",
  agree: mint,
  clash: "#FF8A3D",
  tie: "#FFD9A8",
  buy: coral,
  danger: "#FFB3B3",
  ink: ground,
  cardInk: "#5B5580",
  cardShadow: "#0B0918",
  scrim: "rgba(10,8,25,0.72)",
};

const versus: SkinSource = {
  id: "versus",
  name: "Versus",
  premium: true,
  statusBarOnGround: "light",
  textCase: "none",
  game: {
    stamp: "sticker",
    strikeInventoryTab: false,
  },
  fonts: {
    display: {
      family: "Bungee-Regular",
      lineHeight: 1.16,
      charWidth: (char) => {
        if (char === " ") return 0.3;
        if (NARROW.has(char)) return 0.36;
        if (WIDE.has(char)) return 0.9;
        return 0.72;
      },
    },
    mono: "SpaceGrotesk-Medium",
    body: {
      regular: "SpaceGrotesk-Regular",
      medium: "SpaceGrotesk-Medium",
      bold: "SpaceGrotesk-Bold",
    },
    pixel: "PressStart2P-Regular",
  },
  colors: {
    ground,
    onGround: white,
    accent: white,
    muted: "#B7B0D9",
    raised: panel,
    paper: white,
    onPaper: ground,
    placeholder: "#6E6890",
    scrim: "rgba(10,8,25,0.72)",
    danger: coral,
    alert: coral,
    onAlert: ground,
    success: mint,
    levels: {
      1: mint,
      2: "#C9F7B0",
      3: "#E3EEFB",
      4: "#FFC9AE",
      5: coral,
    },
    onLevel: ground,
    sheets: [
      { fill: ground, ink: white },
      { fill: panel, ink: white },
      { fill: "#2C2552", ink: white },
      { fill: white, ink: ground },
    ],
  },
  actions: {
    primary: { fill: yellow, ink: ground, line: yellow },
    secondary: { fill: "transparent", ink: white, line: white },
    secondaryOnLight: { fill: "transparent", ink: ground, line: ground },
    danger: { fill: "transparent", ink: "#FFB3B3", line: coral },
    ghost: { fill: "transparent", ink: white, line: "transparent" },
    attached: { fill: "#E3E0F2", ink: ground, line: "#E3E0F2" },
  },
  panel: {
    fill: panel,
    ink: white,
    title: white,
    line: panel,
    radius: 28,
    secondary: "secondary",
  },
  shape: {
    border: 2,
    divider: 1,
    accentBorder: 0,
    radius: 18,
    pressedOpacity: 0.8,
    stampShadow: 0,
    fieldBorder: 0,
    shadow: { offset: 0, color: "#0B0918" },
  },
  spacing: {
    hair: 2,
    tight: 4,
    small: 8,
    page: 48,
    gutter: 20,
    inline: 10,
    stack: 16,
    dock: 16,
    section: 20,
    top: 16,
  },
  size: {
    button: { xs: 44, sm: 46, md: 56, lg: 62, xl: 68 },
    row: { list: 68, shop: 64, stripe: 58 },
    tabBar: 80,
    input: 52,
    toggle: 48,
    check: 26,
    meter: 12,
    swatch: 18,
    scanner: 220,
    qr: 210,
    panelList: 420,
    icon: { action: 26, row: 44, card: 210 },
  },
  type: {
    mono: 15,
    caption: 13,
    label: 15,
    body: 16,
    lead: 18,
    title: 22,
    headline: 26,
    display: { sm: 26, md: 34, lg: 44, xl: 56, stamp: 24 },
  },
  copies: versusCopy,
};

export default versus;
