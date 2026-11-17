import Press from "@/components/elements/Press";
import { ThemedText } from "@/components/elements/ThemedText";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import withPressed from "@/utils/withPressed";
import { type ComponentRef, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export type SuggestionItem = { key: string; label: string };

const Suggestions = ({
  items,
  query,
  onPick,
}: {
  items: SuggestionItem[];
  query: string;
  onPick: (key: string) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    scroll.current?.scrollTo({ x: 0, animated: false });
  }, [query]);

  if (items.length === 0) return null;

  return (
    <ScrollView
      ref={scroll}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => (
        <Press
          key={item.key}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={() => onPick(item.key)}
          style={withPressed([styles.chip, { borderColor: skin.panel.ink }])}
        >
          <ThemedText size={skin.type.label} color={skin.panel.ink} numberOfLines={1}>
            {item.label}
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
      borderRadius: s.shape.pill ? s.size.button.xs / 2 : s.shape.radius,
      borderWidth: s.shape.border,
      justifyContent: "center",
      minHeight: s.size.button.xs,
      paddingHorizontal: s.spacing.inline,
    },
  });

export default Suggestions;
