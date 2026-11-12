import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import HomeShortcuts from "@/components/views/Dashboard/_components/HomeShortcuts";
import SyncNote from "@/components/elements/SyncNote";
import V from "../text";
import HomeLinksBlock from "@/components/views/Dashboard/_components/HomeLinksBlock";
import PullToRefresh from "@/components/gestures/PullToRefresh/PullToRefresh";
import useHomeData from "@/hooks/screens/useHomeData";
import { mmss, seconds, Standings, useStandings, useVersusMe } from "@/hooks/versus/api";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import type { Skin } from "@/skins/types";
import { levelOf, THRESHOLDS } from "@/utils/scoreUtils";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { versusPalette as P } from "..";
import { Avatar, Card, Kicker, memberColor, Screen, VButton, VText, WORD } from "./parts";
import { VersusError, VersusLoading } from "./States";

const ListBar = ({ counts }: { counts: number[] }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const labels = THRESHOLDS.map((threshold) => skin.copy.levels[levelOf(threshold)]);
  const fills = THRESHOLDS.map((threshold) => skin.colors.levels[levelOf(threshold)]);

  return (
    <>
      <View
        accessible
        accessibilityLabel={labels.map((label, index) => `${label} ${counts[index] ?? 0}`).join(", ")}
        style={styles.levelBar}
      >
        {counts.map((count, index) =>
          count > 0 ? <View key={index} style={{ flex: count, backgroundColor: fills[index] }} /> : null,
        )}
      </View>
      <View style={styles.legend}>
        {counts.map((count, index) =>
          count > 0 ? (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: fills[index] }]} />
              <VText size={skin.type.caption - 1} color={P.soft}>{`${labels[index]} ${count}`}</VText>
            </View>
          ) : null,
        )}
      </View>
    </>
  );
};

const PeriodToggle = ({ period, onPick }: { period: "week" | "season"; onPick: (value: "week" | "season") => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View accessibilityRole="radiogroup" style={styles.toggle}>
      {(["week", "season"] as const).map((value) => {
        const on = value === period;
        return (
          <Press
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onPick(value)}
            style={withPressed([styles.toggleItem, on && { backgroundColor: P.white }])}
          >
            <VText face="bold" size={skin.type.caption} color={on ? P.ink : P.soft}>
              {value === "week" ? V.home.week : V.home.season}
            </VText>
          </Press>
        );
      })}
    </View>
  );
};

