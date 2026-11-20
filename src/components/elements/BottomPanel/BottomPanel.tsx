import type { Skin } from "@/skins/types";
import { useFocusEffect } from "expo-router";
import { PanelSkin, useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useCoverDock } from "@/providers/DockStore";
import { useHideTabBar, useInsideGlassTarget, useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import PANEL_GLASS from "./panelGlass";
import { GlassLayer, glassWith, type GlassSettings } from "@/components/elements/Glass";
import PanelStroke from "./PanelStroke";
import Press from "@/components/elements/Press";
import { ThemedText } from "@/components/elements/ThemedText";
import { PanelScrollContext } from "./panelScroll";
import { KeyboardAvoided } from "@/components/elements/BackBar/AvoidKeyboard";
import { ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import {
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { height: SCREEN_HEIGHT } = Dimensions.get("screen");
const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const DEVICE_TOP = initialWindowMetrics?.insets.top ?? 0;
const DRAG_START = 12;
const DISMISS_DISTANCE = 120;
const DISMISS_SHARE = 0.3;
const DISMISS_VELOCITY = 900;
const BOTTOM_ROOM = 32;
const EXPAND_DISTANCE = 56;
const EXPAND_VELOCITY = -700;
const MIN_SCREEN_SHARE = 0.66;

const handoff: { owner: object | null; until: number } = {
  owner: null,
  until: 0,
};

const handoffWait = (self: object) =>
  handoff.owner === self ? 0 : Math.max(0, handoff.until - Date.now());

const BottomPanel = ({
  visible,
  onClose,
  dismissible = false,
  canClose,
  tall = false,
  veil = true,
  glass: glassOverride,
  expanded = false,
  onExpand,
  onCollapse,
  expandHint,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  dismissible?: boolean;
  canClose?: () => boolean;
  tall?: boolean;
  veil?: boolean;
  glass?: Partial<GlassSettings>;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  expandHint?: string;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  useHideTabBar(visible);
  useCoverDock(visible);
  const insets = useSafeAreaInsets();
  const { glassTarget } = useTabBarVisibility();
  const insideTarget = useInsideGlassTarget();
  const gripLook = skin.bottomPanel.grip;
  const glass = glassWith(PANEL_GLASS, skin.bottomPanel.glassSettings, glassOverride);
  const glassy = glass.enabled !== false && Boolean(glassTarget) && !insideTarget;
  const offset = useSharedValue(SCREEN_HEIGHT);
  const contentHeight = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const veilOpacity = useSharedValue(veil ? 1 : 0);
  const drag = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const dragFrom = useSharedValue(-1);
  const closing = useSharedValue(false);
  const lift = useSharedValue(0);
  const grow = useSharedValue(expanded ? 1 : 0);
  const canExpand = useSharedValue(Boolean(onExpand) && !expanded);
  const isExpanded = useSharedValue(expanded);
  const growTarget = useSharedValue(expanded ? 1 : 0);
  const innerBottom = useSharedValue(0);
  const avoided = useContext(KeyboardAvoided);
  const { height: keyboardHeight, progress: keyboardProgress } = useReanimatedKeyboardAnimation();
  const minHeight = WINDOW_HEIGHT * MIN_SCREEN_SHARE;
  const keyboardGap = skin.spacing.section;
  const bottomPad = skin.spacing.section + insets.bottom + BOTTOM_ROOM;
  const morphing = useRef(false);
  const fullHeight = WINDOW_HEIGHT - Math.max(insets.top, DEVICE_TOP) - skin.spacing.top;
  const latest = useRef({ visible, onClose, canClose, onExpand, onCollapse });
  const [self] = useState(() => ({}));
  const [isRendered, setIsRendered] = useState(visible);
  const [frame, setFrame] = useState({ width: 0, height: 0 });

  if (visible && !isRendered) {
    setIsRendered(true);
  }

  useEffect(() => {
    latest.current = { visible, onClose, canClose, onExpand, onCollapse };
  }, [visible, onClose, canClose, onExpand, onCollapse]);

  const endMorph = useCallback(() => {
    morphing.current = false;
  }, []);

  useEffect(() => {
    canExpand.set(Boolean(onExpand) && !expanded);
    isExpanded.set(expanded);
    const target = expanded ? 1 : 0;
    if (growTarget.get() === target) return;
    growTarget.set(target);
    morphing.current = true;
    grow.set(
      withTiming(target, AnimationService.panel.expand, () => {
        "worklet";
        scheduleOnRN(endMorph);
      }),
    );
  }, [expanded, onExpand, canExpand, isExpanded, grow, growTarget, endMorph]);

  useFocusEffect(
    useCallback(
      () => () => {
        if (latest.current.visible) latest.current.onClose();
      },
      [],
    ),
  );

  useEffect(() => {
    backdropOpacity.set(
      withTiming(
        visible ? 1 : 0,
        visible ? AnimationService.panel.open : AnimationService.panel.close,
      ),
    );

    if (visible) {
      drag.set(0);
      closing.set(false);
      const open = setTimeout(() => {
        if (contentHeight.get() > 0) {
          offset.set(
            withDelay(
              handoffWait(self),
              withTiming(0, AnimationService.panel.open),
            ),
          );
        }
      }, 0);
      return () => clearTimeout(open);
    }

    if (offset.get() < contentHeight.get()) {
      handoff.owner = self;
      handoff.until = Date.now() + AnimationService.panel.close.duration;
    }

    offset.set(
      withTiming(contentHeight.get() || SCREEN_HEIGHT, AnimationService.panel.close, (finished) => {
        "worklet";
        if (finished) {
          scheduleOnRN(setIsRendered, false);
        }
      }),
    );
  }, [visible, offset, contentHeight, backdropOpacity, drag, closing, self]);

  useEffect(() => {
    veilOpacity.set(withTiming(veil ? 1 : 0, AnimationService.panel.open));
  }, [veil, veilOpacity]);

  const expand = useCallback(() => latest.current.onExpand?.(), []);
  const collapse = useCallback(() => latest.current.onCollapse?.(), []);

  const requestClose = useCallback(() => {
    if (latest.current.canClose && !latest.current.canClose()) {
      closing.set(false);
      drag.set(withSpring(0, AnimationService.panel.snap));
      return;
    }
    latest.current.onClose();
  }, [closing, drag]);

  const keyboardFit = useDerivedValue(() => {
    const progress = keyboardProgress.value;
    const covered = progress > 0 ? -keyboardHeight.value / progress : 0;
    const natural = innerBottom.value + bottomPad;
    const heightWith = (keyboardLift: number) => {
      const room = Math.max(0, fullHeight - keyboardLift);
      const rest = Math.max(natural, minHeight);
      const held = Math.min(room, rest + lift.value);
      return Math.min(tall ? fullHeight : Infinity, Math.max(rest, held, Math.min(1, grow.value) * room));
    };
    const open = heightWith(0);
    const shut = heightWith(covered > 0 ? covered + insets.bottom + BOTTOM_ROOM : 0);
    const room = Math.max(0, shut - innerBottom.value - keyboardGap);
    const shift = avoided ? Math.min(covered, room) : -Math.max(0, covered - room);
    return { height: open + (shut - open) * progress, shift: shift * progress };
  });
  const pan = usePanGesture({
    enabled: visible,
    activeOffsetY: onExpand && !expanded ? [-DRAG_START, DRAG_START] : [-1000, DRAG_START],
    failOffsetX: [-24, 24],
    onUpdate: (event) => {
      if (scrollY.value > 0) {
        dragFrom.set(-1);
        drag.set(0);
        return;
      }
      if (dragFrom.value < 0) dragFrom.set(event.translationY);
      const moved = event.translationY - dragFrom.value;
      drag.set(Math.max(0, moved));
      lift.set(canExpand.value ? Math.max(0, -moved) : 0);
    },
    onDeactivate: (event) => {
      const pulled = drag.value;
      const lifted = lift.value;
      dragFrom.set(-1);
      const covered = -keyboardHeight.value;
      const keyboardLift = covered > 0 ? covered + (insets.bottom + BOTTOM_ROOM) * keyboardProgress.value : 0;
      const room = Math.max(1, fullHeight - keyboardLift);
      const carry = { ...AnimationService.panel.snap, overshootClamping: true };
      if (lifted > EXPAND_DISTANCE || (lifted > 0 && event.velocityY < EXPAND_VELOCITY)) {
        grow.set(Math.min(1, keyboardFit.value.height / room));
        lift.set(0);
        growTarget.set(1);
        isExpanded.set(true);
        canExpand.set(false);
        grow.set(withSpring(1, { ...carry, velocity: -event.velocityY / room }));
        scheduleOnRN(expand);
        return;
      }
      if (lifted > 0) lift.set(withSpring(0, { ...AnimationService.panel.snap, velocity: -event.velocityY }));
      const limit = Math.min(
        DISMISS_DISTANCE,
        contentHeight.value * DISMISS_SHARE,
      );
      if (isExpanded.value && (pulled > DISMISS_DISTANCE || (pulled > 0 && event.velocityY > DISMISS_VELOCITY))) {
        growTarget.set(0);
        isExpanded.set(false);
        grow.set(withSpring(0, { ...carry, velocity: -event.velocityY / room }));
        drag.set(withSpring(0, { ...carry, velocity: event.velocityY }));
        scheduleOnRN(collapse);
        return;
      }
      if (pulled > limit || (pulled > 0 && event.velocityY > DISMISS_VELOCITY)) {
        closing.set(true);
        drag.set(withSpring(contentHeight.value, { ...carry, velocity: event.velocityY }));
        scheduleOnRN(requestClose);
        return;
      }
      drag.set(
        withSpring(0, { ...AnimationService.panel.snap, velocity: event.velocityY }),
      );
    },
    onFinalize: () => {
      dragFrom.set(-1);
      if (!closing.value && drag.value > 0)
        drag.set(withSpring(0, AnimationService.panel.snap));
    },
  });

  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (expanded && latest.current.onCollapse) latest.current.onCollapse();
        else requestClose();
        return true;
      },
    );

    return () => subscription.remove();
  }, [visible, requestClose, expanded]);

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    setFrame({ width: event.nativeEvent.layout.width, height: measured });
    const previous = contentHeight.get();
    contentHeight.set(measured);
    if (morphing.current || isExpanded.get() || lift.get() > 0 || grow.get() > 0 || !visible || measured <= previous) return;
    offset.set(previous === 0 ? measured : offset.get() + measured - previous);
    offset.set(
      withDelay(
        handoffWait(self),
        withTiming(0, AnimationService.panel.resize),
      ),
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value + drag.value + keyboardFit.value.shift }],
  }));
  const growStyle = useAnimatedStyle(() => ({ minHeight: keyboardFit.value.height }));
  const hintStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, lift.value / EXPAND_DISTANCE) * 0.6,
    transform: [{ translateY: -Math.min(lift.value, EXPAND_DISTANCE) * 0.15 }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      backdropOpacity.value *
      veilOpacity.value *
      (1 - Math.min(1, drag.value / Math.max(1, contentHeight.value))),
  }));

  if (!isRendered) return null;

  const grip = (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.grip,
        {
          backgroundColor: gripLook?.color ?? skin.panel.ink,
          ...(gripLook?.width !== undefined && { width: gripLook.width }),
          ...(gripLook?.height !== undefined && { height: gripLook.height, borderRadius: gripLook.height / 2 }),
          ...(gripLook?.opacity !== undefined && { opacity: gripLook.opacity }),
        },
      ]}
    />
  );

  const sheet = (
    <Animated.View
      style={[
        styles.panel,
        {
          backgroundColor: glassy ? "transparent" : skin.panel.fill,
          borderTopLeftRadius: skin.panel.radius,
          borderTopRightRadius: skin.panel.radius,
        },
        animatedStyle,
      ]}
    >
      {glassy && (
        <GlassLayer
          target={glassTarget!}
          settings={glass}
          veil={skin.panel.veil ?? skin.panel.fill}
          backing={skin.colors.ground}
        />
      )}
      <Animated.View
        onLayout={handleContentLayout}
        style={[
          growStyle,
          styles.content,
          { paddingBottom: bottomPad },
          tall && { maxHeight: WINDOW_HEIGHT - Math.max(insets.top, DEVICE_TOP) - skin.spacing.top },
          {
            borderColor: "transparent",
            borderTopLeftRadius: skin.panel.radius,
            borderTopRightRadius: skin.panel.radius,
          },
        ]}
      >
        <View
          style={styles.inner}
          onLayout={(event) => innerBottom.set(event.nativeEvent.layout.y + event.nativeEvent.layout.height)}
        >
        {grip}
        {expandHint && onExpand && !expanded && (
          <Animated.View style={[styles.hint, hintStyle]}>
            <Press
              accessibilityRole="button"
              accessibilityLabel={expandHint}
              hitSlop={skin.spacing.small}
              onPress={onExpand}
            >
              <ThemedText size={skin.type.caption} color={skin.panel.ink} style={styles.hintText}>
                {expandHint}
              </ThemedText>
            </Press>
          </Animated.View>
        )}
        <PanelScrollContext.Provider value={{ pan, scrollY }}>
          <PanelSkin>{children}</PanelSkin>
        </PanelScrollContext.Provider>
        </View>
      </Animated.View>
      <PanelStroke width={frame.width} height={frame.height} />
    </Animated.View>
  );

  return (
    <View style={styles.root}>
      <AnimatedPressable
        onPress={dismissible ? requestClose : undefined}
        accessibilityLabel={dismissible ? "Close" : undefined}
        style={[
          styles.backdrop,
          { backgroundColor: skin.colors.scrim },
          backdropStyle,
        ]}
      />
      <GestureDetector gesture={pan}>{sheet}</GestureDetector>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: {
      zIndex: 10,
    },
    backdrop: {
      position: "absolute",
      bottom: "100%",
      left: 0,
      right: 0,
      height: SCREEN_HEIGHT,
    },
    panel: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      overflow: "hidden",
    },
    inner: { flexShrink: 1, gap: s.spacing.stack, minHeight: 0 },
    content: {
      borderTopWidth: s.shape.accentBorder,
      borderLeftWidth: s.panel.radius > 0 ? s.shape.border : 0,
      borderRightWidth: s.panel.radius > 0 ? s.shape.border : 0,
      paddingHorizontal: s.spacing.gutter,
      paddingVertical: s.spacing.section,
    },
    hint: { alignSelf: "center", marginTop: -s.spacing.small },
    hintText: { opacity: 0.7, textAlign: "center" },
    grip: {
      alignSelf: "center",
      borderRadius: s.spacing.tight,
      height: s.spacing.tight + 1,
      marginBottom: -s.spacing.small,
      marginTop: -s.spacing.small,
      opacity: 0.3,
      width: s.spacing.page,
    },
  });

export default BottomPanel;
