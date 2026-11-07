import V from "../text";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import useShopRun from "@/hooks/screens/useShopRun";
import { mmss, useShopRecords } from "@/hooks/versus/api";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { versusPalette as P } from "..";
import { Card, Kicker, Screen, VButton, VText } from "./parts";
import { VersusEmpty, VersusLoading } from "./States";

const CLOCK_MS = 250;

const Row = ({ food, done }: { food: FoodType; done: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View
      accessible
      accessibilityLabel={`${food.name}, ${done ? V.shop.boughtLower : V.shop.notBought}`}
      style={[styles.row, { backgroundColor: done ? P.panel : P.white }]}
    >
      <View style={{ opacity: done ? 0.45 : 1 }}>
        <FoodPicture food={food} size={skin.size.icon.row} />
      </View>
      <VText
        face="bold"
        size={skin.type.lead - 1}
        color={done ? P.faint : P.ink}
        style={[styles.flex, done && styles.struck]}
        numberOfLines={1}
      >
        {food.name}
      </VText>
      {done && (
        <View style={[styles.check, { backgroundColor: P.you, borderColor: P.you }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12l4 4 10-10" stroke={P.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      )}
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

  return (
    <View
      accessibilityActions={[
        { name: "activate", label: V.shop.bought },
        { name: "later", label: V.shop.nextTime },
      ]}
      onAccessibilityAction={(event) => (event.nativeEvent.actionName === "later" ? onLater() : onBuy())}
      style={[styles.swipeSlot, { backgroundColor: buying ? P.agree : P.panelHigh }]}
    >
      <View style={[styles.behind, { justifyContent: buying ? "flex-start" : "flex-end" }]}>
        <VText face="display" size={skin.type.title} color={buying ? P.ink : P.soft}>
          {buying ? V.shop.bought : V.shop.nextTime}
        </VText>
      </View>
      <SwipeGesture
        onSwipeRight={onBuy}
        onSwipeLeft={onLater}
        onSwipingRight={() => setBuying(true)}
        onSwipingLeft={() => setBuying(false)}
        swipeThreshold={100}
        styles={{ box: styles.swipeBox }}
      >
        <Row food={food} done={false} />
      </SwipeGesture>
    </View>
  );
};

const VersusShop = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const run = useShopRun();
  const { data: records, mutate: refreshRecords } = useShopRecords();
  const [bought, setBought] = useState<FoodType[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [later, setLater] = useState<FoodType[]>([]);
  const [result, setResult] = useState<{ ms: number; items: number; left: number } | null>(null);
  const startedAt = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const listId = run.shopListId;
  const remaining = run.foods ?? [];
  const running = Boolean(listId) && !result && (remaining.length > 0 || bought.length > 0);

  useEffect(() => {
    if (!running) return;
    if (startedAt.current === null) startedAt.current = Date.now();
    timer.current = setInterval(() => setElapsed(Date.now() - startedAt.current!), CLOCK_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const record = records?.houseRecord ?? null;
  const ghost = record?.splits ?? [];
  const total = remaining.length + bought.length + later.length;
  const ghostDone = ghost.filter((split) => split <= elapsed).length;
  const recordAtHere = bought.length ? ghost[Math.min(bought.length, ghost.length) - 1] ?? null : null;
  const gap = recordAtHere === null ? null : elapsed - recordAtHere;
  const recordName = record ? (record.userId === user?.id ? V.shop.yourRecord : record.username) : null;

  const buy = async (food: FoodType) => {
    setBought((list) => [...list, food]);
    await run.buy(food.id);
  };

  const skipForNow = async (food: FoodType) => {
    setLater((list) => [...list, food]);
    await run.snooze(food.id);
  };

  const finish = async () => {
    if (timer.current) clearInterval(timer.current);
    const ms = startedAt.current ? Date.now() - startedAt.current : 0;
    setResult({ ms, items: bought.length, left: remaining.length + later.length });
    await run.cancelShopList();
    refreshRecords();
  };

  const leave = () => {
    run.setShopListId(undefined);
    setResult(null);
    setBought([]);
    setLater([]);
    startedAt.current = null;
    router.navigate("/");
  };

  if (result) {
    const beat = !record || result.ms < record.ms;
    return (
      <Screen dock={<VButton big label={V.shop.backHome} onPress={leave} />}>
        <View style={styles.centered}>
          <Kicker>{V.shop.kicker}</Kicker>
          <VText face="display" size={skin.type.display.lg} color={beat ? P.you : P.mates[0]} style={styles.centerText}>
            {beat ? V.shop.newRecord : V.shop.holdsIt(record?.username)}
          </VText>
          <VText size={skin.type.body} color={P.soft} style={styles.centerText}>
            {record ? V.shop.gap(mmss(Math.abs(record.ms - result.ms)), beat, recordName ?? "") : V.shop.firstRun}
          </VText>
        </View>
        <Card>
          <View style={styles.between}>
            <VText size={skin.type.label} color={P.soft}>{V.play.yourTime}</VText>
            <VText face="bold" size={skin.type.label}>{mmss(result.ms)}</VText>
          </View>
          {record && (
            <View style={styles.between}>
              <VText size={skin.type.label} color={P.soft}>{V.shop.houseRecord(record.username)}</VText>
              <VText size={skin.type.label}>{mmss(record.ms)}</VText>
            </View>
          )}
          <View style={styles.between}>
            <VText size={skin.type.label} color={P.soft}>{V.shop.bought}</VText>
            <VText size={skin.type.label}>{String(result.items)}</VText>
          </View>
          <View style={styles.between}>
            <VText size={skin.type.label} color={P.soft}>{V.shop.leftForNext}</VText>
            <VText size={skin.type.label}>{String(result.left)}</VText>
          </View>
        </Card>
      </Screen>
    );
  }

  if (run.isLoading) return <VersusLoading />;

  if (run.isEmpty && bought.length === 0 && later.length === 0) {
    return (
      <VersusEmpty
        kicker={V.shop.kicker}
        title={V.shop.emptyTitle}
        line={V.shop.emptyLine}
        action={{ label: V.home.raceToday, onPress: () => router.navigate("/swipe") }}
      />
    );
  }

  const allDone = remaining.length === 0;

  return (
    <Screen
      padded={false}
      dock={
        <View style={styles.actions}>
          <VButton flex={1} variant="secondary" label={V.shop.stop} accessibilityLabel={V.shop.stopAria} onPress={run.stop} />
          <VButton flex={1.6} label={allDone ? V.shop.stopClock : V.shop.finish(remaining.length)} onPress={finish} />
        </View>
      }
    >
      <View style={styles.hud}>
        <View style={styles.between}>
          <VText face="pixel" size={skin.type.title - 2} color={P.you}>{mmss(elapsed)}</VText>
          <VText face="bold" size={skin.type.label} color={gap !== null && gap <= 0 ? P.agree : P.muted}>
            {!record ? V.shop.setRecord : gap === null ? V.shop.record(mmss(record.ms)) : gap <= 0 ? V.play.ahead(mmss(-gap), recordName ?? "") : V.play.behind(mmss(gap), recordName ?? "")}
          </VText>
        </View>
        <View style={styles.lane}>
          <VText face="bold" size={skin.type.caption} color={P.you} style={styles.laneLabel}>{V.you}</VText>
          <View style={styles.track}>
            <View style={[styles.trackFill, { backgroundColor: P.you, width: `${total ? (bought.length / total) * 100 : 0}%` }]} />
          </View>
          <VText size={skin.type.caption} color={P.muted}>{`${bought.length}/${total}`}</VText>
        </View>
        {record && (
          <View style={styles.lane}>
            <VText face="bold" size={skin.type.caption} color={P.mates[0]} style={styles.laneLabel} numberOfLines={1}>
              {record.userId === user?.id ? V.play.best : record.username}
            </VText>
            <View style={styles.track}>
              <View style={[styles.trackFill, { backgroundColor: P.mates[0], opacity: 0.5, width: `${record.items ? (Math.min(ghostDone, record.items) / record.items) * 100 : 0}%` }]} />
            </View>
            <VText size={skin.type.caption} color={P.muted}>{`${Math.min(ghostDone, record.items)}/${record.items}`}</VText>
          </View>
        )}
      </View>
      <View style={styles.hints}>
        <VText size={skin.type.caption} color={P.muted}>{`← ${V.shop.nextTime}`}</VText>
        <VText size={skin.type.caption} color={P.muted}>{`${V.shop.bought} →`}</VText>
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
        {run.suggestion && (
          <View style={styles.next}>
            <VText size={skin.type.caption} color={P.muted}>{V.shop.usuallyNext}</VText>
            <SwipeRow food={run.suggestion} onBuy={() => buy(run.suggestion!)} onLater={() => skipForNow(run.suggestion!)} />
          </View>
        )}
        {run.rows.map((food) => (
          <SwipeRow key={food.id} food={food} onBuy={() => buy(food)} onLater={() => skipForNow(food)} />
        ))}
        {bought.map((food) => (
          <Row key={`bought-${food.id}`} food={food} done />
        ))}
      </ScrollView>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    between: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    centered: { alignItems: "center", gap: s.spacing.tight, paddingTop: s.spacing.section },
    centerText: { textAlign: "center" },
    hud: { gap: s.spacing.small, paddingBottom: s.spacing.small, paddingHorizontal: s.spacing.gutter },
    lane: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    laneLabel: { width: 52 },
    track: { backgroundColor: P.panelHigh, borderRadius: 5, flex: 1, height: 10, overflow: "hidden" },
    trackFill: { height: "100%" },
    list: { gap: s.spacing.small, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
    row: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      flexDirection: "row",
      gap: s.spacing.inline + 2,
      minHeight: s.size.row.shop,
      paddingLeft: s.spacing.inline,
      paddingRight: s.spacing.dock - 2,
      paddingVertical: s.spacing.small,
    },
    struck: { textDecorationLine: "line-through" },
    hints: { flexDirection: "row", justifyContent: "space-between", paddingBottom: s.spacing.small, paddingHorizontal: s.spacing.gutter + s.spacing.tight },
    swipeSlot: { borderRadius: s.shape.radius, overflow: "hidden" },
    behind: { alignItems: "center", bottom: 0, flexDirection: "row", left: 0, paddingHorizontal: s.spacing.section, position: "absolute", right: 0, top: 0 },
    swipeBox: { borderRadius: s.shape.radius },
    check: {
      alignItems: "center",
      borderRadius: s.size.check,
      borderWidth: s.shape.border,
      height: s.size.check + 4,
      justifyContent: "center",
      width: s.size.check + 4,
    },
    next: { gap: s.spacing.tight + 2, paddingBottom: s.spacing.small },
    bubble: {
      backgroundColor: P.white,
      borderBottomLeftRadius: s.spacing.tight,
      borderRadius: s.shape.radius,
      flex: 1,
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.dock - 2,
      paddingVertical: s.spacing.inline + 2,
    },
    bubbleTop: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    bubbleActions: { flexDirection: "row", gap: s.spacing.small },
    bubbleButton: { alignItems: "center", borderRadius: s.spacing.dock - 2, flex: 1, justifyContent: "center", minHeight: s.size.button.xs },
    bubbleSkip: { borderColor: P.ink, borderWidth: s.shape.border },
    actions: { flexDirection: "row", gap: s.spacing.inline },
  });

export default VersusShop;
