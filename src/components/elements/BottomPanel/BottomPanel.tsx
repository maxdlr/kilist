import type { Skin } from "@/skins/types";
import { useFocusEffect } from "expo-router";
import { PanelSkin, useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useHideTabBar, useInsideGlassTarget, useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import { BlurView } from "expo-blur";
import PANEL_GLASS, { type PanelGlass } from "./panelGlass";
import PanelStroke from "./PanelStroke";
import { PanelScrollContext } from "./panelScroll";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
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
const TINTLESS = 1;

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
  glass: glassOverride,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  dismissible?: boolean;
  canClose?: () => boolean;
  tall?: boolean;
  glass?: Partial<PanelGlass>;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  useHideTabBar(visible);
  const insets = useSafeAreaInsets();
  const { glassTarget } = useTabBarVisibility();
  const insideTarget = useInsideGlassTarget();
  const gripLook = skin.bottomPanel.grip;
  const glass = { ...PANEL_GLASS, ...skin.bottomPanel.glassSettings, ...glassOverride };
  const glassy = glass.enabled && Boolean(glassTarget) && !insideTarget;
  const offset = useSharedValue(SCREEN_HEIGHT);
  const contentHeight = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const drag = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const dragFrom = useSharedValue(-1);
  const closing = useSharedValue(false);
  const latest = useRef({ visible, onClose, canClose });
  const [self] = useState(() => ({}));
  const [isRendered, setIsRendered] = useState(visible);
  const [frame, setFrame] = useState({ width: 0, height: 0 });

  if (visible && !isRendered) {
    setIsRendered(true);
  }

  useEffect(() => {
    latest.current = { visible, onClose, canClose };
  }, [visible, onClose, canClose]);

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
        visible ? AnimationService.config : AnimationService.panelClose,
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
              withTiming(0, AnimationService.config),
            ),
          );
        }
      }, 0);
      return () => clearTimeout(open);
    }

    if (offset.get() < contentHeight.get()) {
      handoff.owner = self;
      handoff.until = Date.now() + AnimationService.panelClose.duration;
    }

    offset.set(
      withTiming(contentHeight.get() || SCREEN_HEIGHT, AnimationService.panelClose, (finished) => {
        "worklet";
        if (finished) {
          scheduleOnRN(setIsRendered, false);
        }
      }),
    );
  }, [visible, offset, contentHeight, backdropOpacity, drag, closing, self]);

  const requestClose = useCallback(() => {
    if (latest.current.canClose && !latest.current.canClose()) {
      closing.set(false);
      drag.set(withSpring(0, AnimationService.snap));
      return;
    }
    latest.current.onClose();
  }, [closing, drag]);

  const pan = usePanGesture({
    enabled: visible,
    activeOffsetY: [-1000, DRAG_START],
    failOffsetX: [-24, 24],
    onUpdate: (event) => {
      if (scrollY.value > 0) {
        dragFrom.set(-1);
        drag.set(0);
        return;
      }
      if (dragFrom.value < 0) dragFrom.set(event.translationY);
      drag.set(Math.max(0, event.translationY - dragFrom.value));
    },
    onDeactivate: (event) => {
      const pulled = drag.value;
      dragFrom.set(-1);
      const limit = Math.min(
        DISMISS_DISTANCE,
        contentHeight.value * DISMISS_SHARE,
      );
      if (pulled > limit || (pulled > 0 && event.velocityY > DISMISS_VELOCITY)) {
        closing.set(true);
        scheduleOnRN(requestClose);
        return;
      }
      drag.set(
        withSpring(0, { ...AnimationService.snap, velocity: event.velocityY }),
      );
    },
    onFinalize: () => {
      dragFrom.set(-1);
      if (!closing.value && drag.value > 0)
        drag.set(withSpring(0, AnimationService.snap));
    },
  });

  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        requestClose();
        return true;
      },
    );

    return () => subscription.remove();
  }, [visible, requestClose]);

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    setFrame({ width: event.nativeEvent.layout.width, height: measured });
    const previous = contentHeight.get();
    contentHeight.set(measured);
    if (!visible || measured <= previous) return;
    offset.set(previous === 0 ? measured : offset.get() + measured - previous);
    offset.set(
      withDelay(
        handoffWait(self),
        withTiming(0, AnimationService.config),
      ),
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value + drag.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      backdropOpacity.value *
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
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {Platform.OS === "android" && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: skin.colors.ground }]} />
          )}
          <BlurView
            blurTarget={glassTarget!}
            intensity={Platform.OS === "android" ? TINTLESS : glass.blur}
            blurReductionFactor={(TINTLESS * glass.androidReduction) / Math.max(1, glass.blur)}
            blurMethod="dimezisBlurViewSdk31Plus"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: skin.panel.veil ?? skin.panel.fill, opacity: glass.veil },
            ]}
          />
        </View>
      )}
      <View
        onLayout={handleContentLayout}
        style={[
          styles.content,
          { paddingBottom: skin.spacing.section + insets.bottom },
          tall && { maxHeight: WINDOW_HEIGHT - Math.max(insets.top, DEVICE_TOP) - skin.spacing.top },
          {
            borderColor: "transparent",
            borderTopLeftRadius: skin.panel.radius,
            borderTopRightRadius: skin.panel.radius,
          },
        ]}
      >
        {grip}
        <PanelScrollContext.Provider value={{ pan, scrollY }}>
          <PanelSkin>{children}</PanelSkin>
        </PanelScrollContext.Provider>
      </View>
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
    content: {
      borderTopWidth: s.shape.accentBorder,
      borderLeftWidth: s.panel.radius > 0 ? s.shape.border : 0,
      borderRightWidth: s.panel.radius > 0 ? s.shape.border : 0,
      gap: s.spacing.stack,
      paddingHorizontal: s.spacing.gutter,
      paddingVertical: s.spacing.section,
    },
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
