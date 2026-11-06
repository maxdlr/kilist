import FormInput from "@/components/elements/FormInput";
import FoodPanels from "@/components/views/FoodList/_components/FoodPanels";
import useFoodShelf from "@/hooks/screens/useFoodShelf";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Svg, { Path } from "react-native-svg";
import { calmPalette as C } from "..";
import { CButton, CText, Dot, Screen } from "./parts";
import { CalmLoading } from "./States";

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
    <Pressable
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
    </Pressable>
  );
};

const CalmFoods = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const shelf = useFoodShelf();
  const { foods, query, isEmpty, noResults, isSelectMode, selectedIds } = shelf;

  if (shelf.isLoading) return <CalmLoading />;

  const half = (label: string, onPress: () => void, variant: "primary" | "secondary" | "danger" = "primary") => (
    <CButton key={label} flex={1} label={label} variant={variant} onPress={onPress} />
  );
  const actions = isSelectMode
    ? [half(skin.copy.common.cancel, shelf.exitSelectMode, "secondary"), half(skin.copy.list.deleteSelected(selectedIds.length), shelf.removeSelected, "danger")]
    : noResults
      ? [half("Clear", () => shelf.setSearch(""), "secondary"), half(`Add “${query}”`, () => shelf.openAdd(shelf.search.trim()))]
      : isEmpty
        ? [half(skin.copy.list.addOwn, () => shelf.openAdd(), "secondary"), half(skin.copy.list.addSuggested, () => router.push("/onboarding"))]
        : [half(skin.copy.list.select, shelf.startSelect, "secondary"), half(skin.copy.list.add, () => shelf.openAdd())];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="height">
      <Screen
        padded={false}
        dock={
          <>
            {!isEmpty && !isSelectMode && (
              <FormInput
                accessibilityLabel={skin.copy.list.search}
                placeholder={skin.copy.list.search}
                value={shelf.search}
                onChangeText={shelf.setSearch}
              />
            )}
            <View style={styles.actions}>{actions}</View>
          </>
        }
      >
        <View style={styles.titleRow}>
          <CText weight="medium" size={skin.type.headline} accessibilityRole="header">{skin.copy.list.title}</CText>
          <CText size={skin.type.label} color={C.soft}>{`${foods?.length ?? 0}`}</CText>
        </View>

        {noResults ? (
          <View style={styles.message}>
            <CText weight="medium" size={skin.type.title}>{skin.copy.list.noResults(query)}</CText>
            <CText size={skin.type.body} color={C.soft}>Add it and Kilist will start keeping track of it.</CText>
          </View>
        ) : isEmpty ? (
          <View style={styles.message}>
            <CText weight="medium" size={skin.type.title}>{skin.copy.list.emptyTitle}</CText>
            <CText size={skin.type.body} color={C.soft}>Add the foods you usually buy, and Kilist keeps the list for you.</CText>
          </View>
        ) : (
          <FlatList
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

export default CalmFoods;
