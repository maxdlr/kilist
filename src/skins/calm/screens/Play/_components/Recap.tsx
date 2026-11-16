import { SwipeGame } from "@/hooks/screens/useSwipeGame";
import { DrawnMark } from "@/providers/MarkProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { PlayIcon, RefreshIcon } from "@/components/icons";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, Dot, GlassScrollView, Screen } from "@/skins/calm/components";

const Recap = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const recap = game.recap;
  const added = recap?.added ?? [];

  return (
    <Screen
      glass
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
          <CButton
            label={skin.copy.swipe.playAgain}
            onPress={game.playAgain}
            icon={(color) => (
              <PlayIcon
                size={skin.size.icon.action}
                color={color}
                strokeWidth={1.8}
              />
            )}
          />
        </>
      }
    >
      <GlassScrollView contentContainerStyle={styles.doneContent}>
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
              {added.length ? T.play.added(added.length) : T.play.nothingNew}
            </CText>
          ) : (
            <CText size={skin.type.body} color={C.textSoft}>
              {T.play.today}
            </CText>
          )}
        </View>
        {added.length > 0 && (
          <View>
            {added.map((food) => (
              <View key={food.id} style={styles.row}>
                <Dot color={skin.colors.levels[1]} />
                <CText size={skin.type.body}>{food.name}</CText>
              </View>
            ))}
          </View>
        )}
      </GlassScrollView>
    </Screen>
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
    doneHead: { flexDirection: "row" },
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
