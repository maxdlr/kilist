import type { Lang } from "@/i18n";
import type { RoastCopy } from "./roast/copy/en";

export type SkinCopy = RoastCopy;

export type ActionColors = { fill: string; ink: string; line: string };

export type ActionKind =
  | "primary"
  | "secondary"
  | "secondaryOnLight"
  | "danger"
  | "ghost"
  | "attached";

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
  panelList: number;
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

export type TextCase = "upper" | "none";

export interface Skin {
  id: string;
  name: string;
  tagline: string;
  premium: boolean;
  statusBarOnGround: "light" | "dark";
  textCase: TextCase;
  splash?: "centered";
  game: {
    stamp: "shout" | "sticker";
    strikeInventoryTab: boolean;
  };
  fonts: {
    display: SkinDisplayFont;
    mono: string;
    body?: { regular: string; medium: string; bold: string };
    pixel?: string;
  };
  colors: {
    ground: string;
    onGround: string;
    accent: string;
    muted: string;
    raised: string;
    paper: string;
    onPaper: string;
    fieldLine?: string;
    signup?: { fill: string; ink: string };
    toast?: { fill: string; ink: string };
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
  panel: {
    fill: string;
    ink: string;
    title: string;
    line: string;
    radius: number;
    secondary: ActionKind;
  };
  shape: {
    border: number;
    divider: number;
    accentBorder: number;
    radius: number;
    pressedOpacity: number;
    stampShadow: number;
    fieldBorder: number;
    shadow: { offset: number; color: string };
  };
  spacing: SkinSpacing;
  size: SkinSizes;
  type: SkinType;
  copy: SkinCopy;
  themes: { id: string; name: string }[];
  theme: SkinTheme | null;
  onPanel: Skin | null;
}

export type SkinTheme = { id: string; name: string; elements: unknown };

export type SkinPaint = Pick<
  Skin,
  "statusBarOnGround" | "colors" | "actions"
> & {
  panel: Pick<Skin["panel"], "fill" | "ink" | "title" | "line">;
  shadow: string;
};

export type SkinThemeSource = {
  id: string;
  name: Record<Lang, string>;
  elements: unknown;
  paint: SkinPaint;
  panel?: { elements: unknown; paint: SkinPaint };
};

export type SkinSource = Omit<Skin, "copy" | "tagline" | "themes" | "theme" | "onPanel"> & {
  copies: Record<Lang, SkinCopy>;
  themes?: SkinThemeSource[];
  defaultTheme?: string;
};
