import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import T from "@/skins/calm/text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { NavArrowLeftIcon, XmarkIcon } from "@/components/icons";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { StepNav } from "./shared";

const TopBar = ({ onBack, onExit, children }: StepNav & { children?: ReactNode }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const icon = (Icon: typeof XmarkIcon) => (
    <Icon size={skin.size.icon.action} color={C.textSoft} strokeWidth={1.8} />
  );

  return (
    <View style={styles.topBar}>
      {onBack && (
        <Press
          accessibilityRole="button"
          accessibilityLabel={T.tutorial.questionBack}
          hitSlop={skin.spacing.small}
          onPress={onBack}
          style={withPressed(styles.topIcon)}
        >
          {icon(NavArrowLeftIcon)}
        </Press>
      )}
      <View style={styles.topMiddle}>{children}</View>
      {onExit && (
        <Press
          accessibilityRole="button"
          accessibilityLabel={T.close}
          hitSlop={skin.spacing.small}
          onPress={onExit}
          style={withPressed(styles.topIcon)}
        >
          {icon(XmarkIcon)}
        </Press>
      )}
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    topBar: { alignItems: "center", flexDirection: "row", gap: s.spacing.stack, minHeight: s.size.button.xs },
    topMiddle: { alignItems: "center", flex: 1, flexDirection: "row", gap: s.spacing.stack },
    topIcon: { justifyContent: "center", minHeight: s.size.button.xs },
  });

export default TopBar;
