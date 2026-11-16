import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components/CText";

export const StockBars = ({
  rows,
  total: outOf,
}: {
  rows: { label: string; count: number; color: string; icon?: ReactNode }[];
  total?: number;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const total = outOf ?? rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <View style={styles.bars}>
      {rows
        .filter(({ count }) => !!count)
        .map((row) => (
          <View
            key={row.label}
            accessible
            accessibilityLabel={`${row.label}, ${row.count}`}
            style={styles.barRow}
          >
            <View style={styles.barLabel}>{row.icon}</View>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: row.color,
                    width: `${total ? Math.round((row.count / total) * 100) : 0}%`,
                  },
                ]}
              />
            </View>

            <CText size={skin.type.label + 1} color={C.textSoft}>
              {String(row.count)}
            </CText>
          </View>
        ))}
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    bars: { gap: s.spacing.inline },
    barRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    barLabel: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    barTrack: { flex: 1, backgroundColor: C.line, borderRadius: 3, height: 6, overflow: "hidden" },
    barFill: { borderRadius: 3, height: 6 },
  });
