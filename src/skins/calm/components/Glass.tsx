import { type GlassTarget, SceneInset, useTabBarVisibility } from "@/providers/TabBarProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { BlurTargetView, BlurView } from "expo-blur";
import { useFocusEffect } from "expo-router";
import { type ComponentRef, ReactNode, useCallback, useContext, useEffect, useRef } from "react";
import { LayoutChangeEvent, Platform, ScrollView, type ScrollViewProps, StyleSheet, View } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import Animated, {
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmColors, useCalmColors } from "../theme/useCalmColors";

const DockInset = SceneInset;

export const useDockInset = () => useContext(DockInset);

export const DockSpacer = () => <View style={{ height: useDockInset() }} />;

/** ScrollView for a glass Screen: its content ends with room for the dock and tab bar floating over it. */
export const GlassScrollView = ({ contentContainerStyle, ...props }: ScrollViewProps) => {
  const inset = useDockInset();
  const own = StyleSheet.flatten(contentContainerStyle) ?? {};
  const base = own.paddingBottom ?? own.paddingVertical ?? own.padding ?? 0;
  return (
    <ScrollView
      {...props}
      contentContainerStyle={[contentContainerStyle, { paddingBottom: (typeof base === "number" ? base : 0) + inset }]}
    />
  );
};

const COVER_FADE = 24;

export const useDockCover = () => {
  const cover = useSharedValue(0);
  const content = useSharedValue(0);
  const frame = useSharedValue(0);
  const offset = useSharedValue(0);

  const update = () => {
    "worklet";
    const hidden = content.value - offset.value - frame.value;
    cover.set(Math.max(0, Math.min(1, hidden / COVER_FADE)));
  };

  const onScroll = useAnimatedScrollHandler((event) => {
    content.set(event.contentSize.height);
    frame.set(event.layoutMeasurement.height);
    offset.set(event.contentOffset.y);
    update();
  });

  return {
    cover,
    listProps: {
      onScroll,
      scrollEventThrottle: 16,
      onContentSizeChange: (_width: number, height: number) => {
        content.set(height);
        update();
      },
      onLayout: (event: LayoutChangeEvent) => {
        frame.set(event.nativeEvent.layout.height);
        update();
      },
    },
  };
};

const GLASS_BLUR = 30;
const ANDROID_REDUCTION = 4;
const TINTLESS = 1;
const GLASS_VEIL = 0.52;

export const GlassBackdrop = ({
  target,
  cover,
}: {
  target: GlassTarget;
  cover?: SharedValue<number>;
}) => {
  const C = useCalmColors();
  const coverStyle = useAnimatedStyle(() => ({ opacity: cover ? cover.value : 1 }));

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, coverStyle]}>
        <BlurView
          blurTarget={target}
          intensity={Platform.OS === "android" ? TINTLESS : GLASS_BLUR}
          blurReductionFactor={(TINTLESS * ANDROID_REDUCTION) / GLASS_BLUR}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: C.ground, opacity: GLASS_VEIL }]}
      />
    </>
  );
};

/** Space the floating tab bar takes at the bottom of a screen; 0 while it's hidden or under the keyboard. */
export const useTabBarInset = () => {
  const skin = useSkin();
  const insets = useSafeAreaInsets();
  const { insideTabs, isHidden } = useTabBarVisibility();
  const keyboardOpen = useKeyboardState((state) => state.isVisible);
  const inset = insideTabs && !isHidden && !keyboardOpen ? skin.size.tabBar + insets.bottom : 0;
  const offset = useSharedValue(inset);

  useEffect(() => {
    offset.set(withTiming(inset, AnimationService.config));
  }, [inset, offset]);

  return { inset, offset };
};

/**
 * Scene whose content runs under the floating tab bar: it's what the bar's glass blurs while focused,
 * and it tells scroll content how much room to leave at the end (see DockSpacer / useSceneInset).
 */
export const GlassScene = ({
  children,
  extraInset = 0,
  target: given,
}: {
  children: ReactNode;
  extraInset?: number;
  target?: GlassTarget;
}) => {
  const styles = useSkinStyles(createStyles);
  const own = useRef<ComponentRef<typeof View>>(null);
  const target = given ?? own;
  const { insideTabs, setGlassTarget } = useTabBarVisibility();
  const tabBar = useTabBarInset();

  useFocusEffect(
    useCallback(() => {
      if (!insideTabs) return;
      setGlassTarget(target);
      return () => setGlassTarget((current) => (current === target ? null : current));
    }, [insideTabs, setGlassTarget, target]),
  );

  return (
    <BlurTargetView ref={target} style={[styles.root, styles.glassTarget]}>
      <View style={[StyleSheet.absoluteFill, styles.glassTarget]} />
      <DockInset.Provider value={extraInset + tabBar.inset}>{children}</DockInset.Provider>
    </BlurTargetView>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    glassTarget: { backgroundColor: C.ground },
  });
