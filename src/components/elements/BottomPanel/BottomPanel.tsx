import type { Skin } from "@/skins/types";
import { useFocusEffect } from "expo-router";
import { PanelSkin, useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useHideTabBar } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
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
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { height: SCREEN_HEIGHT } = Dimensions.get("screen");
const DRAG_START = 12;
const DISMISS_DISTANCE = 120;
const DISMISS_SHARE = 0.3;
const DISMISS_VELOCITY = 900;

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
  children,
}: {
  visible: boolean;
  onClose: () => void;
  dismissible?: boolean;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  useHideTabBar(visible);
  const insets = useSafeAreaInsets();
  const height = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const drag = useSharedValue(0);
  const closing = useSharedValue(false);
  const latest = useRef({ visible, onClose });
  const [self] = useState(() => ({}));
  const [isRendered, setIsRendered] = useState(visible);

  if (visible && !isRendered) {
    setIsRendered(true);
  }

  useEffect(() => {
    latest.current = { visible, onClose };
  }, [visible, onClose]);

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
        const measured = contentHeight.get();
        if (measured > 0) {
          height.set(
            withDelay(
              handoffWait(self),
              withTiming(measured, AnimationService.config),
            ),
          );
        }
      }, 0);
      return () => clearTimeout(open);
    }

    if (height.get() > 0) {
      handoff.owner = self;
      handoff.until = Date.now() + AnimationService.panelClose.duration;
    }

    height.set(
      withTiming(0, AnimationService.panelClose, (finished) => {
        "worklet";
        if (finished) {
          scheduleOnRN(setIsRendered, false);
        }
      }),
    );
  }, [visible, height, contentHeight, backdropOpacity, drag, closing, self]);

  const requestClose = useCallback(() => latest.current.onClose(), []);

  const pan = usePanGesture({
    enabled: visible,
    activeOffsetY: [-1000, DRAG_START],
    failOffsetX: [-24, 24],
    onUpdate: (event) => {
      drag.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      const limit = Math.min(
        DISMISS_DISTANCE,
        contentHeight.value * DISMISS_SHARE,
      );
      if (event.translationY > limit || event.velocityY > DISMISS_VELOCITY) {
        closing.set(true);
        scheduleOnRN(requestClose);
        return;
      }
      drag.set(
        withSpring(0, { ...AnimationService.snap, velocity: event.velocityY }),
      );
    },
    onFinalize: () => {
      if (!closing.value && drag.value > 0)
        drag.set(withSpring(0, AnimationService.snap));
    },
  });

  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose();
        return true;
      },
    );

    return () => subscription.remove();
  }, [visible, onClose]);

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    contentHeight.set(measured);
    if (visible) {
      height.set(
        withDelay(
          handoffWait(self),
          withTiming(measured, AnimationService.config),
        ),
      );
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    transform: [{ translateY: drag.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      backdropOpacity.value *
      (1 - Math.min(1, drag.value / Math.max(1, contentHeight.value))),
  }));

  if (!isRendered) return null;

  return (
    <View style={styles.root}>
      <AnimatedPressable
        onPress={dismissible ? onClose : undefined}
        accessibilityLabel={dismissible ? "Close" : undefined}
        style={[
          styles.backdrop,
          { backgroundColor: skin.colors.scrim },
          backdropStyle,
        ]}
      />
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: skin.panel.fill,
              borderTopLeftRadius: skin.panel.radius,
              borderTopRightRadius: skin.panel.radius,
            },
            animatedStyle,
          ]}
        >
          <View
            onLayout={handleContentLayout}
            style={[
              styles.content,
              { paddingBottom: skin.spacing.section + insets.bottom },
              {
                borderColor: skin.panel.line,
                borderTopLeftRadius: skin.panel.radius,
                borderTopRightRadius: skin.panel.radius,
              },
            ]}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.grip, { backgroundColor: skin.panel.ink }]}
            />
            <PanelSkin>{children}</PanelSkin>
          </View>
        </Animated.View>
      </GestureDetector>
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
      overflow: "hidden",
    },
    content: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
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
