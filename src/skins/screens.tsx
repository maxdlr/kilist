import type { TabBarProps } from "@/components/elements/TabBar/types";
import { useSkin } from "@/providers/SkinProvider";
import { createElement, type ComponentType } from "react";
import arcadeScreens from "./arcade/screens";
import roastScreens from "./roast/screens";

export type SkinScreens = {
  Home: ComponentType;
  Play: ComponentType;
  Shop: ComponentType;
  Foods: ComponentType;
  Account: ComponentType;
  TabBar: ComponentType<TabBarProps>;
};

const SKIN_SCREENS: Record<string, SkinScreens> = {
  roast: roastScreens,
  arcade: arcadeScreens,
};

type ScreenSlot = Exclude<keyof SkinScreens, "TabBar">;

const useScreens = () => SKIN_SCREENS[useSkin().id] ?? roastScreens;

export const SkinScreen = ({ slot }: { slot: ScreenSlot }) =>
  createElement(useScreens()[slot]);

export const SkinTabBar = (props: TabBarProps) =>
  createElement(useScreens().TabBar, props);
