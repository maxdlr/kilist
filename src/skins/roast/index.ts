import type { SkinSource } from "../types";
import roastCopy from "./copy";

const NARROW = new Set([..."IJ1.,:;'!|()[]-"]);
const WIDE = new Set([..."MW%"]);

const ink = "#0A0A0A";
const acid = "#D7FF3E";
const orange = "#FF4D1F";
const white = "#FFFFFF";
const blue = "#2F5BFF";

const roast: SkinSource = {
  id: "roast",
  name: "ROAST",
  premium: true,
  statusBarOnGround: "light",
  textCase: "upper",
  game: {
    stamp: "shout",
    strikeInventoryTab: true,
  },
  fonts: {
    display: {
      family: "Anton-Regular",
      lineHeight: 1.22,
      charWidth: (char) => {
        if (char === " ") return 0.22;
        if (NARROW.has(char)) return 0.28;
        if (WIDE.has(char)) return 0.74;
        if (char >= "0" && char <= "9") return 0.5;
        return 0.54;
      },
    },
    mono: "SpaceMono-Regular",
  },
  colors: {
    ground: ink,
    onGround: white,
    accent: acid,
    muted: "#B0B0B0",
    raised: "#2E2E2E",
    paper: white,
    onPaper: ink,
    placeholder: "#5A5A5A",
    scrim: "rgba(0,0,0,0.72)",
    danger: orange,
    alert: orange,
    onAlert: ink,
    success: acid,
    levels: {
      1: acid,
      2: "#EEFF9E",
      3: white,
      4: "#FFB59E",
      5: orange,
    },
    onLevel: ink,
    sheets: [
      { fill: acid, ink },
      { fill: ink, ink: acid },
      { fill: orange, ink },
      { fill: white, ink },
    ],
  },
  actions: {
    primary: { fill: blue, ink: white, line: blue },
    secondary: { fill: "transparent", ink: white, line: white },
    secondaryOnLight: { fill: "transparent", ink, line: ink },
    danger: { fill: "transparent", ink: orange, line: orange },
    ghost: { fill: "transparent", ink: white, line: "transparent" },
    attached: { fill: ink, ink: white, line: white },
  },
  panel: {
    fill: ink,
    ink: white,
    title: acid,
    line: acid,
    radius: 0,
    secondary: "secondary",
  },
  shape: {
    border: 3,
    divider: 2,
    accentBorder: 6,
    radius: 0,
    pressedOpacity: 0.7,
    stampShadow: 5,
    fieldBorder: 0,
    shadow: { offset: 0, color: ink },
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
    button: { xs: 44, sm: 52, md: 62, lg: 72, xl: 84 },
    row: { list: 62, shop: 76, stripe: 58 },
    tabBar: 62,
    input: 52,
    toggle: 50,
    check: 28,
    meter: 18,
    swatch: 22,
    scanner: 220,
    qr: 210,
    panelList: 420,
    icon: { action: 36, row: 48, card: 150 },
  },
  type: {
    mono: 15,
    caption: 18,
    label: 20,
    body: 24,
    lead: 30,
    title: 34,
    headline: 42,
    display: { sm: 56, md: 80, lg: 100, xl: 140, stamp: 130 },
  },
  copies: roastCopy,
};

export default roast;
