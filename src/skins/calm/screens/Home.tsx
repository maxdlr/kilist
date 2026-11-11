import withPressed from "@/utils/withPressed";
import HomeShortcuts from "@/components/views/Dashboard/_components/HomeShortcuts";
import SyncNote from "@/components/elements/SyncNote";
import T from "../text";
import useBuyRange from "@/hooks/screens/useBuyRange";
import useHomeLinks from "@/hooks/screens/useHomeLinks";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType, ListType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import useSWR from "swr";
import { calmPalette as C } from "..";
import { CText, Dot, Screen, useCheckPending } from "./parts";
import { CalmError, CalmLoading } from "./States";

const PREVIEW = 6;

const CalmHome = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { data: mainList, mutate: refreshList } = useSWR<ListType>({ url: "lists/read?main=true" });
  const listIds = mainList?.id ? [Number(mainList.id)] : undefined;
  const { data: foods, error, mutate: refreshFoods } = useSWR<FoodType[]>({
    url: listIds ? "foods/browse" : null,
    params: { listIds, search: undefined },
  });
  const { count: toCheck, pending } = useCheckPending();
  const links = useHomeLinks();
  const range = useBuyRange();

  useFocusEffect(
    useCallback(() => {
      refreshFoods();
    }, [refreshFoods]),
  );

  const refresh = async () => {
    await Promise.all([refreshList(), refreshFoods()]);
  };

  if (!foods) {
    return error ? <CalmError onRetry={refresh} /> : <CalmLoading />;
  }

  const needed = foods
    .filter((food) => levelOf(food.inStockScore) <= 2)
    .sort((a, b) => (a.inStockScore ?? 0) - (b.inStockScore ?? 0));
  const allSet = range.high === 0 && !pending;
  const more = needed.length - PREVIEW;

  return (
    <Screen
      padded={false}
      dock={
        links.notice ? (
          <Pressable accessibilityRole="button" onPress={links.notice.open} style={withPressed(styles.notice)}>
            <CText size={skin.type.label + 1} style={styles.noticeText}>
              {links.notice.label}
            </CText>
          </Pressable>
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={C.soft} />}
      >
        <View style={styles.head}>
          <View style={styles.top}>
            <CText size={skin.type.label} color={C.soft} style={styles.flex}>{T.date(new Date())}</CText>
            <HomeShortcuts />
          </View>
          <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
            {skin.copy.home.headline(range.low, range.high)}
          </CText>
          {allSet && (
            <CText size={skin.type.body} color={C.soft}>
              {T.home.allSetLine}
            </CText>
          )}
          <SyncNote color={C.soft} />
        </View>

        {pending && (
          <View style={styles.card}>
            <CText weight="medium" size={skin.type.body}>{T.home.toCheck(toCheck)}</CText>
            <CText size={skin.type.label + 1} color={C.soft}>
              {T.home.checkLine}
            </CText>
          </View>
        )}

        {needed.length > 0 && (
          <View>
            <CText size={skin.type.label} color={C.soft} style={styles.sectionLabel}>{T.home.onTheList}</CText>
            {needed.slice(0, PREVIEW).map((food) => {
              const level = levelOf(food.inStockScore);
              return (
                <View key={food.id} style={styles.row}>
                  <Dot color={skin.colors.levels[level]} />
                  <CText size={skin.type.body} style={styles.flex} numberOfLines={1}>{food.name}</CText>
                  <CText size={skin.type.caption} color={C.soft}>{skin.copy.levels[level]}</CText>
                </View>
              );
            })}
            {more > 0 && (
              <CText size={skin.type.label} color={C.soft} style={styles.more}>{T.home.more(more)}</CText>
            )}
          </View>
        )}

        {links.prizes.length > 0 && (
          <View style={styles.prizes}>
            <CText size={skin.type.label} color={C.soft}>{links.prizesTitle}</CText>
            {links.prizes.map((prize) => (
              <Pressable
                key={prize.id}
                accessibilityRole="button"
                accessibilityLabel={`${prize.name}. ${prize.line} ${prize.status}`}
                onPress={prize.open}
                style={({ pressed }) => [styles.prize, { opacity: pressed ? skin.shape.pressedOpacity : 1 }]}
              >
                <View style={styles.prizeText}>
                  <CText weight="medium" size={skin.type.label + 1}>{prize.name}</CText>
                  <CText size={skin.type.label} color={C.soft} numberOfLines={1} style={styles.prizeDetail}>
                    {prize.status}
                  </CText>
                </View>
                <CText size={skin.type.label} color={C.soft}>{prize.line}</CText>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${Math.round(prize.progress * 100)}%` }]} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    scroll: { gap: s.spacing.section + 4, paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    head: { gap: s.spacing.small },
    top: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    card: {
      borderColor: C.hairline,
      borderRadius: s.shape.radius + 2,
      borderWidth: s.shape.border,
      gap: s.spacing.tight + 2,
      padding: s.spacing.stack + 2,
    },
    sectionLabel: { paddingBottom: s.spacing.small },
    prizes: { gap: s.spacing.small },
    prize: {
      backgroundColor: C.tint,
      borderRadius: s.shape.radius,
      gap: s.spacing.small,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.inline + 2,
    },
    prizeText: { flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    prizeDetail: { flexShrink: 1, textAlign: "right" },
    track: { backgroundColor: C.field, borderRadius: 2, height: 4, overflow: "hidden" },
    trackFill: { backgroundColor: C.ink, borderRadius: 2, height: 4 },
    notice: { alignItems: "center", justifyContent: "center", minHeight: s.size.button.xs },
    noticeText: { textAlign: "center", textDecorationLine: "underline" },
    row: {
      alignItems: "center",
      borderTopColor: C.hairline,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.stripe,
    },
    more: { borderTopColor: C.hairline, borderTopWidth: s.shape.divider, paddingTop: s.spacing.inline },
  });

export default CalmHome;
