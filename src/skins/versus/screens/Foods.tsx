import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import FormInput from "@/components/elements/FormInput";
import FoodPanels from "@/components/views/FoodList/_components/FoodPanels";
import useFoodShelf from "@/hooks/screens/useFoodShelf";
import { RaceAnswer, useHouseVotes } from "@/hooks/versus/api";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Svg, { Path } from "react-native-svg";
import { versusPalette as P } from "..";
import { ANSWER_FILL, Chip, initialOf, Kicker, memberColor, Screen, VButton, VText, WORD } from "./parts";
import { VersusLoading } from "./States";

type Vote = { userId: number; username: string; answer: RaceAnswer | null };

const isClash = (votes: Vote[]) => {
  const cast = votes.map((vote) => vote.answer).filter((answer) => answer === "in" || answer === "out");
  return cast.includes("in") && cast.includes("out");
};

const FoodRow = ({
  food,
  votes,
  colors,
  selecting,
  selected,
  onPress,
}: {
  food: FoodType;
  votes: Vote[];
  colors: Record<number, string>;
  selecting: boolean;
  selected: boolean;
  onPress: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const clash = isClash(votes);
  const voteText = votes.map((vote) => `${vote.username}: ${vote.answer ? WORD[vote.answer] : "no vote"}`).join(", ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selecting ? { selected } : undefined}
      accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}${clash ? ", votes clash" : ""}. ${voteText}`}
      onPress={onPress}
      style={[styles.row, { borderColor: selected ? P.you : "transparent" }]}
    >
      {selecting && (
        <View style={[styles.box, { backgroundColor: selected ? P.you : "transparent", borderColor: selected ? P.you : P.faint }]}>
          {selected && (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12l4 4 10-10" stroke={P.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        </View>
      )}
      <View style={styles.thumb}>
        <FoodPicture food={food} size={skin.size.icon.row - 8} />
      </View>
      <View style={[styles.flex, styles.rowBody]}>
        <View style={styles.nameRow}>
          <VText face="bold" size={skin.type.lead - 1} numberOfLines={1} style={styles.shrink}>
            {food.name}
          </VText>
          {clash && <Chip label="Clash" fill={P.clash} />}
        </View>
        <Chip label={skin.copy.levels[level]} fill={skin.colors.levels[level]} />
      </View>
      <View style={styles.dots}>
        {votes.map((vote) => (
          <View
            key={vote.userId}
            style={[
              styles.dot,
              { backgroundColor: vote.answer ? ANSWER_FILL[vote.answer] : P.line, borderColor: colors[vote.userId] },
            ]}
          >
            <VText face="bold" size={skin.type.caption - 3} color={vote.answer && vote.answer !== "up" ? P.ink : P.muted}>
              {initialOf(vote.username)}
            </VText>
          </View>
        ))}
      </View>
    </Pressable>
  );
};

const VersusFoods = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const shelf = useFoodShelf();
  const { data: house, mutate: refreshVotes } = useHouseVotes();
  const { foods, query, isEmpty, noResults, isSelectMode, selectedIds } = shelf;

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
      username: member.id === user?.id ? "You" : member.username,
      answer: house?.votes[food.id]?.[member.id]?.answer ?? null,
    }));

  const half = (label: string, onPress: () => void, variant: "primary" | "secondary" | "buy" = "primary") => (
    <VButton key={label} flex={1} label={label} variant={variant} onPress={onPress} />
  );
  const actions = isSelectMode
    ? [half(skin.copy.common.cancel, shelf.exitSelectMode, "secondary"), half(`Remove ${selectedIds.length}`, shelf.removeSelected, "buy")]
    : noResults
      ? [half("Clear search", () => shelf.setSearch(""), "secondary"), half(`Add “${query}”`, () => shelf.openAdd(shelf.search.trim()))]
      : isEmpty
        ? [half(skin.copy.list.addOwn, () => shelf.openAdd(), "secondary"), half("Suggested foods", () => router.push("/onboarding"))]
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
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Kicker>Every vote counts</Kicker>
              <VText face="display" size={skin.type.headline}>{skin.copy.list.title}</VText>
            </View>
            <VText size={skin.type.label} color={P.muted}>{`${foods?.length ?? 0} foods`}</VText>
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
                <VText size={skin.type.caption - 1} color={P.soft}>No vote</VText>
              </View>
            </View>
          )}
        </View>

        {noResults ? (
          <View style={styles.message}>
            <VText face="display" size={skin.type.title}>{`No “${query}” in the house`}</VText>
            <VText size={skin.type.body} color={P.soft}>{"Add it and it joins tomorrow's race."}</VText>
          </View>
        ) : isEmpty ? (
          <View style={styles.message}>
            <VText face="display" size={skin.type.title}>{skin.copy.list.emptyTitle}</VText>
            <VText size={skin.type.body} color={P.soft}>No foods means no race. Pick a few suggested ones to start.</VText>
          </View>
        ) : (
          <FlatList
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
    shrink: { flexShrink: 1 },
    header: { gap: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
    titleRow: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
    legend: { flexDirection: "row", gap: s.spacing.dock - 2 },
    legendItem: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight + 2 },
    legendDot: { borderRadius: 6, height: 12, width: 12 },
    list: { gap: s.spacing.small, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
    row: {
      alignItems: "center",
      backgroundColor: P.panel,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline + 2,
      minHeight: s.size.row.list,
      paddingLeft: s.spacing.inline,
      paddingRight: s.spacing.inline + 2,
      paddingVertical: s.spacing.small,
    },
    box: {
      alignItems: "center",
      borderRadius: s.spacing.small,
      borderWidth: s.shape.border,
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
    thumb: {
      alignItems: "center",
      backgroundColor: P.white,
      borderRadius: s.spacing.dock - 2,
      height: s.size.icon.row + 2,
      justifyContent: "center",
      width: s.size.icon.row + 2,
    },
    rowBody: { gap: s.spacing.tight + 1 },
    nameRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    dots: { flexDirection: "row", gap: s.spacing.tight },
    dot: {
      alignItems: "center",
      borderRadius: 12,
      borderWidth: s.shape.border,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    message: { flex: 1, gap: s.spacing.inline, justifyContent: "center", paddingHorizontal: s.spacing.gutter },
    actions: { flexDirection: "row", gap: s.spacing.inline },
  });

export default VersusFoods;
