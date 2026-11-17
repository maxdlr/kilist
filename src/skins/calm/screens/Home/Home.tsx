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
import { RefreshControl, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import AddFoodPanel from "@/components/features/Inventory/AddFoodPanel";
import { CartIcon, ClockIcon, NavArrowRightIcon, PlayIcon, SparksIcon } from "@/components/icons";
import useSWR from "swr";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, GlassScrollView, Screen } from "@/skins/calm/components";
import { StockBars } from "./_components/StockBars";
import useCheckPending from "@/skins/calm/hooks/useCheckPending";
import { CalmError, CalmLoading } from "../States";
import GLASS from "./glass";

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
  const shortcuts = useHomeShortcuts({ withNotice: true, onAdd: () => setAdding(true) });
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
    <KeyboardAvoidingView style={styles.flex} behavior="padding" automaticOffset>
      <Screen
        padded={false}
        glass
        glassLook={GLASS}
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
        <GlassScrollView
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
              total={foods.length}
              rows={[
                {
                  label: T.stock.sure,
                  count: range.low,
                  color: skin.colors.levels[1],
                  icon: (
                    <CartIcon
                      size={18}
                      color={C.positive}
                      strokeWidth={1.8}
                    />
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
                    <SparksIcon
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
              <NavArrowRightIcon size={18} color={C.textFaint} strokeWidth={2} />
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
        </GlassScrollView>
      </Screen>
      <AddFoodPanel visible={adding} onClose={() => setAdding(false)} />
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
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.shape.radius + 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline,
      padding: s.spacing.stack,
    },
    cardText: { flex: 1, gap: s.spacing.hair, minWidth: 0 },
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
