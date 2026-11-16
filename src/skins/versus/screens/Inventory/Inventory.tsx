import AnimationService from "@/services/animation";
import Animated, { LinearTransition } from "react-native-reanimated";
import V from "@/skins/versus/text";
import FormInput from "@/components/elements/FormInput";
import FoodPanels from "@/components/features/Inventory/FoodPanels";
import useInventoryShelf from "@/hooks/screens/useInventoryShelf";
import { useHouseVotes } from "@/skins/versus/hooks/api";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { ANSWER_FILL, Kicker, memberColor, Screen, VButton, VText, WORD } from "@/skins/versus/components";
import { VersusLoading } from "../States";
import { Vote } from "./_components/shared";
import FoodRow from "./_components/FoodRow";

const ROW_REFLOW = LinearTransition.duration(AnimationService.reflow);

const VersusInventory = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const shelf = useInventoryShelf();
  const { data: house, mutate: refreshVotes } = useHouseVotes();
  const { foods, query, isEmpty, noResults, isDeleteMode, deleteIds } = shelf;

  useFocusEffect(
    useCallback(() => {
      refreshVotes();
    }, [refreshVotes]),
  );

  if (shelf.isLoading) return <VersusLoading />;

  const members = house?.members ?? [];
  const colors = Object.fromEntries(members.map((member) => [member.id, memberColor(members, user?.id, member.id)]));
  const votesFor = (food: FoodType): Vote[] =>
    members.map((member) => ({
      userId: member.id,
      username: member.id === user?.id ? V.you : member.username,
      answer: house?.votes[food.id]?.[member.id]?.answer ?? null,
    }));

  const half = (label: string, onPress: () => void, variant: "primary" | "secondary" | "buy" = "primary") => (
    <VButton key={label} flex={1} label={label} variant={variant} onPress={onPress} />
  );
  const actions = isDeleteMode
    ? [half(skin.copy.common.cancel, shelf.exitDeleteMode, "secondary"), half(skin.copy.inventory.deleteCount(deleteIds.length), shelf.confirmDelete, "buy")]
    : noResults
      ? [half(V.inventory.clearSearch, () => shelf.setSearch(""), "secondary"), half(V.inventory.addQuery(query), () => shelf.openAdd(shelf.search.trim()))]
      : isEmpty
        ? [half(skin.copy.inventory.addOwn, () => shelf.openAdd(), "secondary"), half(V.inventory.suggested, () => router.push("/onboarding"))]
        : [half(skin.copy.inventory.delete, shelf.startDelete, "secondary"), half(skin.copy.inventory.add, () => shelf.openAdd())];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" automaticOffset>
      <Screen
        padded={false}
        dock={
          <>
            {!isEmpty && !isDeleteMode && (
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
        <View style={styles.header}>
          <View>
            <View style={styles.titleRow}>
              <View style={styles.flex}>
                <Kicker>{V.inventory.kicker}</Kicker>
              </View>
              <VText size={skin.type.label} color={P.muted}>{V.foodsCount(foods?.length ?? 0)}</VText>
            </View>
            <VText face="display" size={skin.type.headline} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {skin.copy.inventory.title}
            </VText>
          </View>
          {!isEmpty && !noResults && members.length > 1 && (
            <View style={styles.legend}>
              {(["out", "in"] as const).map((answer) => (
                <View key={answer} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: ANSWER_FILL[answer] }]} />
                  <VText size={skin.type.caption - 1} color={P.soft}>{WORD[answer]}</VText>
                </View>
              ))}
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: P.line }]} />
                <VText size={skin.type.caption - 1} color={P.soft}>{V.inventory.noVote}</VText>
              </View>
            </View>
          )}
        </View>

        {noResults ? (
          <View style={styles.message}>
            <VText face="display" size={skin.type.title}>{V.inventory.noResults(query)}</VText>
            <VText size={skin.type.body} color={P.soft}>{V.inventory.noResultsLine}</VText>
          </View>
        ) : isEmpty ? (
          <View style={styles.message}>
            <VText face="display" size={skin.type.title}>{skin.copy.inventory.emptyTitle}</VText>
            <VText size={skin.type.body} color={P.soft}>{V.inventory.emptyLine}</VText>
          </View>
        ) : (
          <Animated.FlatList
            itemLayoutAnimation={ROW_REFLOW}
            style={styles.flex}
            contentContainerStyle={styles.list}
            data={foods}
            keyExtractor={(food) => String(food.id)}
            onRefresh={() => {
              shelf.mutateFood();
              refreshVotes();
            }}
            refreshing={shelf.isFoodLoading}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <FoodRow
                food={item}
                votes={members.length > 1 ? votesFor(item) : []}
                colors={colors}
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

export default VersusInventory;

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    header: { gap: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
    titleRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    legend: { flexDirection: "row", gap: s.spacing.dock - 2 },
    legendItem: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight + 2 },
    legendDot: { borderRadius: 6, height: 12, width: 12 },
    list: { gap: s.spacing.small, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
    message: { flex: 1, gap: s.spacing.inline, justifyContent: "center", paddingHorizontal: s.spacing.gutter },
    actions: { flexDirection: "row", gap: s.spacing.inline },
  });
