import T from "@/skins/calm/text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, Screen } from "@/skins/calm/components";
import { StepNav } from "./shared";
import TopBar from "./TopBar";

const Finished = ({ onStart, onBack, onExit }: StepNav & { onStart: () => void }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;

  return (
    <Screen
      dock={
        onExit ? undefined : (
          <>
            <CText
              size={skin.type.label + 1}
              color={C.textSoft}
              style={styles.center}
            >
              {copy.doneNote}
            </CText>
            <CButton label={copy.start} onPress={onStart} />
          </>
        )
      }
    >
      <TopBar onBack={onBack} onExit={onExit} />
      <View style={styles.head}>
        <CText size={skin.type.label} color={C.textSoft}>
          {copy.doneLabel}
        </CText>
        <CText
          weight="medium"
          size={skin.type.display.md}
          accessibilityRole="header"
        >
          {copy.doneTitle}
        </CText>
      </View>
      <View style={styles.recap}>
        {copy.doneSteps.map((line, index) => (
          <View
            key={line}
            style={[styles.recapRow, index > 0 && styles.recapDivider]}
          >
            <View style={styles.number}>
              <CText weight="bold" size={skin.type.label} color={C.onFill}>
                {String(index + 1)}
              </CText>
            </View>
            <CText size={skin.type.body} style={styles.flex}>
              {line}
            </CText>
          </View>
        ))}
      </View>
    </Screen>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    center: { textAlign: "center" },
    head: { gap: s.spacing.small },
    recap: {},
    recapRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline + 2,
      paddingVertical: s.spacing.stack,
    },
    recapDivider: { borderTopColor: C.line, borderTopWidth: s.shape.divider },
    number: {
      alignItems: "center",
      backgroundColor: C.fill,
      borderRadius: s.spacing.inline + 2,
      height: (s.spacing.inline + 2) * 2,
      justifyContent: "center",
      width: (s.spacing.inline + 2) * 2,
    },
  });

export default Finished;
