import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import useShopRun from "@/hooks/screens/useShopRun";
import { fetchShopTip, mmss, ShopTip, useShopRecords } from "@/hooks/versus/api";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { versusPalette as P } from "..";
import { Avatar, Card, Kicker, Screen, VButton, VText } from "./parts";
import { VersusEmpty, VersusLoading } from "./States";

const CLOCK_MS = 250;

const Row = ({ food, done, onPress }: { food: FoodType; done: boolean; onPress: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: done, disabled: done }}
      accessibilityLabel={`${food.name}, ${done ? "bought" : "not bought yet"}`}
      disabled={done}
      onPress={onPress}
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
      <View style={[styles.check, { backgroundColor: done ? P.you : "transparent", borderColor: done ? P.you : "#C9C4E6" }]}>
        {done && (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12l4 4 10-10" stroke={P.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>
    </Pressable>
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
        { name: "activate", label: "Bought" },
        { name: "later", label: "Next time" },
      ]}
      onAccessibilityAction={(event) => (event.nativeEvent.actionName === "later" ? onLater() : onBuy())}
      style={[styles.swipeSlot, { backgroundColor: buying ? P.agree : P.panelHigh }]}
    >
      <View style={[styles.behind, { justifyContent: buying ? "flex-start" : "flex-end" }]}>
        <VText face="display" size={skin.type.title} color={buying ? P.ink : P.soft}>
          {buying ? "Bought" : "Next time"}
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
        <Row food={food} done={false} onPress={onBuy} />
      </SwipeGesture>
    </View>
  );
};

