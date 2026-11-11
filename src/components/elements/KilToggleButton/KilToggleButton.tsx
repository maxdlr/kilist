import withPressed from "@/utils/withPressed";
import type { Skin } from "@/skins/types";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SLIDE_DURATION = 200;

export type KilToggleOption<T extends string> = {
  label: string;
  value: T;
};

const KilToggleButton = <T extends string>({
  options,
  value,
  onChange,
  onDark = false,
}: {
  options: KilToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onDark?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { fill, ink } = skin.actions.primary;
  const idleInk = onDark ? skin.colors.onGround : skin.colors.onPaper;
  const segmentWidth = useSharedValue(0);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const border = skin.shape.border;

  const handleLayout = (event: LayoutChangeEvent) => {
    segmentWidth.value =
      (event.nativeEvent.layout.width - 2 * border) / options.length;
  };

  const highlightStyle = useAnimatedStyle(() => ({
    width: segmentWidth.value,
    transform: [
      {
        translateX: withTiming(selectedIndex * segmentWidth.value, {
          duration: SLIDE_DURATION,
          easing: AnimationService.config.easing,
        }),
      },
    ],
  }));

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          borderColor: idleInk,
          borderRadius: skin.shape.radius,
          borderWidth: border,
        },
      ]}
    >
      <Animated.View
        style={[styles.highlight, { backgroundColor: fill }, highlightStyle]}
      />
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={withPressed(styles.segment)}
          >
            <ThemedText
              allowFontScaling={false}
              numberOfLines={1}
              size={skin.type.label}
              color={isSelected ? ink : idleInk}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    track: {
      flexDirection: "row",
      height: s.size.toggle,
      overflow: "hidden",
    },
    segment: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    highlight: {
      bottom: 0,
      left: 0,
      position: "absolute",
      top: 0,
    },
  });

export default KilToggleButton;
