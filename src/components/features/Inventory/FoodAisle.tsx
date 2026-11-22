import FormInput from "@/components/elements/FormInput";
import Press from "@/components/elements/Press";
import Suggestions from "@/components/elements/Suggestions";
import { ThemedText } from "@/components/elements/ThemedText";
import { PlusIcon } from "@/components/icons";
import { getLang } from "@/i18n";
import common from "@/i18n/common";
import { aisleList, aisleName, aisleOf, suggestAisles } from "@/offline/foodNames";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import withPressed from "@/utils/withPressed";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

const MAX_SUGGESTIONS = 8;
const MOVE = LinearTransition.duration(AnimationService.enter.duration).easing(AnimationService.easeOut);
const SHOW = FadeIn.duration(AnimationService.enter.duration).easing(AnimationService.easeOut);
const HIDE = FadeOut.duration(AnimationService.exit.duration).easing(AnimationService.easeOut);

const FoodAisle = ({
  name,
  value,
  onPick,
}: {
  name: string;
  value: string | null;
  onPick: (aisle: string) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const lang = getLang();
  const T = common.details.aisle;
  const current = value ?? aisleOf({ name, aisle: null });
  const entry = current ? aisleList().find((aisle) => aisle.id === current) : undefined;
  const label = entry ? aisleName(entry, lang) : null;
  const [query, setQuery] = useState(() => (!value && label ? label : ""));
  const [open, setOpen] = useState(Boolean(value));
  const line = !label ? null : value ? label : T.guessed(label);
  const typing = query.trim().length > 0;
  const matches = typing ? suggestAisles(query, lang, MAX_SUGGESTIONS) : [];
  const bold = { fontFamily: skin.fonts.body?.bold ?? skin.fonts.display.family };

  const pick = (aisle: string) => {
    setQuery("");
    onPick(aisle);
  };

  if (!open) {
    return (
      <Animated.View key="closed" layout={MOVE} entering={SHOW}>
        <Press
          accessibilityRole="button"
          accessibilityHint={label ? T.guessed(label) : T.hint}
          onPress={() => setOpen(true)}
          style={withPressed([styles.add, { borderColor: skin.colors.fieldLine ?? skin.panel.line }])}
        >
          <View style={[styles.plus, { borderColor: skin.colors.fieldLine ?? skin.panel.line }]}>
            <PlusIcon size={skin.size.icon.action - 4} color={skin.panel.ink} strokeWidth={2} />
          </View>
          <View style={styles.addText}>
            <ThemedText size={skin.type.body} color={skin.panel.title} style={bold}>
              {T.title}
            </ThemedText>
            <ThemedText size={skin.type.caption} color={skin.panel.ink}>
              {label ? T.guessed(label) : T.hint}
            </ThemedText>
          </View>
        </Press>
      </Animated.View>
    );
  }

  return (
    <Animated.View key="open" layout={MOVE} entering={SHOW} style={[styles.module, { borderColor: skin.panel.line }]}>
      <ThemedText size={skin.type.label} color={skin.panel.title} style={bold}>
        {T.title}
      </ThemedText>
      {line && (
        <Animated.View key={line} entering={SHOW}>
          <ThemedText size={skin.type.body} color={skin.panel.title} accessibilityLiveRegion="polite">
            {line}
          </ThemedText>
        </Animated.View>
      )}
      <FormInput
        autoFocus={!value}
        accessibilityLabel={T.search}
        placeholder={T.search}
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
      />
      {typing && (
        <Animated.View entering={SHOW} exiting={HIDE} layout={MOVE}>
          {matches.length > 0 ? (
            <Suggestions
              query={query}
              items={matches.map((aisle) => ({ key: aisle.id, label: aisleName(aisle, lang) }))}
              onPick={pick}
            />
          ) : (
            <ThemedText size={skin.type.caption} color={skin.panel.ink}>
              {T.noMatch}
            </ThemedText>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    module: {
      borderRadius: s.shape.radius + 6,
      borderWidth: s.shape.border,
      gap: s.spacing.small,
      padding: s.spacing.inline,
    },
    add: {
      alignItems: "center",
      borderRadius: s.shape.radius + 4,
      borderStyle: "dashed",
      borderWidth: 1.5,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: 56,
      paddingHorizontal: s.spacing.inline,
    },
    plus: {
      alignItems: "center",
      borderRadius: 15,
      borderWidth: s.shape.border,
      height: 30,
      justifyContent: "center",
      width: 30,
    },
    addText: { flex: 1, minWidth: 0 },
  });

export default FoodAisle;
