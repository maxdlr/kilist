import FoodIcon from "@/components/elements/FoodIcon";
import { SwipeDirection } from "@/components/elements/SwipeDeck";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { calmColors } from "@/skins/calm/theme/useCalmColors";
import { CardPads, CText } from "@/skins/calm/components";
import { useDeckCardLook } from "@/skins/calm/components/deckCard";
import { Sample } from "./shared";

const PracticeCard = ({
  item,
  behind,
  intent,
  onFling,
}: {
  item: Sample;
  behind: boolean;
  intent: SwipeDirection | null;
  onFling?: (direction: SwipeDirection) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const look = useDeckCardLook(behind);

  return (
    <View style={styles.sheet}>
      <Animated.View style={[styles.card, look.cardStyle]}>
        <Animated.View style={[styles.flex, look.contentStyle]}>
          <View style={styles.cardBody}>
            <FoodIcon
              name={item.icon ?? undefined}
              size={skin.size.icon.card}
            />
            <CText weight="bold" size={skin.type.title} style={styles.center}>
              {item.name}
            </CText>
          </View>
          <CardPads labels intent={intent} onFling={onFling} />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    center: { textAlign: "center" },
    sheet: {
      backgroundColor: C.ground,
      flex: 1,
      paddingBottom: s.spacing.stack,
      paddingTop: s.spacing.small,
    },
    card: {
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.size.button.lg / 2 + s.spacing.inline,
      borderWidth: s.shape.border,
      flex: 1,
    },
    cardBody: {
      alignItems: "center",
      flex: 1,
      gap: s.spacing.stack,
      justifyContent: "center",
      padding: s.spacing.gutter,
    },
  });

export default PracticeCard;
