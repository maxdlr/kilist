import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import { SwipeDirection } from "@/components/elements/SwipeDeck";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { useDeckCardLook } from "@/skins/calm/components/deckCard";
import { CardPads, CText } from "@/skins/calm/components";

const CheckCard = ({
  food,
  intent,
  labels,
  behind,
  onFling,
}: {
  food: FoodType;
  intent: SwipeDirection | null;
  labels: boolean;
  behind: boolean;
  onFling?: (direction: SwipeDirection) => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const look = useDeckCardLook(behind);
  return (
    <View style={styles.cardSlot}>
      <Animated.View style={[styles.card, look.cardStyle]}>
        <Animated.View style={[styles.cardFace, look.contentStyle]}>
          <View style={styles.cardBody}>
            <FoodPicture food={food} size={skin.size.icon.card} />
            <View style={styles.cardText}>
              <CText
                weight="medium"
                size={skin.type.headline + 2}
                color={C.gameCard.title}
                style={styles.center}
                numberOfLines={2}
              >
                {food.name}
              </CText>
              <CText
                size={skin.type.body - 1}
                color={C.gameCard.question}
                style={styles.center}
              >
                {T.play.question}
              </CText>
            </View>
          </View>
          <CardPads intent={intent} labels={labels} onFling={onFling} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    center: { textAlign: "center" },
    cardSlot: {
      flex: 1,
      paddingHorizontal: s.spacing.gutter,
      paddingVertical: s.spacing.stack,
    },
    card: {
      backgroundColor: C.gameCard.front.fill,
      borderColor: C.gameCard.front.border,
      borderRadius: C.gameCard.border.radius,
      borderWidth: C.gameCard.border.width,
      flex: 1,
    },
    cardFace: { flex: 1 },
    cardBody: {
      alignItems: "center",
      flex: 1,
      gap: s.spacing.section - 4,
      justifyContent: "center",
      padding: s.spacing.gutter,
    },
    cardText: { alignItems: "center", gap: s.spacing.tight + 2 },
  });

export default CheckCard;
