import { FeedbackSlot, Presence } from "@/components/elements/Feedback";
import { SwipeGame } from "@/hooks/screens/useSwipeGame";
import common from "@/i18n/common";
import { caseFor } from "@/skins";
import { DrawnMark } from "@/providers/MarkProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { ArcadeIcon, RefreshIcon } from "@/components/icons";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import {
  CButton,
  CText,
  Dot,
  HelpTip,
  Screen,
} from "@/skins/calm/components";

const Recap = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const recap = game.recap;
  const added = recap?.added ?? [];
  const kept = recap?.kept ?? [];
  const [touches, setTouches] = useState(0);

  return (
    <View
      style={styles.flex}
      onTouchStart={() => setTouches((count) => count + 1)}
    >
      <Screen
        dock={
          <>
            <CButton
              variant="secondary"
              accessibilityLabel={T.play.replay}
              onPress={game.replay}
              icon={(color) => (
                <RefreshIcon
                  size={skin.size.icon.action}
                  color={color}
                  strokeWidth={1.8}
                />
              )}
            />
            {game.allSorted ? (
              <View style={styles.allSorted}>
                <CText weight="medium" size={skin.type.body} color={C.positive}>
                  {skin.copy.swipe.allChecked}
                </CText>
              </View>
            ) : (
              <CButton
                label={skin.copy.swipe.playAgain}
                onPress={game.playAgain}
                icon={(color) => (
                  <ArcadeIcon
                    size={skin.size.icon.action}
                    color={color}
                    strokeWidth={1.8}
                  />
                )}
              />
            )}
          </>
        }
      >
        <View style={styles.topRow}>
          {!recap && !game.allSorted && (
            <HelpTip
              text={T.play.playAgainTip}
              accessibilityLabel={T.play.howAria}
              activity={touches}
            />
          )}
        </View>
        <ScrollView contentContainerStyle={styles.doneContent}>
          <View style={styles.doneText}>
            <View style={styles.doneHead}>
              <DrawnMark kind="done" color={C.positive} />
              <CText
                weight="medium"
                size={skin.type.display.md}
                accessibilityRole="header"
              >
                {T.play.sorted}
              </CText>
            </View>
            {recap ? (
              <CText size={skin.type.body} color={C.textSoft}>
                {recap.checking
                  ? common.feedback.checking
                  : added.length
                    ? T.play.added(added.length)
                    : kept.length
                      ? common.feedback.recapKept
                      : T.play.nothingNew}
              </CText>
            ) : (
              <CText size={skin.type.body} color={C.textSoft}>
                {T.play.today}
              </CText>
            )}
          </View>
          <Presence visible={added.length > 0} collapse={skin.spacing.section}>
            <View>
              {added.map((food) => (
                <View key={food.id} style={styles.row}>
                  <Dot color={skin.colors.levels[1]} />
                  <CText size={skin.type.body}>{food.name}</CText>
                </View>
              ))}
            </View>
          </Presence>
          <Presence visible={kept.length > 0} collapse={skin.spacing.section}>
            <View style={styles.kept}>
              {added.length > 0 && (
                <CText weight="medium" size={skin.type.label} color={C.text}>
                  {common.feedback.recapKept}
                </CText>
              )}
              <CText size={skin.type.label} color={C.textSoft}>
                {common.feedback.recapKeptLine}
              </CText>
              <View>
                {kept.map((food) => (
                  <View key={food.id} style={styles.row}>
                    <Dot color={skin.colors.levels[3]} />
                    <CText size={skin.type.body} style={styles.flex}>
                      {food.name}
                    </CText>
                    <CButton
                      variant="secondary"
                      small
                      label={common.feedback.addAnyway}
                      accessibilityLabel={`${common.feedback.addAnyway} ${caseFor(skin, food.name)}`}
                      onPress={() => game.addAnyway(food)}
                    />
                  </View>
                ))}
              </View>
            </View>
          </Presence>
          <FeedbackSlot place="play" collapse={skin.spacing.section} />
        </ScrollView>
      </Screen>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    doneContent: {
      flexGrow: 1,
      gap: s.spacing.section,
      justifyContent: "center",
    },
    doneText: { gap: s.spacing.small },
    flex: { flex: 1 },
    doneHead: {
      alignItems: "center",
      flexDirection: "row",
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-end",
      minHeight: Math.round(s.type.display.md * 1.38),
    },
    allSorted: { flex: 1, justifyContent: "center" },
    kept: { gap: s.spacing.small },
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.stripe,
    },
  });

export default Recap;
