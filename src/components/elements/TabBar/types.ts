import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";

export type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];
