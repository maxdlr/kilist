import V from "@/skins/versus/text";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import { seconds } from "@/skins/versus/hooks/api";
import { RaceGame } from "@/skins/versus/hooks/useRaceGame";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ScrollView, StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Card, Chip, Kicker, memberColor, Screen, VButton, VText, WORD } from "@/skins/versus/components";
import PlayAgainButton from "./PlayAgainButton";

const Results = ({ game, onPlayAgain }: { game: RaceGame; onPlayAgain: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const members = game.race?.members ?? [];
  const mine = game.myRun?.totalMs ?? game.elapsed;
  const target = game.target;
  const win = !target || mine <= target.totalMs;
  const rival = target?.kind === "best" ? V.play.yourBestLower : target?.username;
  const toBuy = (game.myRun?.answers ?? []).filter((answer) => answer.answer === "out").length;

  return (
    <Screen
      padded={false}
      dock={
        <>
          <VButton big label={V.play.goShoppingCount(toBuy)} href="/shop" />
          <PlayAgainButton onPress={onPlayAgain} />
          <VButton variant="ghost" label={V.play.doneToday} onPress={game.reset} />
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.centered}>
          <Kicker>{game.isSolo ? V.play.soloRace : V.play.swipeRace}</Kicker>
          <VText face="display" size={skin.type.display.lg} color={win ? P.you : P.mates[0]} style={styles.centerText}>
            {game.isSolo ? (win ? V.play.newBest : V.play.bestStands) : !target ? V.play.paceSet : win ? V.play.youWin : V.play.wins(target.username)}
          </VText>
          <VText size={skin.type.body} color={P.soft} style={styles.centerText}>
            {target ? V.play.gap(seconds(Math.abs(target.totalMs - mine)), win, rival ?? "", game.earned) : V.play.time(seconds(mine), game.earned)}
          </VText>
        </View>
        <Card>
          <View style={styles.between}>
            <VText size={skin.type.label} color={P.soft}>{V.play.yourTime}</VText>
            <VText face="bold" size={skin.type.label}>{seconds(mine)}</VText>
          </View>
          {target && (
            <View style={styles.between}>
              <VText size={skin.type.label} color={P.soft}>{target.kind === "best" ? V.play.yourBest : target.username}</VText>
              <VText size={skin.type.label}>{seconds(target.totalMs)}</VText>
            </View>
          )}
        </Card>
        {game.isSolo ? (
          game.changes.length > 0 && (
            <View style={styles.section}>
              <VText face="bold" size={skin.type.lead}>{V.play.changed}</VText>
              {game.changes.map((change) => (
                <Card key={change.food.id} style={styles.clashRow}>
                  <FoodPicture food={change.food} size={skin.size.icon.row} />
                  <View style={styles.flex}>
                    <VText face="bold" size={skin.type.body}>{change.food.name}</VText>
                    <VText size={skin.type.caption} color={P.soft}>
                      {V.play.changeLine(change.previous!.day, WORD[change.previous!.answer].toLowerCase(), WORD[change.mine!].toLowerCase())}
                    </VText>
                  </View>
                </Card>
              ))}
            </View>
          )
        ) : (
          game.clashes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.between}>
                <VText face="bold" size={skin.type.lead}>{V.play.whereClashed}</VText>
                <VText size={skin.type.caption} color={P.muted}>{V.play.houseDecides}</VText>
              </View>
              {game.clashes.map((clash) => (
                <Card key={clash.food.id} style={styles.clashRow}>
                  <FoodPicture food={clash.food} size={skin.size.icon.row} />
                  <View style={[styles.flex, styles.clashBody]}>
                    <View style={styles.between}>
                      <VText face="bold" size={skin.type.body}>{clash.food.name}</VText>
                      {clash.verdict && (
                        <VText
                          face="bold"
                          size={skin.type.caption}
                          color={clash.verdict.result === "needed" ? P.buy : clash.verdict.result === "stocked" ? P.agree : P.tie}
                        >
                          {clash.verdict.result === "tied"
                            ? V.play.tied
                            : `${clash.verdict.result === "needed" ? V.play.needed : V.play.inStock} · ${Math.max(clash.verdict.out, clash.verdict.in)}–${Math.min(clash.verdict.out, clash.verdict.in)}`}
                        </VText>
                      )}
                    </View>
                    <View style={styles.chips}>
                      <Chip label={V.said(V.you, WORD[clash.mine])} fill={P.you} />
                      {clash.votes.map((vote) => (
                        <Chip
                          key={vote.run.userId}
                          label={V.said(vote.run.username, WORD[vote.answer])}
                          fill={memberColor(members, user?.id, vote.run.userId)}
                        />
                      ))}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    scroll: { gap: s.spacing.stack, paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    between: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    centered: { alignItems: "center", gap: s.spacing.tight },
    centerText: { textAlign: "center" },
    section: { gap: s.spacing.inline },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.tight + 2 },
    clashRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline + 2, padding: s.spacing.inline + 2 },
    clashBody: { gap: s.spacing.tight + 2 },
  });

export default Results;
