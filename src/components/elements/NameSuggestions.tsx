import Press from "@/components/elements/Press";
import { ThemedText } from "@/components/themed-text";
import { getLang } from "@/i18n";
import { suggestNames } from "@/offline/foodNames";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import withPressed from "@/utils/withPressed";
import { ScrollView, StyleSheet } from "react-native";

const MAX_SUGGESTIONS = 8;

const NameSuggestions = ({ query, onPick }: { query: string; onPick: (name: string) => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const names = suggestNames(query, getLang(), MAX_SUGGESTIONS);

  if (names.length === 0) return null;

  return (
    <ScrollView
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {names.map((name) => (
        <Press
          key={name}
          accessibilityRole="button"
          accessibilityLabel={name}
          onPress={() => onPick(name)}
          style={withPressed([styles.chip, { borderColor: skin.panel.ink }])}
        >
          <ThemedText size={skin.type.label} color={skin.panel.ink} numberOfLines={1}>
            {name}
          </ThemedText>
        </Press>
      ))}
    </ScrollView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    scroll: { flexGrow: 0 },
    row: { gap: s.spacing.small },
    chip: {
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      justifyContent: "center",
      minHeight: s.size.button.xs,
      paddingHorizontal: s.spacing.inline,
    },
  });

export default NameSuggestions;
