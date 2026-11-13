import Press from "@/components/elements/Press";
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
import { rules } from "@/offline/rules";
import { router, useFocusEffect } from "expo-router";
import {
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "react-native-heroicons/outline";
import { useCallback } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import useSWR from "swr";
import { calmColors, useCalmColors } from "./colors";
import { CButton, CText, Screen, StockBars, useCheckPending } from "./parts";
import { CalmError, CalmLoading } from "./States";

const PREVIEW = 4;

const CalmHome = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const { data: mainList, mutate: refreshList } = useSWR<ListType>({
    url: "lists/read?main=true",
  });
  const listIds = mainList?.id ? [Number(mainList.id)] : undefined;
  const {
    data: foods,
    error,
    mutate: refreshFoods,
  } = useSWR<FoodType[]>({
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
  const names = needed
    .slice(0, PREVIEW)
    .map((food, index) => (index === 0 ? food.name : food.name.toLowerCase()));
  const sentence = `${names.join(", ")}${needed.length > PREVIEW ? "…" : "."}`;

  return (
    <Screen
      padded={false}
      dock={
        links.notice ? (
          <Press
            accessibilityRole="button"
            onPress={links.notice.open}
            style={withPressed(styles.notice)}
          >
            <CText size={skin.type.label + 1} style={styles.noticeText}>
              {links.notice.label}
            </CText>
          </Press>
        ) : undefined
      }
    >
      <View style={styles.top}>
        <CText size={skin.type.label} color={C.textSoft} style={styles.flex}>
          {T.date(new Date())}
        </CText>
        <HomeShortcuts />
      </View>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={C.textSoft}
          />
        }
      >
        <View style={styles.head}>
          <CText
            weight="medium"
            size={skin.type.display.md}
            accessibilityRole="header"
          >
            {range.high === 0 ? skin.copy.home.headline(0, 0) : T.home.ready}
          </CText>
          {allSet && (
            <CText size={skin.type.body} color={C.textSoft}>
              {T.home.allSetLine}
            </CText>
          )}
          <SyncNote color={C.textSoft} />
        </View>

        {foods.length > 0 && (
          <StockBars
            rows={[
              {
                label: T.stock.sure,
                count: range.low,
                color: skin.colors.levels[1],
                icon: (
                  <ShoppingBagIcon
                    size={18}
                    color={C.positive}
                    strokeWidth={1.8}
                  />
                ),
              },
              {
                label: T.stock.maybe,
                count: range.high - range.low,
                color: C.barMaybe,
                icon: (
                  <QuestionMarkCircleIcon
                    size={18}
                    color={C.textFaint}
                    strokeWidth={1.8}
                  />
                ),
              },

              {
                label: T.stock.stocked,
                count: Math.max(0, foods.length - range.high),
                color: skin.colors.levels[5],
                icon: (
                  <CheckIcon size={18} color={C.textSoft} strokeWidth={2} />
                ),
              },
            ]}
          />
        )}

        {pending && (
          <Press
            accessibilityRole="button"
            accessibilityLabel={`${T.home.toCheck(toCheck)}. ${T.home.checkLine}`}
            onPress={() => router.navigate("/swipe")}
            style={withPressed(styles.card)}
          >
            <PlayIcon
              size={skin.size.icon.action + 2}
              color={C.positive}
              strokeWidth={1.8}
            />
            <View style={styles.cardText}>
              <CText weight="medium" size={skin.type.body}>
                {T.home.toCheck(toCheck)}
              </CText>
              <View style={styles.cardFacts}>
                <View style={styles.fact}>
                  <ClockIcon size={14} color={C.textSoft} strokeWidth={1.8} />
                  <CText size={skin.type.label} color={C.textSoft}>
                    {T.home.sortTime}
                  </CText>
                </View>
                <View style={styles.fact}>
                  <SparklesIcon
                    size={14}
                    color={C.textSoft}
                    strokeWidth={1.8}
                  />
                  <CText size={skin.type.label} color={C.textSoft}>
                    {T.home.sortPoints(toCheck * rules().tickets.perSwipe)}
                  </CText>
                </View>
              </View>
            </View>
            <ChevronRightIcon size={18} color={C.textFaint} strokeWidth={2} />
          </Press>
        )}

        {needed.length > 0 && (
          <View style={styles.onList}>
            <CText size={skin.type.label} color={C.textSoft}>
              {T.home.onTheList}
            </CText>
            <CText size={skin.type.lead}>{sentence}</CText>
            <CButton
              label={T.home.goShop}
              href="/shop"
              icon={(color) => (
                <ShoppingBagIcon size={20} color={color} strokeWidth={1.8} />
              )}
            />
          </View>
        )}

        {links.prizes.length > 0 && (
          <View style={styles.prizes}>
            <View style={styles.prizesHead}>
              <CText
                weight="medium"
                size={skin.type.label + 1}
                accessibilityRole="header"
                style={styles.flex}
              >
                {links.prizesTitle}
              </CText>
              <Press
                accessibilityRole="button"
                hitSlop={8}
                onPress={links.openPrizes}
                style={({ pressed }) => [
                  styles.discover,
                  { opacity: pressed ? skin.shape.pressedOpacity : 1 },
                ]}
              >
                <CText size={skin.type.label}>{links.discoverLabel}</CText>
              </Press>
            </View>
            {links.prizes.map((prize) => (
              <Press
                key={prize.id}
                accessibilityRole="button"
                accessibilityLabel={`${prize.name}. ${prize.away}. ${prize.line}`}
                onPress={prize.open}
                style={({ pressed }) => [
                  styles.prize,
                  { opacity: pressed ? skin.shape.pressedOpacity : 1 },
                ]}
              >
                <View style={styles.prizeText}>
                  <CText
                    weight="medium"
                    size={skin.type.label + 1}
                    numberOfLines={1}
                    style={styles.prizeName}
                  >
                    {prize.name}
                  </CText>
                  <CText
                    size={skin.type.label}
                    color={C.textSoft}
                    numberOfLines={1}
                    style={styles.prizeDetail}
                  >
                    {prize.away}
                  </CText>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.trackFill,
                      { width: `${Math.round(prize.progress * 100)}%` },
                    ]}
                  />
                </View>
              </Press>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    scroll: {
      gap: s.spacing.section + 4,
      paddingBottom: s.spacing.stack,
      paddingHorizontal: s.spacing.gutter,
    },
    head: { gap: s.spacing.small },
    top: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.gutter,
    },
    onList: { gap: s.spacing.inline },
    card: {
      alignItems: "center",
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.shape.radius + 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline,
      padding: s.spacing.stack,
    },
    cardText: { flex: 1, gap: 2, minWidth: 0 },
    cardFacts: { flexDirection: "row", gap: s.spacing.inline },
    fact: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight },
    prizes: {
      backgroundColor: C.tint,
      borderRadius: s.shape.radius + 2,
      gap: s.spacing.stack,
      marginTop: s.spacing.small,
      padding: s.spacing.stack + 2,
    },
    prizesHead: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    discover: {
      borderColor: C.fieldLine,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.tight,
    },
    prize: { gap: s.spacing.small },
    prizeName: { flexShrink: 1 },
    prizeText: {
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "space-between",
    },
    prizeDetail: { flexShrink: 1, textAlign: "right" },
    track: {
      backgroundColor: C.fieldLine,
      borderRadius: 2,
      height: 4,
      overflow: "hidden",
    },
    trackFill: { backgroundColor: C.fill, borderRadius: 2, height: 4 },
    notice: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: s.size.button.xs,
    },
    noticeText: { textAlign: "center", textDecorationLine: "underline" },
  });

export default CalmHome;
