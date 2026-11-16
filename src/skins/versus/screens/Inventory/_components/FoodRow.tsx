import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import V from "@/skins/versus/text";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { ANSWER_FILL, Chip, initialOf, VText, WORD } from "@/skins/versus/components";
import { Vote } from "./shared";

const isClash = (votes: Vote[]) => {
  const cast = votes.map((vote) => vote.answer).filter((answer) => answer === "in" || answer === "out");
  return cast.includes("in") && cast.includes("out");
};

const FoodRow = ({
  food,
  votes,
  colors,
  deleting,
  selected,
  onPress,
}: {
  food: FoodType;
  votes: Vote[];
  colors: Record<number, string>;
  deleting: boolean;
  selected: boolean;
  onPress: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const clash = isClash(votes);
  const voteText = votes.map((vote) => V.said(vote.username, vote.answer ? WORD[vote.answer] : V.inventory.noVoteLower)).join(", ");

  return (
    <Press
      accessibilityRole="button"
      accessibilityState={deleting ? { selected } : undefined}
      accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}${clash ? V.inventory.clashAria : ""}. ${voteText}`}
      onPress={onPress}
      style={withPressed([styles.row, { borderColor: selected ? P.you : "transparent" }])}
    >
      {deleting && (
        <View style={[styles.box, { backgroundColor: selected ? P.you : "transparent", borderColor: selected ? P.you : P.faint }]}>
          {selected && (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12l4 4 10-10" stroke={P.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      )}
      <View style={styles.thumb}>
        <FoodPicture food={food} size={skin.size.icon.row - 8} />
      </View>
      <View style={[styles.flex, styles.rowBody]}>
        <View style={styles.nameRow}>
          <VText face="bold" size={skin.type.lead - 1} numberOfLines={1} style={styles.shrink}>
            {food.name}
          </VText>
          {clash && <Chip label={V.inventory.clash} fill={P.clash} />}
        </View>
        <Chip label={skin.copy.levels[level]} fill={skin.colors.levels[level]} />
      </View>
      <View style={styles.dots}>
        {votes.map((vote) => (
          <View
            key={vote.userId}
            style={[
              styles.dot,
              { backgroundColor: vote.answer ? ANSWER_FILL[vote.answer] : P.line, borderColor: colors[vote.userId] },
            ]}
          >
            <VText face="bold" size={skin.type.caption - 3} color={vote.answer && vote.answer !== "up" ? P.ink : P.muted}>
              {initialOf(vote.username)}
            </VText>
          </View>
        ))}
      </View>
    </Press>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    shrink: { flexShrink: 1 },
    row: {
      alignItems: "center",
      backgroundColor: P.panel,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline + 2,
      minHeight: s.size.row.list,
      paddingLeft: s.spacing.inline,
      paddingRight: s.spacing.inline + 2,
      paddingVertical: s.spacing.small,
    },
    box: {
      alignItems: "center",
      borderRadius: s.spacing.small,
      borderWidth: s.shape.border,
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
    thumb: {
      alignItems: "center",
      backgroundColor: P.white,
      borderRadius: s.spacing.dock - 2,
      height: s.size.icon.row + 2,
      justifyContent: "center",
      width: s.size.icon.row + 2,
    },
    rowBody: { gap: s.spacing.tight + 1 },
    nameRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    dots: { flexDirection: "row", gap: s.spacing.tight },
    dot: {
      alignItems: "center",
      borderRadius: 12,
      borderWidth: s.shape.border,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
  });

export default FoodRow;