const TipBubble = ({ tip, onSkip, onTake }: { tip: ShopTip; onSkip: () => void; onTake: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View accessibilityLiveRegion="polite" style={styles.tip}>
      <Avatar name={tip.username} color={tip.isSelf ? P.you : P.mates[0]!} size={skin.size.button.xs} ghost={tip.isSelf} />
      <View style={styles.bubble}>
        <View style={styles.bubbleTop}>
          <FoodPicture food={tip.food} size={skin.size.icon.row - 4} />
          <VText size={skin.type.label} color={P.ink} style={styles.flex}>
            {tip.isSelf
              ? `Last times you got this, you grabbed ${tip.food.name.toLowerCase()} too.`
              : `${tip.food.name}? ${tip.username} usually grabs it with this.`}
          </VText>
        </View>
        <VText size={skin.type.caption - 1} color={P.cardInk}>
          {`${tip.isSelf ? "From your own shops" : `${tip.username}'s shops`}: ${tip.count} of the last ${tip.of}.`}
        </VText>
        <View style={styles.bubbleActions}>
          <Pressable accessibilityRole="button" onPress={onSkip} style={[styles.bubbleButton, styles.bubbleSkip]}>
            <VText face="bold" size={skin.type.label} color={P.ink}>Not today</VText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onTake} style={[styles.bubbleButton, { backgroundColor: P.action }]}>
            <VText face="bold" size={skin.type.label} color={P.ink}>Got it too</VText>
          </Pressable>
        </View>
      </View>
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
  const [tip, setTip] = useState<ShopTip | null>(null);
  const [later, setLater] = useState<FoodType[]>([]);
  const [result, setResult] = useState<{ ms: number; items: number; left: number } | null>(null);
  const startedAt = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenTips = useRef(new Set<number>());

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
  const recordName = record ? (record.userId === user?.id ? "your record" : record.username) : null;

  const buy = async (food: FoodType) => {
    setBought((list) => [...list, food]);
    await run.buy(food.id);
    if (!listId || seenTips.current.has(food.id)) return;
    seenTips.current.add(food.id);
    try {
      const next = await fetchShopTip(listId, food.id);
      if (next && !bought.some((entry) => entry.id === next.food.id)) setTip(next);
    } catch {
      setTip(null);
    }
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
    setTip(null);
    startedAt.current = null;
    seenTips.current.clear();
    router.navigate("/");
  };

  if (result) {
    const beat = !record || result.ms < record.ms;
    return (
      <Screen dock={<VButton big label="Back home" onPress={leave} />}>
        <View style={styles.centered}>
          <Kicker>Shopping race</Kicker>
          <VText face="display" size={skin.type.display.lg} color={beat ? P.you : P.mates[0]} style={styles.centerText}>
            {beat ? "New record!" : `${record?.username ?? "Record"} holds it`}
          </VText>
          <VText size={skin.type.body} color={P.soft} style={styles.centerText}>
            {record ? `${mmss(Math.abs(record.ms - result.ms))} ${beat ? "faster than" : "off"} ${recordName}` : "First run on the board"}
          </VText>
        </View>
        <Card>
          <View style={styles.between}>
            <VText size={skin.type.label} color={P.soft}>Your time</VText>
            <VText face="bold" size={skin.type.label}>{mmss(result.ms)}</VText>
          </View>
          {record && (
            <View style={styles.between}>
              <VText size={skin.type.label} color={P.soft}>{`House record · ${record.username}`}</VText>
              <VText size={skin.type.label}>{mmss(record.ms)}</VText>
            </View>
          )}
          <View style={styles.between}>
            <VText size={skin.type.label} color={P.soft}>Bought</VText>
            <VText size={skin.type.label}>{String(result.items)}</VText>
          </View>
          <View style={styles.between}>
            <VText size={skin.type.label} color={P.soft}>Left for next time</VText>
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
        kicker="Shopping race"
        title="Nothing to buy"
        line="The house votes say you're stocked. New votes land with tomorrow's race."
        action={{ label: "Race today's 10", onPress: () => router.navigate("/swipe") }}
      />
    );
  }

  const allDone = remaining.length === 0;

  return (
    <Screen
      padded={false}
      dock={
        <View style={styles.actions}>
          <VButton flex={1} variant="secondary" label="Stop" accessibilityLabel="Stop shopping" onPress={run.stop} />
          <VButton flex={1.6} label={allDone ? "Stop the clock" : `Finish · ${remaining.length} left`} onPress={finish} />
        </View>
      }
    >
      <View style={styles.hud}>
        <View style={styles.between}>
          <VText face="pixel" size={skin.type.title - 2} color={P.you}>{mmss(elapsed)}</VText>
          <VText face="bold" size={skin.type.label} color={gap !== null && gap <= 0 ? P.agree : P.muted}>
            {!record ? "Set the house record" : gap === null ? `Record ${mmss(record.ms)}` : gap <= 0 ? `${mmss(-gap)} ahead of ${recordName}` : `${mmss(gap)} behind ${recordName}`}
          </VText>
        </View>
        <View style={styles.lane}>
          <VText face="bold" size={skin.type.caption} color={P.you} style={styles.laneLabel}>You</VText>
          <View style={styles.track}>
            <View style={[styles.trackFill, { backgroundColor: P.you, width: `${total ? (bought.length / total) * 100 : 0}%` }]} />
          </View>
          <VText size={skin.type.caption} color={P.muted}>{`${bought.length}/${total}`}</VText>
        </View>
        {record && (
          <View style={styles.lane}>
            <VText face="bold" size={skin.type.caption} color={P.mates[0]} style={styles.laneLabel} numberOfLines={1}>
              {record.userId === user?.id ? "Best" : record.username}
            </VText>
            <View style={styles.track}>
              <View style={[styles.trackFill, { backgroundColor: P.mates[0], opacity: 0.5, width: `${record.items ? (Math.min(ghostDone, record.items) / record.items) * 100 : 0}%` }]} />
            </View>
            <VText size={skin.type.caption} color={P.muted}>{`${Math.min(ghostDone, record.items)}/${record.items}`}</VText>
          </View>
        )}
      </View>
      <View style={styles.hints}>
        <VText size={skin.type.caption} color={P.muted}>← Next time</VText>
        <VText size={skin.type.caption} color={P.muted}>Bought →</VText>
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
        {remaining.map((food) => (
          <SwipeRow key={food.id} food={food} onBuy={() => buy(food)} onLater={() => skipForNow(food)} />
        ))}
        {bought.map((food) => (
          <Row key={`bought-${food.id}`} food={food} done onPress={() => undefined} />
        ))}
      </ScrollView>
      {tip && (
        <TipBubble
          tip={tip}
          onSkip={() => setTip(null)}
          onTake={() => {
            const food = tip.food;
            setTip(null);
            buy(food);
          }}
        />
      )}
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
    tip: { alignItems: "flex-end", flexDirection: "row", gap: s.spacing.inline, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
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
