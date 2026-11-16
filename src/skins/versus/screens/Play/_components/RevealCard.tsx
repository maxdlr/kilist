import V from "@/skins/versus/text";
import { RaceGame } from "@/skins/versus/hooks/useRaceGame";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Chip, memberColor, VText, WORD } from "@/skins/versus/components";

const RevealCard = ({ game }: { game: RaceGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const reveal = game.reveal!;
  const members = game.race?.members ?? [];

  if (game.isSolo) {
    const previous = reveal.previous;
    if (!previous) return null;
    const same = previous.answer === reveal.mine;
    const color = same ? P.agree : P.clash;
    return (
      <View accessibilityLiveRegion="polite" style={[styles.reveal, { borderColor: color }]}>
        <View style={styles.between}>
          <VText face="display" size={skin.type.title - 2} color={color}>
            {same ? V.play.same : V.play.changed}
          </VText>
        </View>
        <View style={styles.chips}>
          <Chip label={V.play.today(WORD[reveal.mine])} fill={P.you} />
          <Chip label={`${previous.day}: ${WORD[previous.answer]}`} fill={P.you} dashed />
        </View>
        <VText size={skin.type.caption} color={P.soft}>
          {same ? V.play.steady : V.play.moved}
        </VText>
      </View>
    );
  }

  if (reveal.mates.length === 0) return null;
  const agree = reveal.mates.every((mate) => mate.answer === reveal.mine);
  const color = agree ? P.agree : P.clash;
  const verdict = reveal.verdict;

  return (
    <View accessibilityLiveRegion="polite" style={[styles.reveal, { borderColor: color }]}>
      <View style={styles.between}>
        <VText face="display" size={skin.type.headline} color={color}>
          {agree ? V.play.agreed : V.play.clash}
        </VText>
        <VText face="pixel" size={(skin.type.caption - 1) - 4} color={P.muted}>
          {reveal.food.name.toUpperCase()}
        </VText>
      </View>
      <View style={styles.chips}>
        <Chip label={V.said(V.you, WORD[reveal.mine])} fill={P.you} />
        {reveal.mates.map((mate) => (
          <Chip key={mate.userId} label={`${mate.username}: ${WORD[mate.answer]}`} fill={memberColor(members, user?.id, mate.userId)} />
        ))}
      </View>
      {verdict && (
        <VText size={skin.type.caption} color={P.soft}>
          {verdict.result === "tied"
            ? V.play.tiedSoFar
            : V.play.verdictSoFar(verdict.result === "needed")}
        </VText>
      )}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    between: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.tight + 2 },
    reveal: {
      backgroundColor: P.ground,
      borderRadius: s.shape.radius + s.spacing.hair,
      borderWidth: s.shape.border + 1,
      boxShadow: `0 6px 0 ${P.cardShadow}`,
      gap: s.spacing.inline,
      padding: s.spacing.dock - 2,
    },
  });

export default RevealCard;
