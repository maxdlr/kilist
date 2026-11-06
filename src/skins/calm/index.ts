import type { Skin } from "../types";
import calmCopy from "./copy";

const NARROW = new Set([..."iljtfrI1.,:;'!|()[]-"]);
const WIDE = new Set([..."mwMW%@"]);

const ground = "#F6F4EF";
const ink = "#23221F";
const white = "#FFFFFF";
const rust = "#8F4F43";

export const calmPalette = {
  ground,
  ink,
  white,
  soft: "#5F5D57",
  faint: "#8B887F",
  hairline: "#E4E0D7",
  field: "#D6D1C6",
  ring: "#A8A399",
  tint: "#EFECE5",
  danger: rust,
  pending: "#5E8A63",
  haveIt: "#3F6A47",
  needIt: rust,
};

const calm: Skin = {
  id: "calm",
  name: "Calm",
  tagline: "Quiet, no games.",
  premium: false,
  statusBarOnGround: "dark",
  textCase: "none",
  game: {
    stamp: "sticker",
    strikeListTab: false,
  },
  fonts: {
    display: {
      family: "Inter-Medium",
      lineHeight: 1.25,
      charWidth: (char) => {
        if (char === " ") return 0.26;
        if (NARROW.has(char)) return 0.28;
        if (WIDE.has(char)) return 0.84;
        if (char >= "A" && char <= "Z") return 0.68;
        return 0.56;
      },
    },
    mono: "Inter-Regular",
    body: { regular: "Inter-Regular", medium: "Inter-Medium", bold: "Inter-SemiBold" },
  },
  colors: {
    ground,
    onGround: ink,
    accent: ink,
    muted: "#5F5D57",
    raised: "#EFECE5",
    paper: white,
    onPaper: ink,
    fieldLine: "#D6D1C6",
    signup: { fill: ground, ink },
    toast: { fill: ink, ink: ground },
    placeholder: "#8B887F",
    scrim: "rgba(35,34,31,0.32)",
    danger: rust,
    alert: rust,
    onAlert: white,
    success: "#5E8A63",
    levels: {
      1: "#7FA982",
      2: "#B9D1B2",
      3: "#D8D2C4",
      4: "#E3C3AE",
      5: "#D49A8F",
    },
    onLevel: ink,
    sheets: [
      { fill: ground, ink },
      { fill: white, ink },
      { fill: "#EFECE5", ink },
      { fill: white, ink },
    ],
  },
  actions: {
    primary: { fill: ink, ink: ground, line: ink },
    secondary: { fill: "transparent", ink, line: "#D6D1C6" },
    secondaryOnLight: { fill: "transparent", ink, line: "#D6D1C6" },
    danger: { fill: "transparent", ink: rust, line: rust },
    ghost: { fill: "transparent", ink: "#5F5D57", line: "transparent" },
    attached: { fill: white, ink, line: "#D6D1C6" },
  },
  panel: {
    fill: white,
    ink,
    title: ink,
    line: "#E4E0D7",
    radius: 20,
    secondary: "secondaryOnLight",
  },
  shape: {
    border: 1,
    divider: 1,
    accentBorder: 1,
    radius: 14,
    pressedOpacity: 0.7,
    stampShadow: 0,
    fieldBorder: 1,
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
    dock: 16,
    section: 24,
    top: 24,
  },
  size: {
    button: { xs: 44, sm: 46, md: 50, lg: 54, xl: 54 },
    row: { list: 56, shop: 56, stripe: 48 },
    tabBar: 64,
    input: 50,
    toggle: 44,
    check: 22,
    meter: 2,
    swatch: 22,
    scanner: 220,
    qr: 200,
    panelList: 420,
    icon: { action: 22, row: 36, card: 120 },
  },
  type: {
    mono: 16,
    caption: 13,
    label: 14,
    body: 16,
    lead: 17,
    title: 22,
    headline: 28,
    display: { sm: 28, md: 32, lg: 32, xl: 40, stamp: 16 },
  },
  copy: calmCopy,
};

export default calm;