const HouseHome = ({
  standings,
  period,
  onPick,
}: {
  standings: Standings;
  period: "week" | "season";
  onPick: (value: "week" | "season") => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const myId = user?.id;
  const members = standings.today.map((row) => ({ id: row.userId, username: row.username }));
  const myToday = standings.today.find((row) => row.userId === myId);
  const rival = standings.today.find((row) => row.userId !== myId && row.played) ?? standings.today.find((row) => row.userId !== myId);
  const clash = standings.lastClash;

  return (
    <>
      <Card>
        <View style={styles.between}>
          <VText face="bold" size={skin.type.lead}>
            {myToday?.played ? V.home.todayPlayed : V.home.todayRace}
          </VText>
          <VText size={skin.type.caption} color={P.muted}>{standings.day}</VText>
        </View>
        <View style={styles.players}>
          {standings.today.map((row) => {
            const color = memberColor(members, myId, row.userId);
            const mine = row.userId === myId;
            return (
              <View key={row.userId} style={[styles.player, mine && !row.played && { borderColor: P.action }]}>
                <Avatar name={row.username} color={color} size={skin.size.button.xs - 4} dim={!row.played && !mine} />
                <VText face="bold" size={skin.type.label} numberOfLines={1}>
                  {mine ? V.you : row.username}
                </VText>
                <VText face="pixel" size={(skin.type.caption - 1) - 4} color={row.played ? P.white : mine ? P.action : P.muted}>
                  {row.played ? seconds(row.totalMs).toUpperCase() : mine ? V.home.toPlay : V.home.notYet}
                </VText>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.section}>
        <View style={styles.between}>
          <VText face="bold" size={skin.type.lead}>{V.home.standings}</VText>
          <PeriodToggle period={period} onPick={onPick} />
        </View>
        <Card style={styles.table}>
          <View style={[styles.tableRow, styles.tableHead]}>
            <VText size={skin.type.caption - 1} color={P.muted} style={styles.cellName}>{V.home.player}</VText>
            <VText size={skin.type.caption - 1} color={P.muted} style={styles.cell}>{V.home.wins}</VText>
            <VText size={skin.type.caption - 1} color={P.muted} style={styles.cell}>{V.home.race}</VText>
            <VText size={skin.type.caption - 1} color={P.muted} style={styles.cell}>{V.home.right}</VText>
          </View>
          {standings.members.map((row, index) => (
            <View
              key={row.userId}
              style={[styles.tableRow, row.userId === myId && { backgroundColor: "rgba(255,95,162,0.12)" }]}
            >
              <View style={[styles.cellName, styles.nameCell]}>
                <VText face="pixel" size={(skin.type.caption - 1) - 3} color={index === 0 ? P.white : P.muted}>
                  {String(index + 1)}
                </VText>
                <Avatar name={row.username} color={memberColor(members, myId, row.userId)} size={skin.size.check} />
                <VText face="bold" size={skin.type.label} numberOfLines={1} style={styles.flex}>
                  {row.userId === myId ? V.you : row.username}
                </VText>
              </View>
              <VText size={skin.type.label} style={styles.cell}>{String(row.wins)}</VText>
              <VText size={skin.type.label} style={styles.cell}>{seconds(row.avgMs)}</VText>
              <VText size={skin.type.label} style={styles.cell}>{row.rightPct === null ? "–" : `${row.rightPct}%`}</VText>
            </View>
          ))}
        </Card>
        <VText size={skin.type.caption - 1} color={P.muted}>
          {V.home.legend}
        </VText>
      </View>

      {clash && (
        <Card>
          <VText face="bold" size={skin.type.label}>{V.home.lastClash}</VText>
          <View style={styles.chips}>
            {clash.votes.map((vote) => (
              <View key={vote.userId} style={[styles.vote, { backgroundColor: memberColor(members, myId, vote.userId) }]}>
                <VText face="bold" size={skin.type.caption - 1} color={P.ink}>
                  {`${vote.userId === myId ? V.you : vote.username}: ${WORD[vote.answer]}`}
                </VText>
              </View>
            ))}
          </View>
          {clash.verdict && (
            <VText size={skin.type.caption} color={P.soft}>
              {clash.verdict.result === "tied"
                ? V.home.tied
                : V.home.verdict(clash.verdict.result === "needed", Math.max(clash.verdict.out, clash.verdict.in), Math.min(clash.verdict.out, clash.verdict.in))}
            </VText>
          )}
        </Card>
      )}
      {rival && !rival.played && myToday?.played && (
        <VText size={skin.type.caption} color={P.muted}>
          {V.home.waiting(rival.username, seconds(myToday.totalMs))}
        </VText>
      )}
    </>
  );
};

const SoloHome = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { data: me } = useVersusMe();
  const personal = me?.personal;
  const stats = [
    { value: seconds(personal?.bestRaceMs), label: V.home.bestRace },
    { value: mmss(personal?.bestShopMs), label: V.home.bestShop },
    { value: V.home.days(personal?.streak ?? 0), label: V.home.streak },
    { value: personal?.changedMindPct === null || personal?.changedMindPct === undefined ? "–" : `${personal.changedMindPct}%`, label: V.home.changedMind },
  ];

  return (
    <>
      <Card>
        <View style={styles.soloRow}>
          <View style={styles.ghostPair}>
            <Avatar name={V.you} color={P.you} size={skin.size.button.sm} />
            <View style={styles.ghostShift}>
              <Avatar name={V.you} color={P.you} size={skin.size.button.sm} ghost />
            </View>
          </View>
          <View style={styles.flex}>
            <VText face="bold" size={skin.type.lead}>{V.youVsBest}</VText>
            <VText size={skin.type.caption} color={P.muted}>
              {personal?.bestRaceMs ? V.home.timeToBeat(seconds(personal.bestRaceMs)) : V.home.playOnce}
            </VText>
          </View>
        </View>
      </Card>
      <View style={styles.section}>
        <VText face="bold" size={skin.type.lead}>{V.home.personalBests}</VText>
        <View style={styles.grid}>
          {stats.map((stat) => (
            <Card key={stat.label} style={styles.gridCell}>
              <VText face="pixel" size={(skin.type.caption - 1)}>{stat.value}</VText>
              <VText size={skin.type.caption} color={P.muted}>{stat.label}</VText>
            </Card>
          ))}
        </View>
      </View>
      <Card dashed line={P.line} style={styles.invite}>
        <VText size={skin.type.caption} color={P.soft} style={styles.flex}>
          {V.home.inviteLine}
        </VText>
        <VButton variant="ghost" label={V.home.invite} href="/account" />
      </Card>
    </>
  );
};

const VersusHome = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [period, setPeriod] = useState<"week" | "season">("week");
  const standings = useStandings(period);
  const refreshStandings = standings.mutate;
  const home = useHomeData();
  const { counter } = useTickets();

  useFocusEffect(
    useCallback(() => {
      refreshStandings();
    }, [refreshStandings]),
  );

  if (!standings.data) {
    return standings.isLoading ? <VersusLoading /> : <VersusError onRetry={() => standings.mutate()} />;
  }

  const solo = standings.data.today.length <= 1;
  const refresh = () => Promise.all([standings.mutate(), home.refresh()]);

  return (
    <PullToRefresh onRefresh={refresh}>
      <Screen
        padded={false}
        dock={
          <>
            <HomeLinksBlock ink={P.white} muted={P.muted} fill={P.panel} />
          </>
        }
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.between}>
            <View>
              <Kicker>{solo ? V.home.soloKicker : V.home.houseKicker}</Kicker>
              <VText face="display" size={skin.type.headline}>
                {solo ? V.home.soloTitle : V.home.houseTitle}
              </VText>
            </View>
            <View style={styles.topRight}>
              {counter && (
                <View style={styles.pill}>
                  <VText face="bold" size={skin.type.caption}>{V.tickets(counter.balance)}</VText>
                </View>
              )}
              <HomeShortcuts ink={P.white} fill={P.panel} />
            </View>
          </View>
          <SyncNote />
          {solo ? <SoloHome /> : <HouseHome standings={standings.data} period={period} onPick={setPeriod} />}
          {home.dashboard && (
            <Card>
              <View style={styles.between}>
                <VText face="bold" size={skin.type.lead}>
                  {home.range.high ? V.home.listNeeded(home.range.low, home.range.high) : V.home.stocked}
                </VText>
                <VText size={skin.type.caption} color={P.muted}>{V.foodsCount(home.dashboard.foods.total)}</VText>
              </View>
              <ListBar counts={home.counts} />
            </Card>
          )}
        </ScrollView>
      </Screen>
    </PullToRefresh>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    scroll: { gap: s.spacing.stack, paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    between: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: s.spacing.inline },
    topRight: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    pill: { backgroundColor: P.panel, borderRadius: 999, paddingHorizontal: s.spacing.inline, paddingVertical: s.spacing.tight + 2 },
    players: { flexDirection: "row", gap: s.spacing.small },
    player: {
      alignItems: "center",
      backgroundColor: P.panelHigh,
      borderColor: "transparent",
      borderRadius: s.shape.radius - 2,
      borderWidth: s.shape.border,
      flex: 1,
      gap: s.spacing.tight + 2,
      paddingHorizontal: s.spacing.tight,
      paddingVertical: s.spacing.inline,
    },
    section: { gap: s.spacing.inline },
    toggle: { backgroundColor: P.panel, borderRadius: s.spacing.inline + 2, flexDirection: "row", padding: 3 },
    toggleItem: { borderRadius: s.spacing.inline, justifyContent: "center", minHeight: 34, paddingHorizontal: s.spacing.inline + 2 },
    table: { gap: 0, overflow: "hidden", padding: 0 },
    tableHead: { borderTopWidth: 0 },
    tableRow: {
      alignItems: "center",
      borderTopColor: P.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.tight + 2,
      paddingHorizontal: s.spacing.dock - 2,
      paddingVertical: s.spacing.inline,
    },
    cellName: { flex: 1, minWidth: 0 },
    nameCell: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    cell: { textAlign: "right", width: 52 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.tight + 2 },
    vote: { borderRadius: 999, paddingHorizontal: s.spacing.small, paddingVertical: 3 },
    levelBar: { borderRadius: 7, flexDirection: "row", gap: 2, height: 14, overflow: "hidden" },
    legend: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.tight + 2 },
    legendItem: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight + 2, marginRight: s.spacing.tight },
    swatch: { borderRadius: 3, height: 10, width: 10 },
    soloRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.dock - 2 },
    ghostPair: { flexDirection: "row" },
    ghostShift: { marginLeft: -14 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.inline },
    gridCell: { flexBasis: "47%", flexGrow: 1, gap: s.spacing.tight + 2 },
    invite: { alignItems: "center", flexDirection: "row" },
  });

export default VersusHome;
