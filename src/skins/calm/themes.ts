import type { Lang } from "@/i18n";
import type { LevelNumber, Skin, SkinPaint, SkinThemeSource } from "../types";

type CalmBase = {
  statusBar: "light" | "dark";
  ground: string;
  card: string;
  tint: string;
  text: string;
  textSoft: string;
  textFaint: string;
  line: string;
  fieldLine: string;
  ring: string;
  fill: string;
  onFill: string;
  positive: string;
  onPositive: string;
  negative: string;
  danger: string;
  success: string;
  pendingDot: string;
  barMaybe: string;
  levels: Record<LevelNumber, string>;
  onLevel: string;
  scrim: string;
};

type EmphasisKey =
  | "ground"
  | "card"
  | "tint"
  | "text"
  | "textSoft"
  | "textFaint"
  | "line"
  | "fieldLine"
  | "ring"
  | "fill"
  | "onFill"
  | "danger";

export type CalmElements = CalmBase & { em?: Partial<Pick<CalmBase, EmphasisKey>> };

type ThemeFile = {
  name: Record<Lang, string>;
  colors: Record<string, string>;
  elements: CalmElements;
};

export const DEFAULT_CALM_THEME = "light";

const onPanel = (e: CalmElements): CalmElements => ({ ...e, ...e.em });

const paintOf = (e: CalmElements, em = onPanel(e)): SkinPaint => ({
  statusBarOnGround: e.statusBar,
  colors: {
    ground: e.ground,
    onGround: e.text,
    accent: e.fill,
    muted: e.textSoft,
    raised: e.tint,
    paper: e.card,
    onPaper: e.text,
    fieldLine: e.fieldLine,
    signup: { fill: e.ground, ink: e.text },
    toast: { fill: e.fill, ink: e.onFill },
    placeholder: e.textFaint,
    scrim: e.scrim,
    danger: e.danger,
    alert: e.fill,
    onAlert: e.onFill,
    success: e.success,
    levels: e.levels,
    onLevel: e.onLevel,
    sheets: [
      { fill: e.ground, ink: e.text },
      { fill: e.card, ink: e.text },
      { fill: e.tint, ink: e.text },
      { fill: e.card, ink: e.text },
    ],
  },
  actions: {
    primary: { fill: e.fill, ink: e.onFill, line: e.fill },
    secondary: { fill: "transparent", ink: e.text, line: e.fieldLine },
    secondaryOnLight: { fill: "transparent", ink: e.text, line: e.fieldLine },
    danger: { fill: "transparent", ink: e.danger, line: e.danger },
    ghost: { fill: "transparent", ink: e.textSoft, line: "transparent" },
    attached: { fill: e.card, ink: e.text, line: e.fieldLine },
  },
  panel: { fill: em.card, ink: em.text, title: em.text, line: em.line },
  shadow: e.text,
});

const files = require.context("./colorschemes", false, /\.ts$/);

const idOf = (path: string) => path.replace(/^.*\//, "").replace(/\.ts$/, "");

export const CALM_THEMES: SkinThemeSource[] = files
  .keys()
  .map((path) => ({ id: idOf(path), file: files(path) as ThemeFile }))
  .sort((a, b) =>
    a.id === DEFAULT_CALM_THEME
      ? -1
      : b.id === DEFAULT_CALM_THEME
        ? 1
        : a.id.localeCompare(b.id),
  )
  .map(({ id, file }) => ({
    id,
    name: file.name,
    elements: file.elements,
    paint: paintOf(file.elements),
    panel: { elements: onPanel(file.elements), paint: paintOf(onPanel(file.elements)) },
  }));

const fallback = CALM_THEMES[0];

export const calmColors = (skin: Skin): CalmElements =>
  (skin.id === "calm" && skin.theme
    ? skin.theme.elements
    : fallback.elements) as CalmElements;
