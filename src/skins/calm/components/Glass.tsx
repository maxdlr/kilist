import {
  type GlassTarget,
  SceneInset,
  useTabBarVisibility,
} from "@/providers/TabBarProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { BlurTargetView, BlurView } from "expo-blur";
import MaskedViewBase from "@react-native-masked-view/masked-view";
import { useFocusEffect } from "expo-router";
import {
  type ComponentRef,
  type ComponentType,
  type ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import {
  LayoutChangeEvent,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import Animated, {
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { calmColors, useCalmColors } from "../theme/useCalmColors";

const DockInset = SceneInset;

export const useDockInset = () => useContext(DockInset);

export const DockSpacer = () => <View style={{ height: useDockInset() }} />;

export const GlassScrollView = ({
  contentContainerStyle,
  ...props
}: ScrollViewProps) => {
  const inset = useDockInset();
  const own = StyleSheet.flatten(contentContainerStyle) ?? {};
  const base = own.paddingBottom ?? own.paddingVertical ?? own.padding ?? 0;
  return (
    <ScrollView
      {...props}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: (typeof base === "number" ? base : 0) + inset },
      ]}
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
const GLASS_VEIL = 0.5;
const GLASS_FEATHER = 64;
const CONTENT_FADE_FLOOR = 0.25;
const CONTENT_FADE_LEAD = 100;
const CONTENT_FADE_CURVE = 2;
const CONTENT_FADE_STOPS = Array.from({ length: 9 }, (_, index) => {
  const at = index / 8;
  const eased = 1 - (1 - at) ** CONTENT_FADE_CURVE;
  return { at, opacity: 1 - eased * (1 - CONTENT_FADE_FLOOR) };
});

const MaskedView = MaskedViewBase as unknown as ComponentType<{
  style?: StyleProp<ViewStyle>;
  maskElement: ReactElement;
  children: ReactNode;
}>;

const Feather = ({
  id,
  color,
  from,
  to,
  height,
}: {
  id: string;
  color: string;
  from: number;
  to: number;
  height: number;
}) => (
  <View style={StyleSheet.absoluteFill}>
    {height > 0 && (
      <Svg width="100%" height={height} style={glassStyles.feather}>
        <Defs>
          <LinearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
            <Stop offset={0} stopColor={color} stopOpacity={from} />
            <Stop offset={1} stopColor={color} stopOpacity={to} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    )}
    <View
      style={[
        glassStyles.veil,
        { backgroundColor: color, opacity: to, top: height },
      ]}
    />
  </View>
);

const ContentFadeMask = ({ id, height }: { id: string; height: number }) => (
  <View style={StyleSheet.absoluteFill}>
    <View style={[glassStyles.solid, glassStyles.grow]} />
    <Svg width="100%" height={height}>
      <Defs>
        <LinearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
          {CONTENT_FADE_STOPS.map((stop) => (
            <Stop
              key={stop.at}
              offset={stop.at}
              stopColor="black"
              stopOpacity={stop.opacity}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  </View>
);

export const GlassBackdrop = ({
  target,
  cover,
  featherFrom = 0,
}: {
  target: GlassTarget;
  cover?: SharedValue<number>;
  featherFrom?: number;
}) => {
  const C = useCalmColors();
  const id = useId().replace(/:/g, "");
  const featherLeft = Math.max(0, GLASS_FEATHER - featherFrom);
  const featherStart = 1 - featherLeft / GLASS_FEATHER;
  const blur = (
    <BlurView
      blurTarget={target}
      intensity={Platform.OS === "android" ? TINTLESS : GLASS_BLUR}
      blurReductionFactor={(TINTLESS * ANDROID_REDUCTION) / GLASS_BLUR}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={StyleSheet.absoluteFill}
    />
  );
  const coverStyle = useAnimatedStyle(() => ({
    opacity: cover ? cover.value : 1,
  }));

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, coverStyle]}>
        {featherLeft > 0 ? (
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <Feather
                id={`mask${id}`}
                color="black"
                from={featherStart}
                to={1}
                height={featherLeft}
              />
            }
          >
            {blur}
          </MaskedView>
        ) : (
          blur
        )}
      </Animated.View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Feather
          id={`veil${id}`}
          color={C.ground}
          from={featherStart * GLASS_VEIL}
          to={GLASS_VEIL}
          height={featherLeft}
        />
      </View>
    </>
  );
};

export const useTabBarInset = () => {
  const skin = useSkin();
  const insets = useSafeAreaInsets();
  const { insideTabs, isHidden } = useTabBarVisibility();
  const keyboardOpen = useKeyboardState((state) => state.isVisible);
  const inset =
    insideTabs && !isHidden && !keyboardOpen
      ? skin.size.tabBar + insets.bottom
      : 0;
  const offset = useSharedValue(inset);

  useEffect(() => {
    offset.set(withTiming(inset, AnimationService.config));
  }, [inset, offset]);

  return { inset, offset };
};

export const GlassScene = ({
  children,
  extraInset = 0,
  target: given,
  fade = true,
}: {
  children: ReactNode;
  extraInset?: number;
  target?: GlassTarget;
  fade?: boolean;
}) => {
  const styles = useSkinStyles(createStyles);
  const own = useRef<ComponentRef<typeof View>>(null);
  const target = given ?? own;
  const { insideTabs, setGlassTarget } = useTabBarVisibility();
  const tabBar = useTabBarInset();
  const glassHeight = extraInset + tabBar.inset;
  const fadeHeight = glassHeight + (extraInset > 0 ? 0 : CONTENT_FADE_LEAD);
  const fadeId = `fade${useId().replace(/:/g, "")}`;

  useFocusEffect(
    useCallback(() => {
      if (!insideTabs) return;
      setGlassTarget(target);
      return () =>
        setGlassTarget((current) => (current === target ? null : current));
    }, [insideTabs, setGlassTarget, target]),
  );

  return (
    <BlurTargetView ref={target} style={[styles.root, styles.glassTarget]}>
      <View style={[StyleSheet.absoluteFill, styles.glassTarget]} />
      <DockInset.Provider value={glassHeight}>
        {fade && glassHeight > 0 ? (
          <MaskedView
            style={glassStyles.grow}
            maskElement={<ContentFadeMask id={fadeId} height={fadeHeight} />}
          >
            {children}
          </MaskedView>
        ) : (
          children
        )}
      </DockInset.Provider>
    </BlurTargetView>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    glassTarget: { backgroundColor: C.ground },
  });

const glassStyles = StyleSheet.create({
  feather: { left: 0, position: "absolute", right: 0, top: 0 },
  veil: { bottom: 0, left: 0, position: "absolute", right: 0 },
  solid: { backgroundColor: "black" },
  grow: { flex: 1 },
});
