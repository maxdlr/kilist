import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { VText } from "@/skins/versus/components";

const Stat = ({ value, label }: { value: string; label: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={styles.stat}>
      <VText face="bold" size={skin.type.body}>{value}</VText>
      <VText size={skin.type.caption - 1} color={P.muted}>{label}</VText>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    stat: { backgroundColor: P.panelHigh, borderRadius: s.spacing.inline + 2, flex: 1, gap: s.spacing.hair, padding: s.spacing.small },
  });

export default Stat;
