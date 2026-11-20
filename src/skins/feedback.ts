import { transparentColor } from "@/utils/colorUtils";
import type { FeedbackLook } from "./types";

export type FeedbackColors = {
  ink: string;
  soft: string;
  line: string;
  danger: string;
  success: string;
};

export type FeedbackShape = { radius: number; border: number; edge: number };

export type FeedbackOverride = { [K in keyof FeedbackLook]?: Partial<FeedbackLook[K]> };

export const FEEDBACK_TINT = { fill: 0.1, line: 0.45, field: 0.06, note: 0.07, heldOpacity: 0.4 };

const tinted = (color: string, c: FeedbackColors) => ({
  fill: transparentColor(color, FEEDBACK_TINT.fill),
  line: transparentColor(color, FEEDBACK_TINT.line),
  ink: c.ink,
  soft: c.soft,
  icon: color,
});

export const feedbackLook = (
  c: FeedbackColors,
  shape: FeedbackShape,
  ...overrides: (FeedbackOverride | undefined)[]
): FeedbackLook => {
  const note = { fill: transparentColor(c.ink, FEEDBACK_TINT.note), line: c.line, ink: c.ink, soft: c.soft, icon: c.soft };
  const base: FeedbackLook = {
    card: {
      error: tinted(c.danger, c),
      note,
      success: tinted(c.success, c),
      radius: shape.radius,
      border: shape.border,
    },
    chip: { ...note, border: shape.border },
    field: {
      line: c.danger,
      fill: transparentColor(c.danger, FEEDBACK_TINT.field),
      width: shape.border + 1,
      message: c.danger,
    },
    row: {
      fill: transparentColor(c.danger, FEEDBACK_TINT.fill),
      edge: c.danger,
      edgeWidth: shape.edge,
      message: c.danger,
    },
    held: { opacity: FEEDBACK_TINT.heldOpacity, reason: c.soft },
  };
  return overrides.reduce<FeedbackLook>(
    (look, layer) =>
      layer
        ? (Object.fromEntries(
            Object.entries(look).map(([key, value]) => [
              key,
              { ...value, ...layer[key as keyof FeedbackLook] },
            ]),
          ) as FeedbackLook)
        : look,
    base,
  );
};
