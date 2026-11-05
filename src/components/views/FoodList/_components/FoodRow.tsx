import FoodIcon from "@/components/elements/FoodIcon";
import Pill from "@/components/elements/Pill";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { FoodType } from "@/types/model";
import { inStockScoreToDisplay } from "@/utils/scoreUtils";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

const FoodRow = ({
  food,
  style,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onOpenMenu,
}: {
  food: FoodType;
  style?: StyleProp<ViewStyle>;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (foodId: number) => void;
  onOpenMenu?: (food: FoodType) => void;
}) => {
  const { id, name, inStockScore, icon } = food;
  const theme = useTheme();
  const display = inStockScoreToDisplay(inStockScore, theme);

  const openMenu = () => {
    if (isSelectMode) return;
    onOpenMenu?.(food);
  };

  const longPress = useLongPressGesture({
    onActivate: () => {
      scheduleOnRN(openMenu);
    },
  });

  const handlePress = () => {
    if (isSelectMode) onToggleSelect?.(id);
  };

  return (
    <GestureDetector gesture={longPress}>
      <Pressable onPress={handlePress}>
        <ThemedView
          style={{
            ...styles.item,

            backgroundColor: isSelected
              ? theme.backgroundSelected
              : display.color[50],

            height: 70,

            borderBottomColor: display.color[60],

            ...style,
          }}
        >
          <ThemedView style={styles.nameSection}>
            {isSelectMode && (
              <ThemedView
                style={[
                  styles.checkbox,
                  {
                    borderColor: theme.textSecondary,
                    backgroundColor: isSelected ? theme.text : "transparent",
                  },
                ]}
              />
            )}
            <FoodIcon name={icon} size={36} />
            <ThemedText
              type="default"
              style={{ ...styles.name, color: display.color[90] }}
            >
              {name}
            </ThemedText>
          </ThemedView>

          <ThemedView
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.four,
            }}
          >
            <Pill label={display.label} display={display} />
          </ThemedView>
        </ThemedView>
      </Pressable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  item: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 2,
  },

  nameSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    flexShrink: 1,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
  },

  name: {},
});

export default FoodRow;
