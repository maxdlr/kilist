import Dock from "@/components/elements/Dock/Dock";
import FoodIcon from "@/components/elements/FoodIcon";
import KilButton from "@/components/elements/KilButton";
import SwipeDeck, {
  deckButtonColors,
  SwipeDeckFling,
  SwipeDirection,
} from "@/components/elements/SwipeDeck/SwipeDeck";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import type { DailySuggestion } from "@/hooks/screens/useDailySuggestion";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import type { Skin } from "@/skins/types";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SuggestionStep = ({ suggestion }: { suggestion: DailySuggestion }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const T = common.suggestion;
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const [intent, setIntent] = useState<SwipeDirection | null>(null);
  useStatusBarStyle(skin.statusBarOnGround);

  const item = suggestion.item;
  if (!item) return null;

  return (
    <View style={[styles.flex, { backgroundColor: skin.colors.ground }]}>
      <SwipeDeck
        items={[item]}
        keyOf={(entry) => entry.name}
        stamps={{ right: T.stampAdd, left: T.stampSkip }}
        flingRef={flingRef}
        onIntent={setIntent}
        onSwipe={(_entry, direction) => suggestion.answer(direction === "right")}
        renderSheet={(entry) => (
          <View style={[styles.sheet, { paddingTop: insets.top + skin.spacing.top }]}>
            <ThemedText size={skin.type.label} color={skin.colors.muted}>
              {T.label}
            </ThemedText>
            <Title size={skin.type.display.sm} lines={2} color={skin.colors.onGround}>
              {caseFor(skin, T.title)}
            </Title>
            <View style={styles.card}>
              <View style={styles.tag}>
                <ThemedText size={skin.type.caption} color={skin.actions.primary.ink}>
                  {caseFor(skin, T.tag)}
                </ThemedText>
              </View>
              <FoodIcon name={entry.icon} size={skin.size.icon.card} />
              <ThemedText size={skin.type.title} color={skin.colors.onPaper} style={styles.center}>
                {caseFor(skin, entry.name)}
              </ThemedText>
              <ThemedText size={skin.type.label} color={skin.colors.placeholder}>
                {T.line}
              </ThemedText>
            </View>
          </View>
        )}
      />
      <Dock>
        <ThemedText size={skin.type.label} color={skin.colors.muted} style={styles.center}>
          {T.hint}
        </ThemedText>
        <View style={styles.buttons}>
          <KilButton
            flex={1}
            height={skin.size.button.lg}
            label={T.skip}
            colors={deckButtonColors(skin, intent, "left", true)}
            onTouch={() => flingRef.current?.("left")}
          />
          <KilButton
            flex={1}
            height={skin.size.button.lg}
            label={T.add}
            colors={deckButtonColors(skin, intent, "right")}
            onTouch={() => flingRef.current?.("right")}
          />
        </View>
      </Dock>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1 },
    sheet: {
      backgroundColor: s.colors.ground,
      flex: 1,
      gap: s.spacing.small,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    card: {
      alignItems: "center",
      backgroundColor: s.colors.paper,
      borderColor: s.colors.placeholder,
      borderRadius: s.panel.radius,
      borderStyle: "dashed",
      borderWidth: Math.max(1, s.shape.border),
      flex: 1,
      gap: s.spacing.inline,
      justifyContent: "center",
      marginTop: s.spacing.stack,
      padding: s.spacing.gutter,
    },
    tag: {
      backgroundColor: s.actions.primary.fill,
      borderRadius: s.shape.radius / 2,
      left: s.spacing.stack,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.tight,
      position: "absolute",
      top: s.spacing.stack,
    },
    buttons: { flexDirection: "row", gap: s.spacing.inline },
    center: { textAlign: "center" },
  });

export default SuggestionStep;
