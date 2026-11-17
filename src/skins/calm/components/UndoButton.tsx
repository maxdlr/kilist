import Press from "@/components/elements/Press";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import withPressed from "@/utils/withPressed";
import { StyleSheet } from "react-native";
import { UndoIcon } from "@/components/icons";
import T from "../text";
import { useCalmColors } from "../theme/useCalmColors";

export const UndoButton = ({ enabled, onPress }: { enabled: boolean; onPress: () => void }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);

  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={T.play.undo}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      hitSlop={skin.spacing.small}
      onPress={onPress}
      style={withPressed([styles.close, !enabled && { opacity: C.gameHeader.undoDisabledOpacity }])}
    >
      <UndoIcon size={skin.size.icon.action} color={C.gameHeader.icon} strokeWidth={C.gameHeader.iconStroke} />
    </Press>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    close: { justifyContent: "center", minHeight: s.size.button.xs },
  });

