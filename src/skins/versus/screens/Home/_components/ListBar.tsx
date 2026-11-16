import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { levelOf, THRESHOLDS } from "@/utils/scoreUtils";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { VText } from "@/skins/versus/components";

const ListBar = ({ counts }: { counts: number[] }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const labels = THRESHOLDS.map((threshold) => skin.copy.levels[levelOf(threshold)]);
  const fills = THRESHOLDS.map((threshold) => skin.colors.levels[levelOf(threshold)]);

  return (
    <>
      <View
        accessible
        accessibilityLabel={labels.map((label, index) => `${label} ${counts[index] ?? 0}`).join(", ")}
        style={styles.levelBar}
      >
        {counts.map((count, index) =>
          count > 0 ? <View key={index} style={{ flex: count, backgroundColor: fills[index] }} /> : null,
        )}
      </View>
      <View style={styles.legend}>
        {counts.map((count, index) =>
          count > 0 ? (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: fills[index] }]} />
              <VText size={skin.type.caption - 1} color={P.soft}>{`${labels[index]} ${count}`}</VText>
            </View>
          ) : null,
        )}
      </View>
    </>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    levelBar: { borderRadius: 7, flexDirection: "row", gap: 2, height: 14, overflow: "hidden" },
    legend: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.tight + 2 },
    legendItem: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight + 2, marginRight: s.spacing.tight },
    swatch: { borderRadius: 3, height: 10, width: 10 },
  });

export default ListBar;
