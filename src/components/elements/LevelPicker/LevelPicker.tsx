import Press from "@/components/elements/Press";
import { ThemedText } from "@/components/elements/ThemedText";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { LevelNumber, Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";

export const LEVEL_NUMBERS: LevelNumber[] = [1, 3, 5];

const LevelPicker = ({
  value,
  onChange,
  label,
}: {
  value: LevelNumber;
  onChange: (level: LevelNumber) => void;
  label?: string;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <View style={styles.wrap}>
      {label && (
        <ThemedText size={skin.type.label} color={skin.panel.ink}>
          {label}
        </ThemedText>
      )}
      <View accessibilityRole="radiogroup" style={styles.row}>
        {LEVEL_NUMBERS.map((level) => {
          const selected = level === value;
          const color = skin.colors.levels[level];
          return (
            <Press
              key={level}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={skin.copy.levels[level]}
              onPress={() => onChange(level)}
              style={({ pressed }) => [
                styles.option,
                {
                  // backgroundColor: selected ? color : "transparent",
                  borderColor: selected ? color : skin.panel.line,
                  opacity: pressed ? skin.shape.pressedOpacity : 1,
                },
              ]}
            >
              {!selected && (
                <View style={[styles.dot, { backgroundColor: color }]} />
              )}
              <ThemedText
                size={skin.type.caption}
                color={selected ? skin.colors.onLevel : skin.panel.ink}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                style={styles.text}
              >
                {skin.copy.levels[level]}
              </ThemedText>
            </Press>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    wrap: { gap: s.spacing.tight },
    row: { flexDirection: "row", gap: s.spacing.tight },
    option: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flex: 1,
      gap: s.spacing.tight,
      justifyContent: "center",
      minHeight: s.size.button.md,
      paddingHorizontal: s.spacing.hair,
      paddingVertical: s.spacing.tight,
    },
    dot: {
      borderRadius: s.spacing.small,
      height: s.spacing.small,
      width: s.spacing.small,
    },
    text: { textAlign: "center" },
  });

export default LevelPicker;
