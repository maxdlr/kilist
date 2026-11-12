import AnimationService from "@/services/animation";
import Animated, { LinearTransition } from "react-native-reanimated";
import Press from "@/components/elements/Press";
import T from "../text";
import FormInput from "@/components/elements/FormInput";
import FoodPanels from "@/components/views/Inventory/_components/FoodPanels";
import useInventoryShelf from "@/hooks/screens/useInventoryShelf";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Svg, { Path } from "react-native-svg";
import { calmPalette as C } from "..";
import { CButton, CText, Dot, Screen } from "./parts";
import { CalmLoading } from "./States";

const ROW_REFLOW = LinearTransition.duration(AnimationService.reflow);

const FoodRow = ({
  food,
  selecting,
  selected,
  onPress,
}: {
  food: FoodType;
  selecting: boolean;
  selected: boolean;
  onPress: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);

  return (
    <Press
      accessibilityRole="button"
      accessibilityState={selecting ? { selected } : undefined}
      accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? skin.shape.pressedOpacity : 1 }]}
    >
      {selecting && (
        <View style={[styles.box, { backgroundColor: selected ? C.ink : "transparent", borderColor: selected ? C.ink : C.ring }]}>
          {selected && (
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12l4 4 10-10" stroke={C.ground} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      )}
      <CText size={skin.type.lead} style={styles.flex} numberOfLines={1}>{food.name}</CText>
      <CText size={skin.type.caption} color={C.soft}>{skin.copy.levels[level]}</CText>
      <Dot color={skin.colors.levels[level]} />
    </Press>
  );
};

const CalmInventory = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const shelf = useInventoryShelf();
  const { foods, query, isEmpty, noResults, isSelectMode, selectedIds } = shelf;
  if (shelf.isLoading) return <CalmLoading />;

  const half = (label: string, onPress: () => void, variant: "primary" | "secondary" | "danger" = "primary") => (
    <CButton key={label} flex={1} label={label} variant={variant} onPress={onPress} />
  );
  const actions = isSelectMode
    ? [
        half(skin.copy.common.cancel, shelf.exitSelectMode, "secondary"),
        ...(selectedIds.length === 1 ? [half(T.inventory.editOne, shelf.editSelected, "secondary")] : []),
        half(skin.copy.inventory.deleteSelected(selectedIds.length), shelf.removeSelected, "danger"),
      ]
    : noResults
      ? [half(T.inventory.clear, () => shelf.setSearch(""), "secondary"), half(T.inventory.addQuery(query), () => shelf.openAdd(shelf.search.trim()))]
      : isEmpty
        ? [half(skin.copy.inventory.addOwn, () => shelf.openAdd(), "secondary"), half(skin.copy.inventory.addSuggested, () => router.push("/onboarding"))]
        : [half(skin.copy.inventory.select, shelf.startSelect, "secondary"), half(skin.copy.inventory.add, () => shelf.openAdd())];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Screen
        padded={false}
        dock={
          <>
            {!isEmpty && !isSelectMode && (
              <FormInput
                accessibilityLabel={skin.copy.inventory.search}
                placeholder={skin.copy.inventory.search}
                value={shelf.search}
                onChangeText={shelf.setSearch}
              />
            )}
            <View style={styles.actions}>{actions}</View>
          </>
        }
      >
        <View style={styles.titleRow}>
          <CText weight="medium" size={skin.type.headline} accessibilityRole="header">{skin.copy.inventory.title}</CText>
          <CText size={skin.type.label} color={C.soft}>{`${foods?.length ?? 0}`}</CText>
        </View>

        {noResults ? (
          <View style={styles.message}>
            <CText weight="medium" size={skin.type.title}>{skin.copy.inventory.noResults(query)}</CText>
            <CText size={skin.type.body} color={C.soft}>{T.inventory.noResultsLine}</CText>
          </View>
        ) : isEmpty ? (
          <View style={styles.message}>
            <CText weight="medium" size={skin.type.title}>{skin.copy.inventory.emptyTitle}</CText>
            <CText size={skin.type.body} color={C.soft}>{T.inventory.emptyLine}</CText>
          </View>
        ) : (
          <Animated.FlatList
            itemLayoutAnimation={ROW_REFLOW}
            style={styles.flex}
            contentContainerStyle={styles.list}
            data={foods}
            keyExtractor={(food) => String(food.id)}
            onRefresh={shelf.mutateFood}
            refreshing={shelf.isFoodLoading}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <FoodRow
                food={item}
                selecting={isSelectMode}
                selected={selectedIds.includes(item.id)}
                onPress={() => (isSelectMode ? shelf.toggleSelect(item.id) : shelf.openEdit(item))}
              />
            )}
          />
        )}
      </Screen>
      <FoodPanels shelf={shelf} />
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    titleRow: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: s.spacing.gutter },
    list: { paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    row: {
      alignItems: "center",
      borderTopColor: C.hairline,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.list,
    },
    box: {
      alignItems: "center",
      borderRadius: s.spacing.tight + 2,
      borderWidth: 1.5,
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
    message: { flex: 1, gap: s.spacing.small, justifyContent: "center", paddingHorizontal: s.spacing.gutter },
    actions: { flexDirection: "row", gap: s.spacing.small + 2 },
  });

export default CalmInventory;
