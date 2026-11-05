import { useFocusEffect } from "expo-router";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { height: SCREEN_HEIGHT } = Dimensions.get("screen");

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
  const theme = useTheme();
  const height = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const latest = useRef({ visible, onClose });
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
    backdropOpacity.set(withTiming(visible ? 1 : 0, AnimationService.config));

    if (visible) {
      const measured = contentHeight.get();
      if (measured > 0) {
        height.set(withTiming(measured, AnimationService.config));
      }
      return;
    }

    height.set(
      withTiming(0, AnimationService.config, (finished) => {
        "worklet";
        if (finished) {
          scheduleOnRN(setIsRendered, false);
        }
      }),
    );
  }, [visible, height, contentHeight, backdropOpacity]);

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
      height.set(withTiming(measured, AnimationService.config));
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isRendered) return null;

  return (
    <View style={styles.root}>
      <AnimatedPressable
        onPress={dismissible ? onClose : undefined}
        accessibilityLabel={dismissible ? "Close" : undefined}
        style={[styles.backdrop, backdropStyle]}
      />
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: theme.background,
            borderColor: theme.backgroundSelected,
          },
          animatedStyle,
        ]}
      >
        <View onLayout={handleContentLayout} style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    zIndex: 10,
  },
  backdrop: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    overflow: "hidden",
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    gap: Spacing.three,
    padding: Spacing.four,
  },
});

export default BottomPanel;
