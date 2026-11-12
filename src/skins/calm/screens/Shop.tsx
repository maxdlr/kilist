import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import T from "../text";
import ShopPanels from "@/components/views/ShopList/_components/ShopPanels";
import useShopRun from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { useState } from "react";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  InformationCircleIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";
import { InformationCircleIcon as InformationCircleSolid } from "react-native-heroicons/solid";
import Svg, { Path } from "react-native-svg";
import { calmPalette as C } from "..";
import { CButton, CText, Dot, Screen, StockBars } from "./parts";
import { CalmLoading, CalmMessage } from "./States";

const START_PREVIEW = 6;

const Circle = ({ done }: { done: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View
      style={[
        styles.circle,
        done ? styles.circleDone : { borderColor: C.ring },
      ]}
    >
      {done && (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12l4 4 10-10"
            stroke={C.ground}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
      {!done && <View style={{ width: skin.spacing.hair }} />}
    </View>
  );
};

const SwipeRow = ({
  food,
  onBuy,
  onLater,
}: {
  food: FoodType;
  onBuy: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [buying, setBuying] = useState(true);
  const level = levelOf(food.inStockScore);

  return (
    <View
      accessible
      accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}`}
      accessibilityHint={T.shop.hintAria}
      accessibilityActions={[
        { name: "activate", label: T.shop.inBasket },
        { name: "later", label: T.shop.nextTime },
      ]}
      onAccessibilityAction={(event) =>
        event.nativeEvent.actionName === "later" ? onLater() : onBuy()
      }
      style={[styles.slot, { backgroundColor: buying ? C.ink : C.tint }]}
    >
      <View
        style={[
          styles.behind,
          { justifyContent: buying ? "flex-start" : "flex-end" },
        ]}
      >
        <CText
          weight="medium"
          size={skin.type.label + 1}
          color={buying ? C.ground : C.soft}
        >
          {buying ? T.shop.inBasket : T.shop.later}
        </CText>
      </View>
      <SwipeGesture
        onSwipeRight={onBuy}
        onSwipeLeft={onLater}
        onSwipingRight={() => setBuying(true)}
        onSwipingLeft={() => setBuying(false)}
        swipeThreshold={100}
        styles={{ box: styles.swipeBox }}
      >
        <View
          style={[styles.rowMain, { paddingHorizontal: skin.spacing.stack }]}
        >
          <CText size={skin.type.lead} style={[styles.flex]} numberOfLines={1}>
            {food.name}
          </CText>
          <Dot color={skin.colors.levels[level]} />
        </View>
      </SwipeGesture>
    </View>
  );
};

const CalmShop = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [showHow, setShowHow] = useState(false);
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

  const dockWith = (label: string, onPress: () => void) => (
    <View style={styles.dockRow}>
      <Press
        accessibilityRole="button"
        accessibilityLabel={common.shop.add}
        onPress={run.openAdd}
        style={withPressed(styles.addButton)}
      >
        <PlusIcon
          size={skin.size.icon.action}
          color={C.ink}
          strokeWidth={1.8}
        />
      </Press>
      <CButton flex={1} label={label} onPress={onPress} />
    </View>
  );
  if (!run.isStarted && !run.isEmpty) {
    return (
      <View style={styles.flex}>
        <Screen padded={false} dock={dockWith(common.shop.start, run.start)}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
            <View style={styles.startHead}>
              <View style={styles.titleRow}>
                <CText
                  weight="medium"
                  size={skin.type.display.md}
                  accessibilityRole="header"
                >
                  {T.shop.title}
                </CText>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={T.shop.howAria}
                  accessibilityState={{ expanded: showHow }}
                  hitSlop={skin.spacing.small}
                  onPress={() => setShowHow((shown) => !shown)}
                  style={withPressed(styles.info)}
                >
                  {showHow ? (
                    <InformationCircleSolid
                      size={skin.size.icon.action + 2}
                      color={C.ink}
                    />
                  ) : (
                    <InformationCircleIcon
                      size={skin.size.icon.action + 2}
                      color={C.soft}
                      strokeWidth={1.6}
                    />
                  )}
                </Press>
              </View>
              <StockBars
                rows={[
                  {
                    label: T.stock.sure,
                    count: run.range.low,
                    color: skin.colors.levels[1],
                    icon: (
                      <ShoppingBagIcon
                        size={18}
                        color={C.haveIt}
                        strokeWidth={1.8}
                      />
                    ),
                  },
                  {
                    label: T.stock.maybe,
                    count: run.range.high - run.range.low,
                    color: skin.colors.levels[3],
                    icon: (
                      <QuestionMarkCircleIcon
                        size={18}
                        color={C.faint}
                        strokeWidth={1.8}
                      />
                    ),
                  },
                ]}
              />
            </View>
            {run.preview.slice(0, START_PREVIEW).map((food) => (
              <View key={food.id} style={styles.row}>
                <Dot color={skin.colors.levels[levelOf(food.inStockScore)]} />
                <CText
                  size={skin.type.lead}
                  style={styles.flex}
                  numberOfLines={1}
                >
                  {food.name}
                </CText>
              </View>
            ))}
            {run.preview.length > START_PREVIEW && (
              <CText size={skin.type.label} color={C.soft} style={styles.more}>
                {common.shop.more(run.preview.length - START_PREVIEW)}
              </CText>
            )}
            {showHow && (
              <View style={styles.how}>
                <View style={styles.howRow}>
                  <ArrowRightIcon
                    size={skin.size.icon.action - 4}
                    color={C.haveIt}
                    strokeWidth={1.8}
                  />
                  <CText size={skin.type.label + 1} style={styles.flex}>
                    {common.shop.startRight}
                  </CText>
                </View>
                <View style={styles.howRow}>
                  <ArrowLeftIcon
                    size={skin.size.icon.action - 4}
                    color={C.ink}
                    strokeWidth={1.8}
                  />
                  <CText size={skin.type.label + 1} style={styles.flex}>
                    {common.shop.startLeft}
                  </CText>
                </View>
              </View>
            )}
          </ScrollView>
        </Screen>
        <ShopPanels run={run} />
      </View>
    );
  }

  if (run.isEmpty && basket.length === 0 && later.length === 0) {
    return (
      <View style={styles.flex}>
        <CalmMessage
          title={skin.copy.shop.emptyTitle}
          line={skin.copy.shop.emptyLine}
          dock={
            <>
              <CButton
                variant="secondary"
                label={common.shop.add}
                onPress={run.openAdd}
              />
              <CButton
                variant="text"
                label={T.shop.backToday}
                onPress={() => router.navigate("/")}
              />
            </>
          }
        />
        <ShopPanels run={run} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Screen padded={false} dock={dockWith(common.shop.finish, run.finish)}>
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
              <CText size={skin.type.label} color={C.soft}>
                {T.shop.toBuy(remaining.length)}
              </CText>
              <Press
                accessibilityRole="button"
                accessibilityLabel={common.stopShopping}
                onPress={run.askStop}
                hitSlop={skin.spacing.small}
                style={withPressed(styles.close)}
              >
                <XMarkIcon
                  size={skin.size.icon.action}
                  color={C.soft}
                  strokeWidth={1.6}
                />
              </Press>
            </View>
          </View>
        </View>
        <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
          {remaining.length > 0 && (
            <View
              accessible
              accessibilityLabel={T.shop.hintAria}
              style={[styles.legend, styles.hint]}
            >
              <View style={styles.legendItem}>
                <ArrowLeftIcon size={16} color={C.soft} strokeWidth={1.8} />
                <ClockIcon size={16} color={C.soft} strokeWidth={1.8} />
                <CText size={skin.type.label} color={C.soft}>
                  {T.shop.later}
                </CText>
              </View>
              <View style={styles.legendItem}>
                <CText size={skin.type.label} color={C.soft}>
                  {T.shop.legendBasket}
                </CText>
                <ShoppingBagIcon size={16} color={C.haveIt} strokeWidth={1.8} />
                <ArrowRightIcon size={16} color={C.haveIt} strokeWidth={1.8} />
              </View>
            </View>
          )}
          {run.suggestion && (
            <View style={styles.next}>
              <CText size={skin.type.caption} color={C.soft}>
                {T.shop.usuallyNext}
              </CText>
              <SwipeRow
                food={run.suggestion}
                onBuy={() => tick(run.suggestion!)}
                onLater={() => postpone(run.suggestion!)}
              />
            </View>
          )}
          {run.rows.map((food) => (
            <SwipeRow
              key={food.id}
              food={food}
              onBuy={() => tick(food)}
              onLater={() => postpone(food)}
            />
          ))}
          {basket.length > 0 && (
            <>
              <CText
                size={skin.type.label}
                color={C.soft}
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
                      color={C.faint}
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
        </ScrollView>
      </Screen>
      <ShopPanels run={run} />
    </View>
  );
};

const createStyles = (s: Skin) =>
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
      borderTopColor: C.hairline,
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
    hint: { paddingBottom: s.spacing.small },
    startHead: { gap: s.spacing.inline, paddingBottom: s.spacing.section },
    info: {
      alignItems: "center",
      height: s.size.button.xs,
      justifyContent: "center",
      width: s.size.button.xs,
    },
    legend: { flexDirection: "row", justifyContent: "space-between" },
    legendItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.tight + 2,
    },
    dockRow: { flexDirection: "row", gap: s.spacing.small },
    addButton: {
      alignItems: "center",
      borderColor: C.field,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      height: s.size.button.lg,
      justifyContent: "center",
      width: s.size.button.lg,
    },
    more: {
      borderTopColor: C.hairline,
      borderTopWidth: s.shape.divider,
      paddingTop: s.spacing.inline,
    },
    how: {
      backgroundColor: C.tint,
      borderRadius: s.shape.radius,
      gap: s.spacing.small + 2,
      marginTop: s.spacing.section,
      padding: s.spacing.stack,
    },
    howRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small + 2,
    },
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
    slot: {
      borderTopColor: C.hairline,
      borderTopWidth: s.shape.divider,
      overflow: "hidden",
    },
    behind: {
      alignItems: "center",
      bottom: 0,
      flexDirection: "row",
      left: 0,
      paddingHorizontal: s.spacing.stack,
      position: "absolute",
      right: 0,
      top: 0,
    },
    swipeBox: { backgroundColor: C.ground },
    circle: {
      alignItems: "center",
      borderRadius: s.size.check,
      borderWidth: 1.5,
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
    circleDone: { backgroundColor: C.ink, borderColor: C.ink },
    basketLabel: {
      paddingBottom: s.spacing.small,
      paddingTop: s.spacing.gutter,
    },
    struck: { textDecorationLine: "line-through" },
  });

export default CalmShop;
