import Press from "@/components/elements/Press";
import type { SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import T from "../text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { type GlassTarget, useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import { useKeyboardState } from "react-native-keyboard-controller";
import type { SwipeGameType } from "@/providers/SwipeFoodsProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { Href, router, useFocusEffect } from "expo-router";
import { BlurTargetView, BlurView } from "expo-blur";
import {
  createContext,
  type ComponentRef,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
} from "react-native";
import Animated, {
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { CartIcon, CheckIcon, HelpCircleIcon, HelpCircleSolidIcon } from "@/components/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSWR from "swr";
import { calmColors, useCalmColors } from "./colors";

type Weight = "regular" | "medium" | "semibold" | "bold" | "black";

export const CText = ({
  weight = "regular",
  size,
  color,
  style,
  ...rest
}: TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const fontSize = size ?? skin.type.body;
  const family =
    weight === "black"
      ? (skin.fonts.body!.black ??
        skin.fonts.body!.heavy ??
        skin.fonts.body!.bold)
      : weight === "bold"
        ? (skin.fonts.body!.heavy ?? skin.fonts.body!.bold)
        : weight === "semibold"
          ? skin.fonts.body!.bold
          : weight === "medium"
            ? skin.fonts.body!.medium
            : skin.fonts.body!.regular;
  return (
    <Text
      style={[
        {
          color: color ?? C.text,
          fontFamily: family,
          fontSize,
          lineHeight: Math.round(fontSize * 1.38),
        },
        style,
      ]}
      {...rest}
    />
  );
};

export const CButton = ({
  label,
  onPress,
  href,
  variant = "primary",
  accessibilityLabel,
  icon,
}: {
  icon?: (color: string) => ReactNode;
  label?: string;
  onPress?: () => void;
  href?: Href;
  variant?: "primary" | "secondary" | "text" | "danger";
  accessibilityLabel?: string;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const look = {
    primary: { fill: C.fill, ink: C.onFill, line: C.fill },
    secondary: { fill: "transparent", ink: C.text, line: C.fieldLine },
    text: { fill: "transparent", ink: C.textSoft, line: "transparent" },
    danger: { fill: C.danger, ink: C.onFill, line: C.danger },
  }[variant];
  const round = !label;

  return (
    <Press
      accessibilityRole="button"
      scale={variant !== "text"}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress ?? (href ? () => router.navigate(href) : undefined)}
      style={({ pressed }) => [
        styles.button,
        round ? styles.round : styles.pill,
        {
          backgroundColor: look.fill,
          borderColor: look.line,
          opacity: pressed ? skin.shape.pressedOpacity : 1,
        },
      ]}
    >
      {icon?.(look.ink)}
      {label && (
        <CText
          weight={variant === "text" ? "regular" : "medium"}
          size={skin.type.label + 1}
          color={look.ink}
          numberOfLines={1}
        >
          {label}
        </CText>
      )}
    </Press>
  );
};

const DockInset = createContext(0);

export const useDockInset = () => useContext(DockInset);

export const DockSpacer = () => <View style={{ height: useDockInset() }} />;

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

export const Screen = ({
  children,
  dock,
  padded = true,
  glass = false,
  cover,
}: {
  children: ReactNode;
  dock?: ReactNode;
  padded?: boolean;
  glass?: boolean;
  cover?: SharedValue<number>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { insideTabs, setGlassTarget } = useTabBarVisibility();
  const target = useRef<ComponentRef<typeof View>>(null);
  const [dockHeight, setDockHeight] = useState(0);
  const tabBar = useTabBarInset();
  const isGlass = glass && !!dock;
  const dockLift = useAnimatedStyle(() => ({ bottom: tabBar.offset.value }));
  const tabBarRoom = useAnimatedStyle(() => ({ paddingBottom: tabBar.offset.value }));
  useStatusBarStyle(skin.statusBarOnGround);

  useFocusEffect(
    useCallback(() => {
      if (!isGlass || !insideTabs) return;
      setGlassTarget(target);
      return () => setGlassTarget((current) => (current === target ? null : current));
    }, [isGlass, insideTabs, setGlassTarget]),
  );

  if (isGlass) {
    return (
      <View style={styles.root}>
        <BlurTargetView ref={target} style={[styles.root, styles.glassTarget]}>
          <View style={[StyleSheet.absoluteFill, styles.glassTarget]} />
          <View
            style={[
              styles.content,
              padded && styles.padded,
              {
                paddingTop: insets.top + skin.spacing.page - skin.spacing.small,
              },
            ]}
          >
            <DockInset.Provider value={dockHeight + tabBar.inset}>
              {children}
            </DockInset.Provider>
          </View>
        </BlurTargetView>
        <Animated.View
          style={[styles.glassDock, dockLift]}
          onLayout={(event) => setDockHeight(event.nativeEvent.layout.height)}
        >
          <GlassBackdrop target={target} cover={cover} />
          <View
            style={[
              styles.actionRow,
              styles.dock,
              styles.glassRow,
              !insideTabs && {
                paddingBottom: skin.spacing.stack + insets.bottom,
              },
            ]}
          >
            {dock}
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, tabBarRoom]}>
      <View
        style={[
          styles.content,
          padded && styles.padded,
          { paddingTop: insets.top + skin.spacing.page - skin.spacing.small },
          !dock &&
            !insideTabs && {
              paddingBottom: skin.spacing.stack + insets.bottom,
            },
        ]}
      >
        {children}
      </View>
      {dock && (
        <View
          style={[
            styles.actionRow,
            styles.dock,
            !insideTabs && {
              paddingBottom: skin.spacing.stack + insets.bottom,
            },
          ]}
        >
          {dock}
        </View>
      )}
    </Animated.View>
  );
};

export const Dot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{
      backgroundColor: color,
      borderRadius: size / 2,
      height: size,
      width: size,
    }}
  />
);

