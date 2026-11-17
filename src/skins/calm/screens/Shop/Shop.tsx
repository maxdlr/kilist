import Press from "@/components/elements/Press";
import ShopPanels from "@/components/features/Shop/ShopPanels";
import useAisleManager from "@/hooks/screens/useAisleManager";
import useShopRun from "@/hooks/screens/useShopRun";
import { getLang } from "@/i18n";
import common from "@/i18n/common";
import { aisleList, aisleName, aisleOf } from "@/offline/foodNames";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import withPressed from "@/utils/withPressed";
import { useEffect, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { InfoCircleIcon, InfoCircleSolidIcon, PlusIcon, XmarkIcon } from "@/components/icons";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import AnimationService from "@/services/animation";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, DockSpacer, Dot, Screen, useDockCover } from "@/skins/calm/components";
import { CalmLoading, CalmMessage } from "../States";
import AisleManager from "./_components/AisleManager";
import Circle from "./_components/Circle";
import SwipeRow from "./_components/SwipeRow";


const HINT_SLIDE = 28;

const OTHER_AISLE = "other";

const IDLE_MS = 2000;

const CalmShop = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const [showHow, setShowHow] = useState(false);
  const hint = useSharedValue(0);
  const hintStyle = useAnimatedStyle(() => ({
    opacity: hint.value,
    transform: [{ translateX: (1 - hint.value) * HINT_SLIDE }],
  }));

  useEffect(() => {
    hint.set(withTiming(showHow ? 1 : 0, AnimationService.config));
  }, [showHow, hint]);
  const [basket, setBasket] = useState<FoodType[]>([]);
  const [later, setLater] = useState<FoodType[]>([]);
  const [result, setResult] = useState<{ bought: number; left: number } | null>(
    null,
  );
  const run = useShopRun({
    onSaved: (bought) =>
      setResult({ bought, left: Math.max(0, run.total - bought) }),
  });
  const remaining = run.foods ?? [];
  const aisles = useAisleManager({
    foods: run.preview,
    text: {
      confirmTitle: T.shop.aislesConfirmTitle,
      confirmLine: T.shop.aislesConfirmLine,
      confirmKeep: T.shop.aislesConfirmKeep,
      confirmSave: T.shop.aislesConfirmSave,
      confirmDiscard: T.shop.aislesConfirmDiscard,
    },
    onSaved: run.refreshPreview,
  });
  const [touches, setTouches] = useState(0);
  const [idleFor, setIdleFor] = useState<string | null>(null);
  const startCover = useDockCover();
  const runCover = useDockCover();
  const canNudge = run.isStarted && run.handled === 0 && remaining.length > 0;
  const activity = `${touches}:${run.panel}`;
  const nudging = canNudge && !run.panel && idleFor === activity;

  useEffect(() => {
    if (!canNudge) return;
    const timer = setTimeout(() => setIdleFor(activity), IDLE_MS);
    return () => clearTimeout(timer);
  }, [canNudge, activity]);

  const tick = (food: FoodType) => {
    setBasket((list) => [...list, food]);
    run.buy(food.id);
  };

  const postpone = (food: FoodType) => {
    setLater((list) => [...list, food]);
    run.snooze(food.id);
  };

  const leave = () => {
    setBasket([]);
    setLater([]);
    setResult(null);
    run.leave();
  };

  if (result) {
    return (
      <CalmMessage
        mark="done"
        title={T.done}
        line={T.shop.result(result.bought, result.left)}
        dock={<CButton label={T.shop.backToday} onPress={leave} />}
      />
    );
  }

  if (run.isLoading) return <CalmLoading />;

  const refresher = (
    <RefreshControl
      refreshing={false}
      onRefresh={run.refreshEmpty}
      tintColor={C.textSoft}
    />
  );

  const dockWith = (label: string, onPress: () => void) => (
    <>
      <CButton
        variant="secondary"
        accessibilityLabel={common.shop.add}
        onPress={run.openAdd}
        icon={(color) => (
          <PlusIcon
            size={skin.size.icon.action}
            color={color}
            strokeWidth={1.8}
          />
        )}
      />
      <CButton label={label} onPress={onPress} />
    </>
  );
  if (!run.isStarted && !run.isEmpty) {
    const selecting = run.selected.length > 0;
    const lang = getLang();
    const byAisle = new Map<string, FoodType[]>();
    for (const food of run.preview) {
      const aisle = aisleOf(food) ?? OTHER_AISLE;
      byAisle.set(aisle, [...(byAisle.get(aisle) ?? []), food]);
    }
    const known = aisleList().filter((aisle) => byAisle.has(aisle.id));
    const rest = [...byAisle.keys()].filter(
      (id) => !known.some((aisle) => aisle.id === id),
    );
    const sections = [
      ...known.map((aisle) => ({
        id: aisle.id,
        label: aisleName(aisle, lang),
        foods: byAisle.get(aisle.id)!,
      })),
      ...(rest.length > 0
        ? [
            {
              id: OTHER_AISLE,
              label: T.shop.otherAisle,
              foods: rest.flatMap((id) => byAisle.get(id)!),
            },
          ]
        : []),
    ];
    return (
      <View style={styles.flex}>
        <Screen
          padded={false}
          dock={
            selecting ? (
              <>
                <CButton variant="secondary" label={skin.copy.common.cancel} onPress={run.clearSelection} />
                <CButton label={common.shop.buyLater(run.selected.length)} onPress={run.buyLater} />
              </>
            ) : (
              dockWith(common.shop.start, run.start)
            )
          }
          glass
          cover={startCover.cover}
        >
          <View style={[styles.flex, styles.list]}>
            <View style={styles.startHead}>
              <View style={styles.titleRow}>
                <CText
                  weight="medium"
                  size={skin.type.display.md}
                  accessibilityRole="header"
                >
                  {T.shop.title}
                </CText>
                {selecting ? (
                  <CText size={skin.type.label} color={C.text} accessibilityLiveRegion="polite">
                    {common.shop.selected(run.selected.length)}
                  </CText>
                ) : (
                <View style={styles.howCluster}>
                  <Animated.View
                    pointerEvents="none"
                    accessibilityElementsHidden={!showHow}
                    importantForAccessibility={showHow ? "auto" : "no-hide-descendants"}
                    style={hintStyle}
                  >
                    <CText size={12} color={C.textSoft} accessibilityLiveRegion="polite" numberOfLines={1}>
                      {T.shop.selectToEdit}
                    </CText>
                  </Animated.View>
                  <Press
                    accessibilityRole="button"
                    accessibilityLabel={T.shop.howAria}
                    accessibilityState={{ expanded: showHow }}
                    hitSlop={skin.spacing.small}
                    onPress={() => setShowHow((shown) => !shown)}
                    style={withPressed(styles.info)}
                  >
                    {showHow ? (
                      <InfoCircleSolidIcon
                        size={skin.size.icon.action + 2}
                        color={C.text}
                      />
                    ) : (
                      <InfoCircleIcon
                        size={skin.size.icon.action + 2}
                        color={C.textSoft}
                        strokeWidth={1.6}
                      />
                    )}
                  </Press>
                </View>
                )}
              </View>
            </View>
            <Animated.ScrollView
              style={styles.tagScroll}
              contentContainerStyle={styles.sections}
              refreshControl={refresher}
              {...startCover.listProps}
            >
              {sections.map((section) => (
                <View key={section.id} style={styles.section}>
                  <View style={styles.sectionHead}>
                    <CText
                      size={skin.type.label}
                      color={C.textSoft}
                      accessibilityRole="header"
                    >
                      {section.label}
                    </CText>
                    {section.id === OTHER_AISLE && aisles.canManage && !selecting && (
                      <CButton
                        small
                        variant="text"
                        label={T.shop.manageAisles}
                        accessibilityLabel={T.shop.manageAislesAria}
                        onPress={aisles.open}
                      />
                    )}
                  </View>
                  <View style={styles.tags}>
                    {section.foods.map((food) => {
                      const picked = run.selected.includes(food.id);
                      const level = levelOf(food.inStockScore);
                      return (
                        <Press
                          key={food.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}`}
                          accessibilityState={{ selected: picked }}
                          onPress={() => run.toggleSelect(food)}
                          style={withPressed([styles.tag, picked && styles.tagPicked])}
                        >
                          <Dot color={skin.colors.levels[level]} />
                          <CText size={skin.type.body} color={picked ? C.onFill : C.text} numberOfLines={1}>
                            {food.name}
                          </CText>
                        </Press>
                      );
                    })}
                  </View>
                </View>
              ))}
              <DockSpacer />
            </Animated.ScrollView>
          </View>
        </Screen>
        <ShopPanels run={run} />
        <AisleManager manager={aisles} />
      </View>
    );
  }

  if (run.isEmpty && basket.length === 0 && later.length === 0) {
    return (
      <View style={styles.flex}>
        <CalmMessage
          title={skin.copy.shop.emptyTitle}
          line={skin.copy.shop.emptyLine}
          onRefresh={run.refreshEmpty}
        />
        <ShopPanels run={run} />
      </View>
    );
  }

  return (
    <View
      style={styles.flex}
      onTouchStart={() => setTouches((count) => count + 1)}
    >
      <Screen padded={false} glass cover={runCover.cover} dock={dockWith(common.shop.finish, run.finish)}>
        <View style={styles.head}>
          <View style={styles.titleRow}>
            <CText
              weight="medium"
              size={skin.type.headline}
              accessibilityRole="header"
            >
              {T.shop.title}
            </CText>
            <View style={styles.headSide}>
              <CText size={skin.type.label} color={C.textSoft}>
                {T.shop.toBuy(remaining.length)}
              </CText>
              <Press
                accessibilityRole="button"
                accessibilityLabel={common.stopShopping}
                onPress={run.askStop}
                hitSlop={skin.spacing.small}
                style={withPressed(styles.close)}
              >
                <XmarkIcon
                  size={skin.size.icon.action}
                  color={C.textSoft}
                  strokeWidth={1.6}
                />
              </Press>
            </View>
          </View>
        </View>
        <Animated.ScrollView
          style={styles.flex}
          contentContainerStyle={styles.list}
          refreshControl={refresher}
          {...runCover.listProps}
        >
          {run.suggestion && (
            <View style={styles.next}>
              <CText size={skin.type.caption} color={C.textSoft}>
                {T.shop.usuallyNext}
              </CText>
              <SwipeRow
                food={run.suggestion}
                nudging={nudging}
                onBuy={() => tick(run.suggestion!)}
                onLater={() => postpone(run.suggestion!)}
              />
            </View>
          )}
          {run.rows.map((food, index) => (
            <SwipeRow
              key={food.id}
              food={food}
              nudging={nudging && !run.suggestion && index === 0}
              onBuy={() => tick(food)}
              onLater={() => postpone(food)}
            />
          ))}
          {basket.length > 0 && (
            <>
              <CText
                size={skin.type.label}
                color={C.textSoft}
                style={styles.basketLabel}
              >
                {T.shop.inBasket}
              </CText>
              {basket.map((food) => (
                <View
                  key={`basket-${food.id}`}
                  accessible
                  accessibilityLabel={T.shop.inBasketAria(food.name)}
                  style={styles.row}
                >
                  <View style={styles.rowMain}>
                    <Circle done />
                    <CText
                      size={skin.type.lead}
                      color={C.textFaint}
                      style={[styles.flex, styles.struck]}
                      numberOfLines={1}
                    >
                      {food.name}
                    </CText>
                  </View>
                </View>
              ))}
            </>
          )}
          <DockSpacer />
        </Animated.ScrollView>
      </Screen>
      <ShopPanels run={run} />
    </View>
  );
};

export default CalmShop;

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    head: {
      gap: s.spacing.tight,
      paddingBottom: s.spacing.inline,
      paddingHorizontal: s.spacing.gutter,
    },
    titleRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    list: {
      paddingBottom: s.spacing.stack,
      paddingHorizontal: s.spacing.gutter,
    },
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.shop,
    },
    rowMain: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: s.spacing.dock - 2,
      minHeight: s.size.row.shop,
    },
    startHead: { gap: s.spacing.inline, paddingBottom: s.spacing.section },
    info: {
      alignItems: "center",
      height: s.size.button.xs,
      justifyContent: "center",
      width: s.size.button.xs,
    },
    tagScroll: { flex: 1 },
    sections: { gap: s.spacing.section },
    section: { gap: s.spacing.small },
    sectionHead: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: s.size.button.xs,
    },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    tag: {
      alignItems: "center",
      borderColor: C.fieldLine,
      borderRadius: s.size.toggle / 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.small,
      paddingHorizontal: s.spacing.inline + 2,
      paddingVertical: s.spacing.small,
    },
    tagPicked: { backgroundColor: C.fill, borderColor: C.fill },
    howCluster: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    headSide: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    close: {
      alignItems: "center",
      height: s.size.button.xs,
      justifyContent: "center",
      width: s.size.button.xs,
    },
    next: { gap: s.spacing.tight, paddingBottom: s.spacing.inline },
    basketLabel: {
      paddingBottom: s.spacing.small,
      paddingTop: s.spacing.gutter,
    },
    struck: { textDecorationLine: "line-through" },
  });
