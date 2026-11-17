import AnimationService from "@/services/animation";
import Animated, { LinearTransition } from "react-native-reanimated";
import T from "@/skins/calm/text";
import FormInput from "@/components/elements/FormInput";
import FoodPanels from "@/components/features/Inventory/FoodPanels";
import useInventoryShelf from "@/hooks/screens/useInventoryShelf";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PlusIcon, SearchIcon, TrashIcon, XmarkIcon } from "@/components/icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, DockSpacer, Screen } from "@/skins/calm/components";
import { CalmLoading } from "../States";
import FoodRow from "./_components/FoodRow";

const ROW_REFLOW = LinearTransition.duration(AnimationService.reflow);

const CalmInventory = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const shelf = useInventoryShelf();
  const { foods, query, isEmpty, noResults, isDeleteMode, deleteIds } = shelf;
  const [searching, setSearching] = useState(false);
  if (shelf.isLoading) return <CalmLoading />;

  const canSearch = !isEmpty && !isDeleteMode;
  const searchOpen = canSearch && (searching || shelf.search !== "");
  const toggleSearch = () => {
    if (searchOpen) {
      shelf.setSearch("");
      setSearching(false);
    } else {
      setSearching(true);
    }
  };
  const iconButton = (label: string, Icon: typeof XmarkIcon, onPress: () => void) => (
    <CButton
      key={label}
      variant="secondary"
      accessibilityLabel={label}
      onPress={onPress}
      icon={(color) => <Icon size={skin.size.icon.action} color={color} strokeWidth={1.8} />}
    />
  );

  const half = (label: string, onPress: () => void, variant: "primary" | "secondary" | "danger" = "primary") => (
    <CButton key={label} label={label} variant={variant} onPress={onPress} />
  );
  const actions = isDeleteMode
    ? [
        half(skin.copy.common.cancel, shelf.exitDeleteMode, "secondary"),
        half(skin.copy.inventory.deleteCount(deleteIds.length), shelf.confirmDelete, "danger"),
      ]
    : isEmpty
      ? [half(skin.copy.inventory.addOwn, () => shelf.openAdd(), "secondary"), half(skin.copy.inventory.addSuggested, () => router.push("/onboarding"))]
      : [
          iconButton(skin.copy.inventory.delete, TrashIcon, shelf.startDelete),
          iconButton(skin.copy.inventory.add, PlusIcon, () => shelf.openAdd()),
          iconButton(skin.copy.inventory.search, SearchIcon, toggleSearch),
        ];

  const searchRow = (
    <View style={styles.searchRow}>
      <View style={styles.flex}>
        <FormInput
          autoFocus={searching}
          accessibilityLabel={skin.copy.inventory.search}
          placeholder={skin.copy.inventory.search}
          value={shelf.search}
          onChangeText={shelf.setSearch}
        />
      </View>
      {noResults
        ? iconButton(T.inventory.addQuery(query), PlusIcon, () => shelf.openAdd(shelf.search.trim()))
        : iconButton(skin.copy.inventory.delete, TrashIcon, shelf.startDelete)}
      {iconButton(T.inventory.closeSearch, XmarkIcon, toggleSearch)}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" automaticOffset>
      <Screen
        padded={false}
        glass
        dock={searchOpen ? searchRow : actions}
      >
        <View style={styles.titleRow}>
          <CText weight="medium" size={skin.type.headline} accessibilityRole="header">{skin.copy.inventory.title}</CText>
          <CText size={skin.type.label} color={C.textSoft}>{`${foods?.length ?? 0}`}</CText>
        </View>

        {noResults ? (
          <View style={styles.message}>
            <CText weight="medium" size={skin.type.title}>{skin.copy.inventory.noResults(query)}</CText>
            <CText size={skin.type.body} color={C.textSoft}>{T.inventory.noResultsLine}</CText>
          </View>
        ) : isEmpty ? (
          <View style={styles.message}>
            <CText weight="medium" size={skin.type.title}>{skin.copy.inventory.emptyTitle}</CText>
            <CText size={skin.type.body} color={C.textSoft}>{T.inventory.emptyLine}</CText>
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
            ListFooterComponent={DockSpacer}
            renderItem={({ item }) => (
              <FoodRow
                food={item}
                deleting={isDeleteMode}
                selected={deleteIds.includes(item.id)}
                onPress={() => (isDeleteMode ? shelf.toggleDelete(item.id) : shelf.openEdit(item))}
              />
            )}
          />
        )}
      </Screen>
      <FoodPanels shelf={shelf} />
    </KeyboardAvoidingView>
  );
};

export default CalmInventory;

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    titleRow: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: s.spacing.gutter },
    list: { paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    message: { flex: 1, gap: s.spacing.small, justifyContent: "center", paddingHorizontal: s.spacing.gutter },
    searchRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.small + 2, width: "100%" },
  });
