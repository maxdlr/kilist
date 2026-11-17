import { createContext } from "react";
import type { SharedValue } from "react-native-reanimated";

export type PanelScroll = { pan: unknown; scrollY: SharedValue<number> };

export const PanelScrollContext = createContext<PanelScroll | null>(null);
