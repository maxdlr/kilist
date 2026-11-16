import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";

const Group = ({ label, children }: { label: string; children: ReactNode }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  return (
    <View>
      <CText size={skin.type.label} color={C.textSoft} style={styles.groupLabel}>{label}</CText>
      {children}
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    groupLabel: { paddingBottom: s.spacing.small },
  });

export default Group;
