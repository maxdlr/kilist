import type { TabBarProps } from "@/components/elements/TabBar/types";
import { useSkin } from "@/providers/SkinProvider";
import { createElement, type ComponentType, type ReactNode } from "react";
import calmScreens from "./calm/screens";
import roastScreens from "./roast/screens/index";
import versusScreens from "./versus/screens";

export type SkinScreens = {
  Home: ComponentType;
  Play: ComponentType;
  Shop: ComponentType;
  Inventory: ComponentType;
  Account: ComponentType;
  Loading: ComponentType;
  TabBar: ComponentType<TabBarProps>;
  floatingTabBar?: boolean;
  Scene?: ComponentType<{ children: ReactNode }>;
};

const SKIN_SCREENS: Record<string, SkinScreens> = {
  roast: roastScreens,
  versus: versusScreens,
  calm: calmScreens,
};

export type ScreenSlot = Exclude<keyof SkinScreens, "TabBar" | "floatingTabBar" | "Scene">;

const useScreens = () => SKIN_SCREENS[useSkin().id] ?? roastScreens;

export const SkinScreen = ({ slot }: { slot: ScreenSlot }) =>
  createElement(useScreens()[slot]);

export const SkinTabBar = (props: TabBarProps) =>
  createElement(useScreens().TabBar, props);

export const useFloatingTabBar = () => useScreens().floatingTabBar === true;

export const SkinScene = ({ children }: { children: ReactNode }) => {
  const Scene = useScreens().Scene;
  return Scene ? <Scene>{children}</Scene> : children;
};
