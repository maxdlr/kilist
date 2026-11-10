import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import arcade from "../arcade";
import roast from "../roast";
import versus from "../versus";
import type { SkinSource } from "../types";

const TARGET = resolve(__dirname, "../../../../kilist-api/src/api/emails/layout/skinTokens.json");

const tokensOf = ({ colors, actions, panel, shape }: SkinSource) => ({
  colors: {
    ground: colors.ground,
    onGround: colors.onGround,
    accent: colors.accent,
    muted: colors.muted,
    raised: colors.raised,
    paper: colors.paper,
    onPaper: colors.onPaper,
    alert: colors.alert,
    onAlert: colors.onAlert,
  },
  primary: actions.primary,
  panelRadius: panel.radius,
  radius: shape.radius,
  border: shape.border,
});

const emailTokens = () => ({ arcade: tokensOf(arcade), versus: tokensOf(versus), roast: tokensOf(roast) });

describe("email tokens", () => {
  it.runIf(existsSync(resolve(TARGET, "..")))("are in sync with the skins", () => {
    const current = `${JSON.stringify(emailTokens(), null, 2)}\n`;
    if (process.env.WRITE_EMAIL_TOKENS) writeFileSync(TARGET, current);
    expect(existsSync(TARGET) ? readFileSync(TARGET, "utf8") : "").toBe(current);
  });
});
