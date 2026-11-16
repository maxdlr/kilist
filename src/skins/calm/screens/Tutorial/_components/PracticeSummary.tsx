import T from "@/skins/calm/text";
import { SwipeDirection } from "@/components/elements/SwipeDeck";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";
import { Answer } from "./shared";
import Named from "./Named";

const PracticeSummary = ({ answers }: { answers: Answer[] }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const namesOf = (direction: SwipeDirection) =>
    answers
      .filter((answer) => answer.direction === direction)
      .map((answer) => answer.name);
  const sentences = [
    { names: namesOf("left"), say: copy.summaryOut },
    { names: namesOf("right"), say: copy.summaryIn },
    { names: namesOf("up"), say: copy.summaryUnsure },
  ]
    .filter((group) => group.names.length > 0)
    .map((group) => group.say(group.names));

  return (
    <View accessibilityLiveRegion="polite" style={styles.summary}>
      <CText
        weight="medium"
        size={skin.type.display.md}
        style={[styles.center, styles.summaryTitle]}
        accessibilityRole="header"
      >
        {copy.summaryTitle}
      </CText>
      <View style={styles.bullets}>
        {sentences.map((sentence) => (
          <View key={sentence} style={styles.bullet}>
            <CText size={skin.type.body} color={C.text}>
              {"•"}
            </CText>
            <CText size={skin.type.body} color={C.text} style={styles.flex}>
              <Named
                text={sentence}
                names={answers.map((answer) => answer.name)}
                size={skin.type.body}
                color={C.text}
              />
            </CText>
          </View>
        ))}
      </View>
      <CText
        weight="medium"
        size={skin.type.body}
        color={C.text}
        style={[styles.center, styles.summaryEnd]}
      >
        {copy.summaryEnd}
      </CText>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    center: { textAlign: "center" },
    summary: { gap: s.spacing.stack, paddingHorizontal: s.spacing.small },
    summaryTitle: { paddingBottom: s.spacing.section },
    bullets: { gap: s.spacing.small },
    bullet: { flexDirection: "row", gap: s.spacing.small },
    summaryEnd: { paddingTop: s.spacing.stack },
  });

export default PracticeSummary;
