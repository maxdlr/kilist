import { PanelScrollView } from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import KilToggleButton from "@/components/elements/KilToggleButton";
import Press from "@/components/elements/Press";
import { ThemedText } from "@/components/elements/ThemedText";
import Title from "@/components/elements/Title";
import { PlusIcon, XmarkIcon } from "@/components/icons";
import common from "@/i18n/common";
import type { SummaryPart } from "@/offline/summary";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import AnimationService from "@/services/animation";
import withPressed from "@/utils/withPressed";
import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, LayoutAnimationConfig, LinearTransition } from "react-native-reanimated";
import FoodAisle from "./FoodAisle";
import FoodSummary from "./FoodSummary";

export type FoodDetailValues = {
  frequencyDays: number | null;
  quantity: string | null;
  note: string | null;
};

export type DetailKey = keyof FoodDetailValues;

const ORDER: DetailKey[] = ["frequencyDays", "quantity", "note"];
const FREQUENCIES = ["7", "14", "30"] as const;
const MOVE = LinearTransition.duration(AnimationService.enter.duration).easing(AnimationService.easeOut);
const SHOW = FadeIn.duration(AnimationService.enter.duration).easing(AnimationService.easeOut);

const copyOf = (key: DetailKey) => (key === "frequencyDays" ? common.details.frequency : common.details[key]);

const isSet = (values: FoodDetailValues, key: DetailKey) =>
  key === "frequencyDays" ? values.frequencyDays !== null : Boolean((values[key] ?? "").trim());

const FoodDetails = ({
  name,
  sentence,
  values,
  added,
  focusKey,
  quiet,
  onAdd,
  onRemove,
  onFrequency,
  onText,
  aisle,
}: {
  aisle?: { value: string | null; onPick: (aisle: string) => void };
  name: string;
  sentence: SummaryPart[] | null;
  values: FoodDetailValues;
  added: DetailKey[];
  focusKey?: DetailKey;
  quiet: boolean;
  onAdd: (key: DetailKey) => void;
  onRemove: (key: DetailKey) => void;
  onFrequency: (days: number | null) => void;
  onText: (key: "quantity" | "note", text: string) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const shown = ORDER.filter((key) => isSet(values, key) || added.includes(key));
  const [order] = useState(() => [...shown, ...ORDER.filter((key) => !shown.includes(key))]);
  const T = common.details;
  const bold = { fontFamily: skin.fonts.body?.bold ?? skin.fonts.display.family };

  const body = (key: DetailKey): ReactNode => {
    if (key === "frequencyDays") {
      return (
        <>
          <KilToggleButton
            value={values.frequencyDays === null ? "" : String(values.frequencyDays)}
            onChange={(option) => onFrequency(Number(option))}
            onDark={skin.panel.ink === skin.colors.onGround}
            options={FREQUENCIES.map((option) => ({ label: T.frequency.options[option], value: option }))}
          />
          <ThemedText size={skin.type.caption} color={skin.panel.ink}>
            {T.frequency.help}
          </ThemedText>
        </>
      );
    }
    return (
      <FormInput
        accessibilityLabel={copyOf(key).title}
        placeholder={T[key].placeholder}
        value={values[key] ?? ""}
        onChangeText={(text) => onText(key, text)}
        autoFocus={key === focusKey}
        maxLength={key === "note" ? 300 : 40}
      />
    );
  };

  return (
    <PanelScrollView
      style={styles.scroll}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
    <LayoutAnimationConfig skipEntering>
      <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
        {name}
      </Title>
      {sentence ? (
        <FoodSummary parts={sentence} />
      ) : (
        <ThemedText size={skin.type.label} color={skin.panel.ink}>
          {T.intro}
        </ThemedText>
      )}

      {aisle && <FoodAisle name={name} value={aisle.value} onPick={aisle.onPick} />}

      {order.map((key) => (
        <Animated.View key={key} layout={MOVE} style={styles.slot}>
          {shown.includes(key) ? (
            <Animated.View key="open" entering={SHOW} style={[styles.module, { borderColor: skin.panel.line }]}>
              <View style={styles.moduleHead}>
                <ThemedText size={skin.type.label} color={skin.panel.title} style={bold}>
                  {copyOf(key).title}
                </ThemedText>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={T.remove(copyOf(key).title)}
                  hitSlop={skin.spacing.small}
                  onPress={() => onRemove(key)}
                  style={withPressed(styles.remove)}
                >
                  <XmarkIcon size={skin.size.icon.action - 4} color={skin.panel.ink} strokeWidth={2} />
                </Press>
              </View>
              {body(key)}
            </Animated.View>
          ) : (
            <Animated.View key="closed" entering={SHOW}>
              <Press
                accessibilityRole="button"
                onPress={() => onAdd(key)}
                style={withPressed([styles.add, { borderColor: skin.colors.fieldLine ?? skin.panel.line }])}
              >
                <View style={[styles.plus, { borderColor: skin.colors.fieldLine ?? skin.panel.line }]}>
                  <PlusIcon size={skin.size.icon.action - 4} color={skin.panel.ink} strokeWidth={2} />
                </View>
                <View style={styles.addText}>
                  <ThemedText size={skin.type.body} color={skin.panel.title} style={bold}>
                    {copyOf(key).title}
                  </ThemedText>
                  <ThemedText size={skin.type.caption} color={skin.panel.ink}>
                    {copyOf(key).hint}
                  </ThemedText>
                </View>
              </Press>
            </Animated.View>
          )}
        </Animated.View>
      ))}

      <Animated.View layout={MOVE}>
        <ThemedText size={skin.type.caption} color={skin.panel.ink} style={styles.footer}>
          {quiet ? T.savedAsYouGo : T.savedWithItem}
        </ThemedText>
      </Animated.View>
    </LayoutAnimationConfig>
    </PanelScrollView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    scroll: { flexShrink: 1, minHeight: 0 },
    body: { gap: s.spacing.stack },
    slot: { overflow: "hidden" },
    module: {
      borderRadius: s.shape.radius + 6,
      borderWidth: s.shape.border,
      gap: s.spacing.small,
      padding: s.spacing.inline,
    },
    moduleHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
    remove: { alignItems: "center", height: 32, justifyContent: "center", width: 32 },
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
    footer: { opacity: 0.7, textAlign: "center" },
  });

export default FoodDetails;
