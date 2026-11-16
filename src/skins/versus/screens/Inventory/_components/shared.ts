import type { RaceAnswer } from "@/skins/versus/hooks/api";

export type Vote = { userId: number; username: string; answer: RaceAnswer | null };
