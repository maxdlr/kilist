import V from "@/skins/versus/text";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Chip, VText } from "@/skins/versus/components";

const FoodCard = ({ food, position, total }: { food: FoodType; position: number; total: number }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const [hero, setHero] = useState(0);

  return (
    <View style={styles.cardSlot}>
      <View style={[styles.foodCard, { boxShadow: `0 6px 0 ${P.cardShadow}` }]}>
        <View style={styles.between}>
          <VText size={skin.type.caption} color={P.cardInk}>{V.play.position(position + 1, total)}</VText>
          <VText size={skin.type.caption} color={P.cardInk}>{V.play.cardTickets}</VText>
        </View>
        <View
          style={styles.hero}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setHero(Math.floor(Math.min(width * 0.8, height * 0.9)));
          }}
        >
          {hero > 0 && <FoodPicture food={food} size={hero} />}
        </View>
        <View style={styles.between}>
          <VText face="bold" size={skin.type.display.md} color={P.ink} numberOfLines={1} adjustsFontSizeToFit style={styles.flex}>
            {food.name}
          </VText>
          <Chip label={skin.copy.levels[level]} fill={skin.colors.levels[level]} />
        </View>
      </View>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    between: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    cardSlot: { flex: 1, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter, paddingTop: s.spacing.small },
    foodCard: {
      backgroundColor: P.white,
      borderRadius: s.shape.radius + s.spacing.inline,
      flex: 1,
      gap: s.spacing.small,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.stack,
    },
    hero: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 0 },
  });

export default FoodCard;
