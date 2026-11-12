import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import type { Skin } from "@/skins/types";
import FoodIcon from "@/components/elements/FoodIcon";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { StyleSheet, View } from "react-native";

const FoodRow = ({
  food,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onEdit,
}: {
  food: FoodType;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (foodId: number) => void;
  onEdit?: (food: FoodType) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { id, name, inStockScore, icon } = food;
  const level = levelOf(inStockScore);
  const label = skin.copy.levels[level];
  const ink = skin.colors.onLevel;

  return (
    <Press
      accessibilityRole="button"
      accessibilityState={isSelectMode ? { selected: isSelected } : undefined}
      accessibilityLabel={`${name}, ${label}`}
      onPress={() => (isSelectMode ? onToggleSelect?.(id) : onEdit?.(food))}
      style={withPressed([
        styles.row,
        {
          backgroundColor: skin.colors.levels[level],
          borderBottomColor: skin.colors.ground,
        },
      ])}
    >
      {isSelectMode && (
        <View
          style={[
            styles.check,
            { borderColor: ink, borderWidth: skin.shape.border + 1 },
            isSelected && { backgroundColor: skin.actions.primary.fill },
          ]}
        >
          {isSelected && (
            <ThemedText size={skin.type.caption} color={skin.actions.primary.ink}>
              X
            </ThemedText>
          )}
        </View>
      )}
      <FoodIcon name={icon} size={skin.size.icon.row} />
      <ThemedText numberOfLines={1} size={skin.type.lead} color={ink} style={styles.name}>
        {caseFor(skin, name)}
      </ThemedText>
      <ThemedText size={skin.type.caption} color={ink}>
        {label}
      </ThemedText>
    </Press>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    row: {
      alignItems: "center",
      borderBottomWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      height: s.size.row.list,
      paddingLeft: s.spacing.inline,
      paddingRight: s.spacing.gutter,
    },
    check: {
      alignItems: "center",
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
    name: {
      flex: 1,
    },
  });

export default FoodRow;
