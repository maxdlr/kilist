import {
  type GlassTarget,
  GlassTargetScope,
  SceneInset,
  useTabBarVisibility,
} from "@/providers/TabBarProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { BlurTargetView } from "expo-blur";
import { DEFAULT_SCENE_GLASS, FeatheredGlass, type SceneGlass } from "@/components/elements/Glass";
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
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import useKeyboardOpen from "@/hooks/useKeyboardOpen";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { calmColors, useCalmColors } from "../theme/useCalmColors";

const DockInset = SceneInset;

const targetKeys = new WeakMap<GlassTarget, number>();
let nextTargetKey = 0;
export const glassTargetKey = (target: GlassTarget) => {
  if (!targetKeys.has(target)) targetKeys.set(target, ++nextTargetKey);
  return targetKeys.get(target);
};

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

export type GlassLook = SceneGlass;

export const DEFAULT_GLASS: GlassLook = DEFAULT_SCENE_GLASS;
const SCENE_FADE_LEAD = 100;
const FADE_STEPS = 8;

const fadeStops = (look: GlassLook) =>
  Array.from({ length: FADE_STEPS + 1 }, (_, index) => {
    const at = index / FADE_STEPS;
    const eased = 1 - (1 - at) ** look.fadeCurve;
    return { at, opacity: 1 - eased * (1 - look.fadeFloor) };
  });

const MaskedView = MaskedViewBase as unknown as ComponentType<{
  style?: StyleProp<ViewStyle>;
  maskElement: ReactElement;
  children: ReactNode;
}>;

const ContentFadeMask = ({ id, height, look }: { id: string; height: number; look: GlassLook }) => (
  <View style={StyleSheet.absoluteFill}>
    <View style={[glassStyles.solid, glassStyles.grow]} />
    <Svg width="100%" height={height}>
      <Defs>
        <LinearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
          {fadeStops(look).map((stop) => (
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
  featherFrom = 0,
  look = DEFAULT_GLASS,
}: {
  target: GlassTarget;
  featherFrom?: number;
  look?: GlassLook;
}) => {
  const C = useCalmColors();
  return <FeatheredGlass target={target} look={look} veil={C.ground} featherFrom={featherFrom} />;
};

export const useTabBarInset = () => {
  const skin = useSkin();
  const insets = useSafeAreaInsets();
  const { insideTabs, isHidden } = useTabBarVisibility();
  const keyboardOpen = useKeyboardOpen();
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
  look = DEFAULT_GLASS,
}: {
  children: ReactNode;
  extraInset?: number;
  target?: GlassTarget;
  fade?: boolean;
  look?: GlassLook;
}) => {
  const styles = useSkinStyles(createStyles);
  const own = useRef<ComponentRef<typeof View>>(null);
  const target = given ?? own;
  const { insideTabs, setGlassTarget } = useTabBarVisibility();
  const tabBar = useTabBarInset();
  const glassHeight = extraInset + tabBar.inset;
  const fadeHeight = glassHeight + (look.fadeLead ?? (extraInset > 0 ? 0 : SCENE_FADE_LEAD));
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
      <GlassTargetScope.Provider value>
        <DockInset.Provider value={glassHeight}>
          {fade && glassHeight > 0 ? (
            <MaskedView
              style={glassStyles.grow}
              maskElement={<ContentFadeMask id={fadeId} height={fadeHeight} look={look} />}
            >
              {children}
            </MaskedView>
          ) : (
            children
          )}
        </DockInset.Provider>
      </GlassTargetScope.Provider>
    </BlurTargetView>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    glassTarget: { backgroundColor: C.ground },
  });

const glassStyles = StyleSheet.create({
  solid: { backgroundColor: "black" },
  grow: { flex: 1 },
});
