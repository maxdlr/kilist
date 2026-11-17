import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import V from "@/skins/versus/text";
import ShopPanels from "@/components/features/Shop/ShopPanels";
import useShopRun from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import axios from "@/services/axios";
import { mmss, useShopRecords } from "@/skins/versus/hooks/api";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { XmarkIcon } from "@/components/icons";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Card, Kicker, Screen, VButton, VText } from "@/skins/versus/components";
import { VersusEmpty, VersusLoading } from "../States";
import StartLine from "./_components/StartLine";
import Row from "./_components/Row";
import SwipeRow from "./_components/SwipeRow";

const CLOCK_MS = 250;

const VersusShop = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const { data: records, mutate: refreshRecords } = useShopRecords();
  const run = useShopRun({ onSaved: () => conclude() });
  const [started, setStarted] = useState(false);
  const [bought, setBought] = useState<FoodType[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [later, setLater] = useState<FoodType[]>([]);
  const [result, setResult] = useState<{ ms: number; items: number; left: number } | null>(null);
  const startedAt = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const listId = run.shopListId;
  const remaining = run.foods ?? [];
  const running = (started || run.isStarted) && Boolean(listId) && !result && (remaining.length > 0 || bought.length > 0);

  useEffect(() => {
    if (!running) return;
    startedAt.current ??= Date.now();
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

  const begin = async () => {
    const id = await run.start();
    if (!id) return;
    startedAt.current = Date.now();
    setElapsed(0);
    setStarted(true);
    axios.post(`shop-list/clock/${id}`, {}).catch(() => {});
  };

  const resetRun = () => {
    setStarted(false);
    setResult(null);
    setBought([]);
    setLater([]);
    setElapsed(0);
    startedAt.current = null;
  };

  const abandon = () => {
    if (bought.length === 0) {
      resetRun();
      return run.discard();
    }
    return run.askStop();
  };

  const buy = async (food: FoodType) => {
    setBought((list) => [...list, food]);
    await run.buy(food.id);
  };

  const skipForNow = async (food: FoodType) => {
    setLater((list) => [...list, food]);
    await run.snooze(food.id);
  };

  const conclude = () => {
    if (timer.current) clearInterval(timer.current);
    const ms = startedAt.current ? Date.now() - startedAt.current : 0;
    setResult({ ms, items: bought.length, left: remaining.length + later.length });
    refreshRecords();
  };

  const close = () => {
    resetRun();
    run.reset();
  };

  if (result) {
    const beat = !record || result.ms < record.ms;
    return (
      <Screen dock={<VButton big label={V.shop.closeRun} onPress={close} />}>
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

  if (!run.isStarted) {
    return (
      <View style={styles.flex}>
        <StartLine
          foods={run.preview}
          record={record}
          onStart={begin}
          selected={run.selected}
          onPick={run.toggleSelect}
          onCancel={run.clearSelection}
          onLater={run.buyLater}
        />
      </View>
    );
  }

  const allDone = remaining.length === 0;

  return (
    <View style={styles.flex}>
    <Screen
      padded={false}
      dock={
        <View style={styles.actions}>
          <VButton flex={1} variant="secondary" label={common.shop.add} onPress={run.openAdd} />
          <VButton flex={1.6} label={allDone ? V.shop.stopClock : V.shop.finish(remaining.length)} onPress={run.finish} />
        </View>
      }
    >
      <View style={styles.hud}>
        <View style={styles.between}>
          <Press
            accessibilityRole="button"
            accessibilityLabel={V.shop.stopAria}
            onPress={abandon}
            hitSlop={skin.spacing.small}
            style={withPressed(styles.close)}
          >
            <XmarkIcon size={skin.size.icon.action} color={P.muted} strokeWidth={2} />
          </Press>
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
      <ShopPanels run={run} />
    </View>
  );
};

export default VersusShop;

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    between: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    centered: { alignItems: "center", gap: s.spacing.tight, paddingTop: s.spacing.section },
    centerText: { textAlign: "center" },
    close: { alignItems: "center", height: s.size.button.xs, justifyContent: "center", width: s.size.button.xs },
    hud: { gap: s.spacing.small, paddingBottom: s.spacing.small, paddingHorizontal: s.spacing.gutter },
    lane: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    laneLabel: { width: 52 },
    track: { backgroundColor: P.panelHigh, borderRadius: 5, flex: 1, height: 10, overflow: "hidden" },
    trackFill: { height: "100%" },
    list: { gap: s.spacing.small, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
    hints: { flexDirection: "row", justifyContent: "space-between", paddingBottom: s.spacing.small, paddingHorizontal: s.spacing.gutter + s.spacing.tight },
    next: { gap: s.spacing.tight + 2, paddingBottom: s.spacing.small },
    actions: { flexDirection: "row", gap: s.spacing.inline },
  });
