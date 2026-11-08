import T from "../text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType, ListType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import useSWR from "swr";
import { calmPalette as C } from "..";
import { CButton, CText, Dot, Screen, useCheckPending } from "./parts";
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

  useFocusEffect(
    useCallback(() => {
      refreshFoods();
    }, [refreshFoods]),
  );

  const refresh = () => Promise.all([refreshList(), refreshFoods()]);

  if (!foods) {
    return error ? <CalmError onRetry={refresh} /> : <CalmLoading />;
  }

  const needed = foods
    .filter((food) => levelOf(food.inStockScore) <= 2)
    .sort((a, b) => (a.inStockScore ?? 0) - (b.inStockScore ?? 0));
  const allSet = needed.length === 0 && !pending;
  const more = needed.length - PREVIEW;

  return (
    <Screen
      padded={false}
      dock={
        <>
          {pending && <CButton label={T.home.check(toCheck)} href="/swipe" />}
          {needed.length > 0 && <CButton variant={pending ? "secondary" : "primary"} label={T.openList} href="/shop" />}
          {allSet && <CButton variant="text" label={T.browseInventory} href="/inventory" />}
        </>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={C.soft} />}
      >
        <View style={styles.head}>
          <CText size={skin.type.label} color={C.soft}>{T.date(new Date())}</CText>
          <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
            {skin.copy.home.headline(needed.length)}
          </CText>
          {allSet && (
            <CText size={skin.type.body} color={C.soft}>
              {T.home.allSetLine}
            </CText>
          )}
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
      </ScrollView>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    scroll: { gap: s.spacing.section + 4, paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    head: { gap: s.spacing.small },
    card: {
      borderColor: C.hairline,
      borderRadius: s.shape.radius + 2,
      borderWidth: s.shape.border,
      gap: s.spacing.tight + 2,
      padding: s.spacing.stack + 2,
    },
    sectionLabel: { paddingBottom: s.spacing.small },
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
