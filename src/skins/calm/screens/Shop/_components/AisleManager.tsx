import ActionPanel from "@/components/elements/ActionPanel";
import BottomPanel, { PanelScrollView } from "@/components/elements/BottomPanel";
import FormInput from "@/components/elements/FormInput";
import Press from "@/components/elements/Press";
import Suggestions from "@/components/elements/Suggestions";
import { CheckIcon, NavArrowDownIcon, XmarkIcon } from "@/components/icons";
import type { AisleManager as Manager } from "@/hooks/screens/useAisleManager";
import { getLang } from "@/i18n";
import { aisleList, aisleName, suggestAisles } from "@/offline/foodNames";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import withPressed from "@/utils/withPressed";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText } from "@/skins/calm/components";

const MAX_SUGGESTIONS = 8;
const LIST_SHARE = 0.45;

const MOVE = LinearTransition.duration(AnimationService.enter.duration).easing(AnimationService.easeOut);
const SHOW = FadeIn.duration(AnimationService.enter.duration).easing(AnimationService.easeOut);
const HIDE = FadeOut.duration(AnimationService.exit.duration).easing(AnimationService.easeOut);

const Chevron = ({ open }: { open: boolean }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const turn = useSharedValue(open ? 1 : 0);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));

  useEffect(() => {
    turn.set(withTiming(open ? 1 : 0, { duration: AnimationService.enter.duration, easing: AnimationService.easeOut }));
  }, [open, turn]);

  return (
    <Animated.View style={style}>
      <NavArrowDownIcon size={skin.size.icon.action} color={C.textSoft} strokeWidth={1.6} />
    </Animated.View>
  );
};

const AisleRow = ({
  food,
  picked,
  open,
  onToggle,
  onPick,
}: {
  food: FoodType;
  picked?: string;
  open: boolean;
  onToggle: () => void;
  onPick: (aisle: string) => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const lang = getLang();
  const [query, setQuery] = useState("");
  const typing = query.trim().length > 0;
  const aisle = picked ? aisleList().find((entry) => entry.id === picked) : undefined;
  const pickedName = aisle ? aisleName(aisle, lang) : undefined;
  const matches = open && typing ? suggestAisles(query, lang, MAX_SUGGESTIONS) : [];

  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setQuery("");
  }

  return (
    <Animated.View layout={MOVE} style={styles.row}>
      <Press
        accessibilityRole="button"
        accessibilityLabel={pickedName ? T.shop.aislePicked(food.name, pickedName) : T.shop.aisleOpen(food.name)}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={withPressed([styles.head, aisle && !open && styles.headDone])}
      >
        <CText size={skin.type.lead} numberOfLines={1} style={styles.name}>
          {food.name}
        </CText>
        {aisle && <CheckIcon size={skin.size.icon.action - 4} color={C.positive} strokeWidth={2} />}
        <View style={styles.flex} />
        {pickedName && !open && (
          <CText size={skin.type.label} color={C.textSoft} numberOfLines={1} style={styles.aisle}>
            {pickedName}
          </CText>
        )}
        <Chevron open={open} />
      </Press>
      {open && (
        <Animated.View entering={SHOW} exiting={HIDE} layout={MOVE} style={styles.body}>
          <View style={styles.searchRow}>
            <View style={styles.flex}>
              <FormInput
                autoFocus
                placeholder={T.shop.aisleSearch}
                value={query}
                onChangeText={setQuery}
                returnKeyType="search"
              />
            </View>
            {query.length > 0 && (
              <Animated.View entering={SHOW} exiting={HIDE}>
                <CButton
                  variant="secondary"
                  accessibilityLabel={T.shop.aisleClear}
                  onPress={() => setQuery("")}
                  icon={(color) => <XmarkIcon size={skin.size.icon.action} color={color} strokeWidth={1.8} />}
                />
              </Animated.View>
            )}
          </View>
          {typing && (
            <Animated.View entering={SHOW} exiting={HIDE} layout={MOVE}>
              {matches.length > 0 ? (
                <Suggestions
                  query={query}
                  items={matches.map((entry) => ({ key: entry.id, label: aisleName(entry, lang) }))}
                  onPick={onPick}
                />
              ) : (
                <CText size={skin.type.label} color={C.textSoft}>
                  {T.shop.aisleNoMatch}
                </CText>
              )}
            </Animated.View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const AisleManager = ({ manager }: { manager: Manager }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <>
      <BottomPanel visible={manager.visible} onClose={manager.requestClose} dismissible>
        <CText weight="medium" size={skin.type.headline} accessibilityRole="header">
          {T.shop.aislesTitle}
        </CText>
        <PanelScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {manager.items.map((food) => (
            <AisleRow
              key={food.id}
              food={food}
              picked={manager.picks[food.id]}
              open={manager.openId === food.id}
              onToggle={() => manager.toggle(food.id)}
              onPick={(aisle) => manager.pick(food.id, aisle)}
            />
          ))}
        </PanelScrollView>
        <View style={styles.dock}>
          <CButton label={T.shop.aislesDone} onPress={manager.done} />
        </View>
      </BottomPanel>
      <ActionPanel request={manager.confirmRequest} onClose={manager.keepEditing} />
    </>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    list: { flexGrow: 0, maxHeight: Dimensions.get("window").height * LIST_SHARE },
    row: {
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      overflow: "hidden",
    },
    head: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
      minHeight: s.size.row.shop,
    },
    headDone: { minHeight: s.size.row.stripe - s.spacing.small },
    name: { flexShrink: 1 },
    aisle: { flexShrink: 1, textAlign: "right" },
    body: { gap: s.spacing.small, paddingBottom: s.spacing.inline },
    searchRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    dock: { flexDirection: "row" },
  });

export default AisleManager;
