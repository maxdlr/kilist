import type { SwipeDirection } from "@/components/elements/SwipeDeck";

export type Sample = { name: string; icon?: string | null };

export type Answer = Sample & { direction: SwipeDirection };

export const SHOP_ROWS = 2;

export type StepNav = { onBack?: () => void; onExit?: () => void };
