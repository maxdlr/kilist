import type { RaceAnswer } from "../hooks/api";
import V from "../text";
import { versusPalette as P } from "../theme/palette";

export const WORD: Record<RaceAnswer, string> = new Proxy({} as Record<RaceAnswer, string>, {
  get: (_, key) => V.word[key as RaceAnswer],
});

export const ANSWER_FILL: Record<RaceAnswer, string> = { in: P.agree, out: P.buy, up: P.line };
