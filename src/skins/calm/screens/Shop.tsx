import Press from "@/components/elements/Press";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import ShopPanels from "@/components/views/ShopList/_components/ShopPanels";
import useShopRun from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import withPressed from "@/utils/withPressed";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  InformationCircleIcon,
  PlusIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";
import { InformationCircleIcon as InformationCircleSolid } from "react-native-heroicons/solid";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import T from "../text";
import { calmColors, useCalmColors } from "./colors";
import { CButton, CText, Dot, Screen } from "./parts";
import { CalmLoading, CalmMessage } from "./States";

const TAGS_HEIGHT = 0.7;
const IDLE_MS = 2000;
const NUDGE = 150;
const NUDGE_PAUSE_MS = 900;

const Circle = ({ done }: { done: boolean }) => {
  const skin = useSkin();
  const C = useCalmColors();
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
            stroke={C.onFill}
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
  nudging = false,
  onBuy,
  onLater,
}: {
  food: FoodType;
  nudging?: boolean;
  onBuy: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const nudge = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (!nudging) {
      nudge.set(withTiming(0, AnimationService.config));
      return;
    }
    nudge.set(
      withRepeat(
        withSequence(
          withTiming(NUDGE, AnimationService.config),
          withTiming(0, AnimationService.config),
          withTiming(-NUDGE, AnimationService.config),
          withTiming(0, AnimationService.config),
          withDelay(NUDGE_PAUSE_MS, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
  }, [nudging, nudge]);

  const nudgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nudge.value }],
  }));
  const laterStyle = useAnimatedStyle(() => ({
    opacity: drag.value + nudge.value < 0 ? 1 : 0,
  }));

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
      style={styles.slot}
    >
      <View style={[styles.behind, styles.behindBuy]}>
        <CText weight="medium" size={skin.type.label + 1} color={C.onFill}>
          {T.shop.inBasket}
        </CText>
      </View>
      <Animated.View style={[styles.behind, styles.behindLater, laterStyle]}>
        <CText weight="medium" size={skin.type.label + 1} color={C.textSoft}>
          {T.shop.later}
        </CText>
      </Animated.View>
      <Animated.View style={nudgeStyle}>
        <SwipeGesture
          onSwipeRight={onBuy}
          onSwipeLeft={onLater}
          translation={drag}
          swipeThreshold={100}
          styles={{ box: styles.swipeBox }}
        >
          <View
            style={[styles.rowMain, { paddingHorizontal: skin.spacing.stack }]}
          >
            <CText
              size={skin.type.lead}
              style={[styles.flex]}
              numberOfLines={1}
            >
              {food.name}
            </CText>
            <Dot color={skin.colors.levels[level]} />
          </View>
        </SwipeGesture>
      </Animated.View>
    </View>
  );
};

const CalmShop = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const { height } = useWindowDimensions();
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
  const [touches, setTouches] = useState(0);
  const [idleFor, setIdleFor] = useState<string | null>(null);
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
          color={C.text}
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
                      color={C.text}
                    />
                  ) : (
                    <InformationCircleIcon
                      size={skin.size.icon.action + 2}
                      color={C.textSoft}
                      strokeWidth={1.6}
                    />
                  )}
                </Press>
              </View>
            </View>
            <ScrollView
              style={[styles.tagScroll, { maxHeight: height * TAGS_HEIGHT }]}
              contentContainerStyle={styles.tags}
            >
              {run.preview.map((food) => (
                <View key={food.id} style={styles.tag}>
                  <CText size={skin.type.body} numberOfLines={1}>
                    {food.name}
                  </CText>
                </View>
              ))}
            </ScrollView>
            {showHow && (
              <View style={styles.how}>
                <View style={styles.howRow}>
                  <ArrowRightIcon
                    size={skin.size.icon.action - 4}
                    color={C.positive}
                    strokeWidth={1.8}
                  />
                  <CText size={skin.type.label + 1} style={styles.flex}>
                    {common.shop.startRight}
                  </CText>
                </View>
                <View style={styles.howRow}>
                  <ArrowLeftIcon
                    size={skin.size.icon.action - 4}
                    color={C.text}
                    strokeWidth={1.8}
                  />
                  <CText size={skin.type.label + 1} style={styles.flex}>
                    {common.shop.startLeft}
                  </CText>
                </View>
              </View>
            )}
          </View>
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
    <View
      style={styles.flex}
      onTouchStart={() => setTouches((count) => count + 1)}
    >
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
                <XMarkIcon
                  size={skin.size.icon.action}
                  color={C.textSoft}
                  strokeWidth={1.6}
                />
              </Press>
            </View>
          </View>
        </View>
        <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
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
        </ScrollView>
      </Screen>
      <ShopPanels run={run} />
    </View>
  );
};

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
      borderColor: C.fieldLine,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      height: s.size.button.lg,
      justifyContent: "center",
      width: s.size.button.lg,
    },
    tagScroll: { flexGrow: 0, flexShrink: 1 },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    tag: {
      backgroundColor: C.tint,
      borderRadius: s.size.toggle / 2,
      paddingHorizontal: s.spacing.inline + 2,
      paddingVertical: s.spacing.small,
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
      borderTopColor: C.line,
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
    behindBuy: { backgroundColor: C.fill, justifyContent: "flex-start" },
    behindLater: { backgroundColor: C.tint, justifyContent: "flex-end" },
    swipeBox: { backgroundColor: C.ground },
    circle: {
      alignItems: "center",
      borderRadius: s.size.check,
      borderWidth: 1.5,
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
    circleDone: { backgroundColor: C.fill, borderColor: C.fill },
    basketLabel: {
      paddingBottom: s.spacing.small,
      paddingTop: s.spacing.gutter,
    },
    struck: { textDecorationLine: "line-through" },
  });

export default CalmShop;
