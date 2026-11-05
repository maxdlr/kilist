import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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

/**
 * A segmented toggle for choosing one option among a small set of mutually
 * exclusive choices. Unlike KilButton, this renders a single connected track
 * where the selected segment is highlighted - the proper control for
 * "either/or" choices such as join-vs-create.
 */
const KilToggleButton = <T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: KilToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: {
    container?: any;
    segment?: any;
    label?: any;
  };
}) => {
  const theme = useTheme();
  const segmentWidth = useSharedValue(0);
  const selectedIndex = options.findIndex((option) => option.value === value);

  const handleLayout = (event: LayoutChangeEvent) => {
    segmentWidth.value =
      (event.nativeEvent.layout.width - 2 * Spacing.half) / options.length;
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
        { backgroundColor: theme.backgroundElement },
        style?.container,
      ]}
    >
      <Animated.View style={[styles.highlight, highlightStyle]} />
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[styles.segment, style?.segment]}
          >
            <ThemedText
              type="default"
              numberOfLines={1}
              themeColor={isSelected ? undefined : "textSecondary"}
              style={[
                styles.label,
                isSelected && styles.labelSelected,
                style?.label,
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: Spacing.six,
    padding: Spacing.half,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.six,
    alignItems: "center",
    justifyContent: "center",
  },
  // Selected segment matches the app's primary button color (see KilButton).
  highlight: {
    position: "absolute",
    top: Spacing.half,
    bottom: Spacing.half,
    left: Spacing.half,
    borderRadius: Spacing.six,
    backgroundColor: "#007AFF",
  },
  label: {
    textAlign: "center",
  },
  labelSelected: {
    color: "#FFFFFF",
  },
});

export default KilToggleButton;
