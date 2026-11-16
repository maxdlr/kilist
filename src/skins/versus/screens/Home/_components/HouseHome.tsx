import V from "@/skins/versus/text";
import { seconds, Standings } from "@/skins/versus/hooks/api";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Avatar, Card, memberColor, VText, WORD } from "@/skins/versus/components";
import PeriodToggle from "./PeriodToggle";

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

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    between: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: s.spacing.inline },
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
  });

export default HouseHome;
