import { useSkin } from "@/providers/SkinProvider";
import { SkinTabBar } from "@/skins/screens";
import { Tabs } from "expo-router";

export default function AppTabs() {
  const skin = useSkin();

  return (
    <Tabs
      tabBar={(props) => <SkinTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: skin.colors.ground },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="swipe" />
      <Tabs.Screen name="shop" />
      <Tabs.Screen name="account" />
      <Tabs.Screen name="admin" />
    </Tabs>
  );
}
