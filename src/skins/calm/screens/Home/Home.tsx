import { KeyboardAvoided } from "@/components/elements/BackBar";
import Press from "@/components/elements/Press";
import SyncNote from "@/components/elements/SyncNote";
import { useHomeShortcuts } from "@/components/features/Home/HomeShortcuts";
import useBuyRange from "@/hooks/screens/useBuyRange";
import useHomeLinks from "@/hooks/screens/useHomeLinks";
import { rules } from "@/offline/rules";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType, ListType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import withPressed from "@/utils/withPressed";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import AddFoodPanel from "@/components/features/Inventory/AddFoodPanel";
import {
  ArcadeIcon,
  CartIcon,
  ClockIcon,
  NavArrowRightIcon,
  SparksIcon,
  XmarkIcon,
} from "@/components/icons";
import common from "@/i18n/common";
import useNews from "@/hooks/useNews";
import useSWR from "swr";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import {
  CButton,
  CText,
  Screen,
} from "@/skins/calm/components";
import { NewsSlide } from "./_components/NewsSlide";
import { StockBars } from "./_components/StockBars";
import useCheckPending from "@/skins/calm/hooks/useCheckPending";
import { CalmError, CalmLoading } from "../States";

const PREVIEW = 12;

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
  const [adding, setAdding] = useState(false);
  const shortcuts = useHomeShortcuts({
    withNotice: true,
    onAdd: () => setAdding(true),
  });
  const range = useBuyRange();
  const { news, open: openNews, dismiss: dismissNews } = useNews();

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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      automaticOffset
    >
      <KeyboardAvoided.Provider value>
      <Screen
        padded={false}
        dock={shortcuts.map((item) => (
          <CButton
            key={item.label}
            variant="secondary"
            accessibilityLabel={item.label}
            onPress={item.open}
            icon={item.icon}
          />
        ))}
      >
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
            <SyncNote collapse={skin.spacing.small} />
          </View>

          {foods.length > 0 && (
            <StockBars
              total={foods.length}
              rows={[
                {
                  label: T.stock.sure,
                  count: range.low,
                  color: skin.colors.levels[1],
                  icon: (
                    <CartIcon size={18} color={C.positive} strokeWidth={1.8} />
                  ),
                },
              ]}
            />
          )}

          <NewsSlide news={news} gap={skin.spacing.section + 4}>
            {(news) => (
              <View style={styles.news}>
                <Press
                  accessibilityRole={news.url ? "button" : undefined}
                  accessibilityLabel={`${common.news.label}. ${news.title}. ${news.body}`}
                  disabled={!news.url}
                  onPress={openNews}
                  style={withPressed(styles.newsMain)}
                >
                  <SparksIcon
                    size={skin.size.icon.action + 2}
                    color={C.newsCard.icon}
                    strokeWidth={1.8}
                  />
                  <View style={styles.cardText}>
                    <CText weight="medium" size={skin.type.body} color={C.newsCard.title}>
                      {news.title}
                    </CText>
                    <CText size={skin.type.label} color={C.newsCard.body}>
                      {news.body}
                    </CText>
                  </View>
                  {news.url && (
                    <NavArrowRightIcon size={18} color={C.newsCard.close} strokeWidth={2} />
                  )}
                </Press>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={common.news.dismiss}
                  hitSlop={skin.spacing.small}
                  onPress={dismissNews}
                  style={withPressed(styles.newsClose)}
                >
                  <XmarkIcon
                    size={skin.size.icon.action - 4}
                    color={C.newsCard.close}
                    strokeWidth={1.8}
                  />
                </Press>
              </View>
                      )}
          </NewsSlide>

          {pending && (
            <Press
              accessibilityRole="button"
              accessibilityLabel={`${T.home.toCheck(toCheck)}. ${T.home.checkLine}`}
              onPress={() => router.navigate("/swipe")}
              style={withPressed(styles.card)}
            >
              <ArcadeIcon
                size={skin.size.icon.action + 2}
                color={C.sortCard.icon}
                strokeWidth={1.8}
              />
              <View style={styles.cardText}>
                <CText
                  weight="medium"
                  size={skin.type.body}
                  color={C.sortCard.title}
                >
                  {T.home.toCheck(toCheck)}
                </CText>
                <View style={styles.cardFacts}>
                  <View style={styles.fact}>
                    <ClockIcon
                      size={14}
                      color={C.sortCard.facts}
                      strokeWidth={1.8}
                    />
                    <CText size={skin.type.label} color={C.sortCard.facts}>
                      {T.home.sortTime}
                    </CText>
                  </View>
                  <View style={styles.fact}>
                    <SparksIcon
                      size={14}
                      color={C.sortCard.facts}
                      strokeWidth={1.8}
                    />
                    <CText size={skin.type.label} color={C.sortCard.facts}>
                      {T.home.sortPoints(toCheck * rules().tickets.perSwipe)}
                    </CText>
                  </View>
                </View>
              </View>
              <NavArrowRightIcon
                size={18}
                color={C.sortCard.arrow}
                strokeWidth={2}
              />
            </Press>
          )}

          {needed.length > 0 && (
            <View style={styles.onList}>
              <CText size={skin.type.label} color={C.textSoft}>
                {T.home.onTheList}
              </CText>
              <CText size={skin.type.lead}>{sentence}</CText>
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
                <CButton
                  bold
                  small
                  label={links.discoverLabel}
                  onPress={links.openPrizes}
                />
              </View>
              {links.prizes.map((prize) => (
                <Press
                  key={prize.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${prize.name}. ${prize.away}. ${prize.line}`}
                  onPress={prize.open}
                  style={withPressed(styles.prize)}
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
      <AddFoodPanel visible={adding} onClose={() => setAdding(false)} />
      </KeyboardAvoided.Provider>
    </KeyboardAvoidingView>
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
    onList: { gap: s.spacing.inline },
    card: {
      alignItems: "center",
      backgroundColor: C.sortCard.fill,
      borderColor: C.sortCard.border,
      borderRadius: s.shape.radius + 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline,
      padding: s.spacing.stack,
    },
    cardText: { flex: 1, gap: s.spacing.hair, minWidth: 0 },
    news: {
      backgroundColor: C.newsCard.fill,
      borderColor: C.newsCard.border,
      borderRadius: s.shape.radius + 2,
      borderWidth: s.shape.border,
    },
    newsMain: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      padding: s.spacing.stack,
      paddingRight: s.spacing.stack + s.size.button.xs,
    },
    newsClose: {
      alignItems: "center",
      height: s.size.button.xs,
      justifyContent: "center",
      position: "absolute",
      right: s.spacing.tight,
      top: s.spacing.tight,
      width: s.size.button.xs,
    },
    cardFacts: { flexDirection: "row", gap: s.spacing.inline },
    fact: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight },
    prizes: {
      borderColor: C.em?.textFaint,
      borderWidth: s.shape.border,
      borderRadius: s.shape.radius * 2,
      gap: s.spacing.stack,
      marginTop: s.spacing.small,
      padding: s.spacing.gutter,
    },
    prizesHead: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
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
      borderRadius: s.spacing.hair,
      height: s.spacing.tight,
      overflow: "hidden",
    },
    trackFill: {
      backgroundColor: C.fill,
      borderRadius: s.spacing.hair,
      height: s.spacing.tight,
    },
  });

export default CalmHome;
