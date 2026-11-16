import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import V from "@/skins/versus/text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { VText } from "@/skins/versus/components";

const PeriodToggle = ({ period, onPick }: { period: "week" | "season"; onPick: (value: "week" | "season") => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View accessibilityRole="radiogroup" style={styles.toggle}>
      {(["week", "season"] as const).map((value) => {
        const on = value === period;
        return (
          <Press
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onPick(value)}
            style={withPressed([styles.toggleItem, on && { backgroundColor: P.white }])}
          >
            <VText face="bold" size={skin.type.caption} color={on ? P.ink : P.soft}>
              {value === "week" ? V.home.week : V.home.season}
            </VText>
          </Press>
        );
      })}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    toggle: { backgroundColor: P.panel, borderRadius: s.spacing.inline + 2, flexDirection: "row", padding: 3 },
    toggleItem: { borderRadius: s.spacing.inline, justifyContent: "center", minHeight: 34, paddingHorizontal: s.spacing.inline + 2 },
  });

export default PeriodToggle;
