import { SceneInset, useTabBarVisibility } from "@/providers/TabBarProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import useKeyboardOpen from "@/hooks/useKeyboardOpen";
import { useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmColors } from "../theme/useCalmColors";

export const useTabBarInset = () => {
  const skin = useSkin();
  const insets = useSafeAreaInsets();
  const { insideTabs, isHidden } = useTabBarVisibility();
  const keyboardOpen = useKeyboardOpen();
  const { progress: keyboardProgress } = useReanimatedKeyboardAnimation();
  const shown = insideTabs && !isHidden ? skin.size.tabBar + insets.bottom : 0;
  const inset = keyboardOpen ? 0 : shown;
  const base = useSharedValue(shown);
  const offset = useDerivedValue(() => base.value * (1 - keyboardProgress.value));

  useEffect(() => {
    base.set(withTiming(shown, AnimationService.config));
  }, [shown, base]);

  return { inset, offset };
};

export const Scene = ({ children }: { children: ReactNode }) => {
  const styles = useSkinStyles(createStyles);
  const tabBar = useTabBarInset();
  return (
    <View style={styles.root}>
      <SceneInset.Provider value={tabBar.inset}>{children}</SceneInset.Provider>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
  });
