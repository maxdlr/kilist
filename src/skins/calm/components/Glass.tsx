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
import { DEFAULT_SCENE_GLASS, GlassBlur, type SceneGlass } from "@/components/elements/Glass";
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
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSharedValue, withTiming } from "react-native-reanimated";
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
  const id = useId().replace(/:/g, "");
  const featherLeft = Math.max(0, look.feather - featherFrom);
  const featherStart = look.feather > 0 ? 1 - featherLeft / look.feather : 1;
  const blur = <GlassBlur target={target} settings={look} />;

  return (
    <>
      <View style={StyleSheet.absoluteFill}>
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
      </View>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Feather
          id={`veil${id}`}
          color={C.ground}
          from={featherStart * look.veil}
          to={look.veil}
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
  feather: { left: 0, position: "absolute", right: 0, top: 0 },
  veil: { bottom: 0, left: 0, position: "absolute", right: 0 },
  solid: { backgroundColor: "black" },
  grow: { flex: 1 },
});
