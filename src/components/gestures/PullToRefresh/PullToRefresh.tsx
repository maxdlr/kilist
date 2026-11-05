import type { Skin } from "@/skins/types";
import Title from "@/components/elements/Title/Title";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import { ArrowDownIcon } from "react-native-heroicons/solid";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const RELEASE_AT = 110;
const MAX_PULL = 170;

const PullToRefresh = ({
  onRefresh,
  children,
}: {
  onRefresh: () => unknown;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const pull = useSharedValue(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      pull.set(withTiming(0, { duration: 200 }));
    }
  };

  const pan = usePanGesture({
    enabled: !isRefreshing,
    activeOffsetY: [-1000, 12],
    failOffsetX: [-24, 24],
    onUpdate: (event) => {
      pull.set(clamp(event.translationY * 0.6, 0, MAX_PULL));
    },
    onFinalize: () => {
      if (pull.value >= RELEASE_AT) {
        pull.set(withTiming(RELEASE_AT, { duration: 120 }));
        scheduleOnRN(refresh);
        return;
      }
      pull.set(withTiming(0, { duration: 200 }));
    },
  });

  const bandStyle = useAnimatedStyle(() => ({ height: pull.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pull.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root}>
        <Animated.View style={[styles.flex, contentStyle]}>
          {children}
        </Animated.View>
        <Animated.View
          style={[styles.band, { backgroundColor: skin.colors.alert }, bandStyle]}
        >
          <ArrowDownIcon size={skin.size.icon.action} color={skin.colors.onAlert} />
          <Title
            size={skin.type.headline}
            lines={1}
            header={false}
            color={skin.colors.onAlert}
            style={styles.bandTitle}
          >
            {isRefreshing ? skin.copy.empty.refreshing : skin.copy.empty.pull}
          </Title>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: {
      flex: 1,
      overflow: "hidden",
    },
    flex: {
      flex: 1,
    },
    bandTitle: {
      flex: 1,
    },
    band: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "center",
      left: 0,
      overflow: "hidden",
      paddingBottom: s.spacing.small,
      position: "absolute",
      right: 0,
      top: 0,
    },
  });

export default PullToRefresh;
