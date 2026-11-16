import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { VText } from "@/skins/versus/components";

const Lane = ({ label, color, progress, ghost = false }: { label: string; color: string; progress: number; ghost?: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={styles.lane}>
      <VText face="bold" size={skin.type.caption} color={color} style={styles.laneLabel} numberOfLines={1}>
        {label}
      </VText>
      <View style={[styles.track, ghost && { backgroundColor: "transparent", borderColor: color, borderStyle: "dashed", borderWidth: skin.shape.border }]}>
        <View style={[styles.trackFill, { backgroundColor: color, opacity: ghost ? 0.4 : 1, width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    lane: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    laneLabel: { width: 52 },
    track: { backgroundColor: P.panelHigh, borderRadius: 6, flex: 1, height: 12, overflow: "hidden" },
    trackFill: { borderRadius: 6, height: "100%" },
  });

export default Lane;
