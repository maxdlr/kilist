import Press from "@/components/elements/Press";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText, Dot } from "@/skins/calm/components";

const FoodRow = ({
  food,
  deleting,
  selected,
  onPress,
}: {
  food: FoodType;
  deleting: boolean;
  selected: boolean;
  onPress: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);

  return (
    <Press
      accessibilityRole="button"
      accessibilityState={deleting ? { selected } : undefined}
      accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? skin.shape.pressedOpacity : 1 }]}
    >
      {deleting && (
        <View style={[styles.box, { backgroundColor: selected ? C.fill : "transparent", borderColor: selected ? C.fill : C.ring }]}>
          {selected && (
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12l4 4 10-10" stroke={C.onFill} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      )}
      <CText size={skin.type.lead} style={styles.flex} numberOfLines={1}>{food.name}</CText>
      <CText size={skin.type.caption} color={C.textSoft}>{skin.copy.levels[level]}</CText>
      <Dot color={skin.colors.levels[level]} />
    </Press>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.list,
    },
    box: {
      alignItems: "center",
      borderRadius: s.spacing.tight + 2,
      borderWidth: 1.5,
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
  });

export default FoodRow;