export const StockBars = ({
  rows,
  total: outOf,
}: {
  rows: { label: string; count: number; color: string; icon?: ReactNode }[];
  total?: number;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const total = outOf ?? rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <View style={styles.bars}>
      {rows
        .filter(({ count }) => !!count)
        .map((row) => (
          <View
            key={row.label}
            accessible
            accessibilityLabel={`${row.label}, ${row.count}`}
            style={styles.barRow}
          >
            <View style={styles.barLabel}>{row.icon}</View>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: row.color,
                    width: `${total ? Math.round((row.count / total) * 100) : 0}%`,
                  },
                ]}
              />
            </View>

            <CText size={skin.type.label + 1} color={C.textSoft}>
              {String(row.count)}
            </CText>
          </View>
        ))}
    </View>
  );
};

export const CardPads = ({
  intent,
  labels,
  onFling,
}: {
  intent: SwipeDirection | null;
  labels: boolean;
  onFling?: (direction: SwipeDirection) => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const live = onFling !== undefined;

  const pad = (direction: "left" | "right", label: string, aria: string) => {
    const on = intent === direction;
    const ink = on ? C.onFill : C.text;
    return (
      <Press
        accessibilityRole="button"
        accessibilityLabel={aria}
        scale
        disabled={!live}
        onPress={() => onFling?.(direction)}
        style={({ pressed }) => [
          styles.button,
          labels ? styles.pill : styles.round,
          {
            backgroundColor: on ? C.fill : C.tint,
            borderColor: on ? C.fill : C.tint,
            opacity: pressed ? skin.shape.pressedOpacity : 1,
          },
        ]}
      >
        {direction === "left" &&
          (on ? (
            <CartIcon size={skin.size.icon.action} color={ink} />
          ) : (
            <CartIcon
              size={skin.size.icon.action}
              color={ink}
              strokeWidth={1.8}
            />
          ))}
        {labels && (
          <CText
            weight="medium"
            size={skin.type.label + 1}
            color={ink}
            numberOfLines={1}
          >
            {label}
          </CText>
        )}
        {direction === "right" && (
          <CheckIcon
            size={skin.size.icon.action}
            color={on ? C.onFill : C.positive}
            strokeWidth={on ? 3 : 2}
          />
        )}
      </Press>
    );
  };
  const unsureOn = intent === "up";

  const hidden = {
    accessibilityElementsHidden: !live,
    importantForAccessibility: live
      ? ("auto" as const)
      : ("no-hide-descendants" as const),
  };

  return (
    <>
      <View {...hidden} style={[styles.actionRow, styles.pads]}>
        {pad("left", copy.out, T.play.ariaOut)}
        {pad("right", copy.inStock, T.play.ariaIn)}
      </View>
      <View
        {...hidden}
        pointerEvents="box-none"
        style={[styles.unsureSlot, styles.pads]}
      >
        <Press
          accessibilityRole="button"
          accessibilityLabel={T.intent.up}
          scale
          disabled={!live}
          onPress={() => onFling?.("up")}
          style={({ pressed }) => [
            styles.button,
            labels ? styles.pill : styles.round,
            {
              backgroundColor: "transparent",
              borderColor: unsureOn ? C.text : C.fieldLine,
              opacity: pressed ? skin.shape.pressedOpacity : 1,
            },
          ]}
        >
          {unsureOn ? (
            <HelpCircleSolidIcon
              size={skin.size.icon.action}
              color={C.text}
            />
          ) : (
            <HelpCircleIcon
              size={skin.size.icon.action}
              color={C.textSoft}
              strokeWidth={1.8}
            />
          )}
          {labels && (
            <CText
              size={skin.type.label + 1}
              color={unsureOn ? C.text : C.textSoft}
              numberOfLines={1}
            >
              {copy.unsure}
            </CText>
          )}
        </Press>
      </View>
    </>
  );
};

export const useCheckPending = () => {
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const { data: foods } = useSWR<FoodType[]>({ url: "foods/swipe/browse" });
  const { data: game } = useSWR<SwipeGameType>({
    url: "swipe-list/game",
    params: { tzOffset },
  });
  const count = foods?.length ?? 0;
  return { count, pending: count > 0 && game?.playedToday === false };
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    content: { flex: 1, gap: s.spacing.section + 4, minHeight: 0 },
    padded: { paddingHorizontal: s.spacing.gutter },
    pads: { padding: s.spacing.stack },
    unsureSlot: {
      alignItems: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
    },
    bars: { gap: s.spacing.inline },
    barRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
    },
    barLabel: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
    },
    barTrack: {
      flex: 1,
      backgroundColor: C.line,
      borderRadius: 3,
      height: 6,
      overflow: "hidden",
    },
    barFill: { borderRadius: 3, height: 6 },
    actionRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.small + 2,
      justifyContent: "center",
    },
    dock: {
      paddingBottom: s.spacing.gutter,
      paddingHorizontal: s.spacing.gutter,
    },
    glassTarget: { backgroundColor: C.ground },
    glassDock: {
      bottom: 0,
      left: 0,
      overflow: "hidden",
      position: "absolute",
      right: 0,
    },
    glassRow: { paddingTop: s.spacing.stack },
    button: {
      alignItems: "center",
      alignSelf: "center",
      borderRadius: s.size.button.md / 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.tight + 2,
      height: s.size.button.md,
      justifyContent: "center",
    },
    pill: { paddingHorizontal: s.spacing.stack },
    round: { width: s.size.button.md },
  });
