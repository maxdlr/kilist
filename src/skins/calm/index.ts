import type { SkinSource } from "../types";
import calmCopy from "./copy";
import { CALM_THEMES, DEFAULT_CALM_THEME } from "./themes";

const NARROW = new Set([..."iljtfrI1.,:;'!|()[]-"]);
const WIDE = new Set([..."mwMW%@"]);

const paint = CALM_THEMES.find(
  (theme) => theme.id === DEFAULT_CALM_THEME,
)!.paint;

const calm: SkinSource = {
  id: "calm",
  name: "Calm",
  premium: false,
  statusBarOnGround: paint.statusBarOnGround,
  textCase: "none",
  splash: "centered",
  game: {
    stamp: "sticker",
    strikeInventoryTab: false,
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
    body: {
      regular: "Inter-Regular",
      medium: "Inter-Medium",
      bold: "Inter-SemiBold",
    },
  },
  colors: paint.colors,
  actions: paint.actions,
  panel: { ...paint.panel, radius: 20, secondary: "secondaryOnLight" },
  shape: {
    border: 1,
    divider: 1,
    accentBorder: 1,
    radius: 14,
    pressedOpacity: 0.7,
    stampShadow: 0,
    fieldBorder: 1,
    shadow: { offset: 0, color: paint.shadow },
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
  copies: calmCopy,
  themes: CALM_THEMES,
  defaultTheme: DEFAULT_CALM_THEME,
};

export default calm;
