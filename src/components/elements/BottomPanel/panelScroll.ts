import { createContext } from "react";
import type { PanGesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";

export type PanelScroll = { pan: PanGesture; scrollY: SharedValue<number> };

export const PanelScrollContext = createContext<PanelScroll | null>(null);
