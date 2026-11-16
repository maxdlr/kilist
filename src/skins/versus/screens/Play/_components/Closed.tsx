import V from "@/skins/versus/text";
import { seconds } from "@/skins/versus/hooks/api";
import { RaceGame } from "@/skins/versus/hooks/useRaceGame";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Avatar, Card, Kicker, memberColor, Screen, VButton, VText } from "@/skins/versus/components";
import PlayAgainButton from "./PlayAgainButton";

const Closed = ({ game, onPlayAgain }: { game: RaceGame; onPlayAgain: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const race = game.race!;
  const rows = race.members
    .map((member) => ({ member, run: race.runs.find((run) => run.userId === member.id && run.finished) }))
    .sort((a, b) => (a.run?.totalMs ?? Infinity) - (b.run?.totalMs ?? Infinity));
  const waiting = rows.filter((row) => !row.run);

  return (
    <Screen
      dock={
        <>
          <VButton big label={V.play.goShopping} href="/shop" />
          <PlayAgainButton onPress={onPlayAgain} />
        </>
      }
    >
      <View>
        <Kicker>{`${V.play.todaysRace} · ${V.day(race.level)}`}</Kicker>
        <VText face="display" size={skin.type.display.sm}>{V.play.playedToday}</VText>
      </View>
      <Card style={styles.table}>
        {rows.map(({ member, run }, index) => (
          <View key={member.id} style={[styles.ladderRow, index > 0 && styles.ladderBorder]}>
            <VText face="pixel" size={(skin.type.caption - 1) - 2} color={P.muted}>{run ? String(index + 1) : "–"}</VText>
            <Avatar name={member.username} color={memberColor(race.members, user?.id, member.id)} size={skin.size.button.xs - 8} dim={!run} />
            <VText face="bold" size={skin.type.lead} style={styles.flex} numberOfLines={1}>
              {member.id === user?.id ? V.you : member.username}
            </VText>
            <VText face="pixel" size={(skin.type.caption - 1) - 2} color={run ? P.white : P.muted}>
              {run ? seconds(run.totalMs).toUpperCase() : V.home.notYet}
            </VText>
          </View>
        ))}
      </Card>
      {waiting.length > 0 && (
        <VText size={skin.type.label} color={P.soft}>
          {V.play.waiting(waiting.map((row) => row.member.username))}
        </VText>
      )}
      <VText size={skin.type.label} color={P.soft}>
        {V.play.nextRace}
      </VText>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    table: { gap: 0, overflow: "hidden", padding: 0 },
    ladderRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline + 2, paddingHorizontal: s.spacing.stack, paddingVertical: s.spacing.dock - 2 },
    ladderBorder: { borderTopColor: P.line, borderTopWidth: s.shape.divider },
  });

export default Closed;
