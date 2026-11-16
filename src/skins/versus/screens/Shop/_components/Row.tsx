import V from "@/skins/versus/text";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { VText } from "@/skins/versus/components";

const Row = ({ food, done }: { food: FoodType; done: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View
      accessible
      accessibilityLabel={`${food.name}, ${done ? V.shop.boughtLower : V.shop.notBought}`}
      style={[styles.row, { backgroundColor: done ? P.panel : P.white }]}
    >
      <View style={{ opacity: done ? 0.45 : 1 }}>
        <FoodPicture food={food} size={skin.size.icon.row} />
      </View>
      <VText
        face="bold"
        size={skin.type.lead - 1}
        color={done ? P.faint : P.ink}
        style={[styles.flex, done && styles.struck]}
        numberOfLines={1}
      >
        {food.name}
      </VText>
      {done && (
        <View style={[styles.check, { backgroundColor: P.you, borderColor: P.you }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12l4 4 10-10" stroke={P.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      )}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    row: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      flexDirection: "row",
      gap: s.spacing.inline + 2,
      minHeight: s.size.row.shop,
      paddingLeft: s.spacing.inline,
      paddingRight: s.spacing.dock - 2,
      paddingVertical: s.spacing.small,
    },
    struck: { textDecorationLine: "line-through" },
    check: {
      alignItems: "center",
      borderRadius: s.size.check,
      borderWidth: s.shape.border,
      height: s.size.check + 4,
      justifyContent: "center",
      width: s.size.check + 4,
    },
  });

export default Row;
