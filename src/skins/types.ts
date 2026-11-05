import type { RoastCopy } from "./roast/copy";

export type SkinCopy = RoastCopy;

export type ActionColors = { fill: string; ink: string; line: string };

export type ActionKind =
  | "primary"
  | "secondary"
  | "secondaryOnLight"
  | "danger"
  | "ghost";

export interface SkinSpacing {
  hair: number;
  tight: number;
  small: number;
  page: number;
  gutter: number;
  inline: number;
  stack: number;
  dock: number;
  section: number;
  top: number;
}

export interface SkinSizes {
  button: { xs: number; sm: number; md: number; lg: number; xl: number };
  row: { list: number; shop: number; stripe: number };
  tabBar: number;
  input: number;
  toggle: number;
  check: number;
  meter: number;
  swatch: number;
  scanner: number;
  qr: number;
  icon: { action: number; row: number; card: number };
}

export interface SkinType {
  mono: number;
  caption: number;
  label: number;
  body: number;
  lead: number;
  title: number;
  headline: number;
  display: { sm: number; md: number; lg: number; xl: number; stamp: number };
}

export type LevelNumber = 1 | 2 | 3 | 4 | 5;

export interface SkinDisplayFont {
  family: string;
  lineHeight: number;
  charWidth: (char: string) => number;
}

export interface Skin {
  id: string;
  name: string;
  tagline: string;
  premium: boolean;
  statusBarOnGround: "light" | "dark";
  fonts: {
    display: SkinDisplayFont;
    mono: string;
  };
  colors: {
    ground: string;
    onGround: string;
    accent: string;
    muted: string;
    raised: string;
    paper: string;
    onPaper: string;
    placeholder: string;
    scrim: string;
    danger: string;
    alert: string;
    onAlert: string;
    success: string;
    levels: Record<LevelNumber, string>;
    onLevel: string;
    sheets: { fill: string; ink: string }[];
  };
  actions: Record<ActionKind, ActionColors>;
  shape: {
    border: number;
    divider: number;
    accentBorder: number;
    radius: number;
    pressedOpacity: number;
    stampShadow: number;
  };
  spacing: SkinSpacing;
  size: SkinSizes;
  type: SkinType;
  copy: SkinCopy;
}
