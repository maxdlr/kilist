import type { Lang } from "@/i18n";
import type { BottomPanelLook, LevelNumber, Skin, SkinPaint, SkinThemeSource } from "@/skins/types";
import { CUSTOM_THEME_ID } from "@/skins/customTheme";
import { feedbackLook, type FeedbackOverride } from "@/skins/feedback";
import { CUSTOM_NAME, customElements } from "./custom";

export type GameCardButtonLook = { fill: string; border: string; ink: string };

export type GameCardLook = {
  front: { fill: string; border: string };
  behind: { fill: string; border: string; contentOpacity: number };
  border: { width: number; radius: number };
  title: string;
  question: string;
  buttons: {
    idle: GameCardButtonLook;
    active: GameCardButtonLook;
    haveItIcon: string;
    unsure: { idle: GameCardButtonLook; active: GameCardButtonLook };
  };
};

export type NewsCardLook = {
  fill: string;
  border: string;
  title: string;
  body: string;
  icon: string;
  close: string;
};

export type SortCardLook = {
  fill: string;
  border: string;
  title: string;
  facts: string;
  icon: string;
  arrow: string;
};

export type GameHeaderLook = {
  icon: string;
  iconActive: string;
  iconStroke: number;
  undoDisabledOpacity: number;
  counter: string;
  hint: { out: string; unsure: string; haveIt: string };
  progress: { track: string; fill: string; height: number };
};

export type TutorialCaptionLook = {
  fill: string;
  border: string;
  title: string;
  line: string;
  hint: { left: string; up: string; right: string };
};

export type IntroDemoLook = { rowBorder: string };

export type ShopSwipeLook = { fill: string; ink: string };

export type ShopListLook = {
  header: {
    idle: { fill: string; title: string; subtitle: string };
    running: { fill: string; title: string; subtitle: string; toggleLabel: string };
  };
  aisle: {
    title: { idle: string; focused: string; targeted: string; next: string };
    corner: { idle: string; focused: string; started: string };
    track: { idle: string; focused: string };
    progress: string;
    nextBar: string;
    dimmedOpacity: number;
  };
  row: {
    fill: string;
    selected: string;
    divider: string;
    swipe: { idle: ShopSwipeLook; buy: ShopSwipeLook; later: ShopSwipeLook };
    done: { opacity: number; tagLine: string; tagInk: string };
  };
  next: { idle: { fill: string; line: string }; running: { fill: string; line: string } };
  rail: {
    pip: string;
    pipOn: string;
    pill: { fill: string; line: string; ink: string };
    pillOn: { fill: string; ink: string; shadow: string };
  };
};

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
  bottomPanel: BottomPanelLook;
  gameCard: GameCardLook;
  gameHeader: GameHeaderLook;
  shopList: ShopListLook;
  tutorialCaption: TutorialCaptionLook;
  introDemo: IntroDemoLook;
  newsCard: NewsCardLook;
  sortCard: SortCardLook;
  feedback?: FeedbackOverride;
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

export const CALM_FEEDBACK_SHAPE = { radius: 18, border: 1, edge: 3 };

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
  bottomPanel: em.bottomPanel,
  feedback: feedbackLook(
    { ink: e.text, soft: e.textSoft, line: e.fieldLine, danger: e.danger, success: e.positive },
    CALM_FEEDBACK_SHAPE,
    e.feedback,
  ),
  shadow: e.text,
});

const files = require.context("./colorschemes", false, /\.ts$/);

const idOf = (path: string) => path.replace(/^.*\//, "").replace(/\.ts$/, "");

const themeOf = (id: string, name: Record<Lang, string>, elements: CalmElements): SkinThemeSource => ({
  id,
  name,
  elements,
  paint: paintOf(elements),
  panel: { elements: onPanel(elements), paint: paintOf(onPanel(elements)) },
});

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
  .map(({ id, file }) => themeOf(id, file.name, file.elements));

export const calmCustomTheme = (color: string) =>
  themeOf(CUSTOM_THEME_ID, CUSTOM_NAME, customElements(color));

const fallback = CALM_THEMES[0];

export const calmColors = (skin: Skin): CalmElements =>
  (skin.id === "calm" && skin.theme
    ? skin.theme.elements
    : fallback.elements) as CalmElements;
