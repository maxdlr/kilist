import StateFade from "@/components/elements/StateFade/StateFade";
import SuggestionStep from "@/components/views/SwipeFoods/_components/SuggestionStep";
import useDailySuggestion from "@/hooks/screens/useDailySuggestion";
import V from "../text";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import SwipeDeck, { SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import { clock, seconds } from "@/hooks/versus/api";
import useRaceGame, { RaceGame } from "@/hooks/versus/useRaceGame";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { versusPalette as P } from "..";
import { Avatar, Card, Chip, Kicker, memberColor, Screen, VButton, VText, WORD } from "./parts";
import { VersusEmpty, VersusLoading } from "./States";

const FoodCard = ({ food, position, total }: { food: FoodType; position: number; total: number }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const [hero, setHero] = useState(0);

  return (
    <View style={styles.cardSlot}>
      <View style={[styles.foodCard, { boxShadow: `0 6px 0 ${P.cardShadow}` }]}>
        <View style={styles.between}>
          <VText size={skin.type.caption} color={P.cardInk}>{V.play.position(position + 1, total)}</VText>
          <VText size={skin.type.caption} color={P.cardInk}>{V.play.cardTickets}</VText>
        </View>
        <View
          style={styles.hero}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setHero(Math.floor(Math.min(width * 0.8, height * 0.9)));
          }}
        >
          {hero > 0 && <FoodPicture food={food} size={hero} />}
        </View>
        <View style={styles.between}>
          <VText face="bold" size={skin.type.display.md} color={P.ink} numberOfLines={1} adjustsFontSizeToFit style={styles.flex}>
            {food.name}
          </VText>
          <Chip label={skin.copy.levels[level]} fill={skin.colors.levels[level]} />
        </View>
      </View>
    </View>
  );
};

const Lane = ({ label, color, progress, ghost = false }: { label: string; color: string; progress: number; ghost?: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={styles.lane}>
      <VText face="bold" size={skin.type.caption} color={color} style={styles.laneLabel} numberOfLines={1}>
        {label}
      </VText>
      <View style={[styles.track, ghost && { backgroundColor: "transparent", borderColor: color, borderStyle: "dashed", borderWidth: skin.shape.border }]}>
        <View style={[styles.trackFill, { backgroundColor: color, opacity: ghost ? 0.4 : 1, width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const RevealCard = ({ game }: { game: RaceGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const reveal = game.reveal!;
  const members = game.race?.members ?? [];

  if (game.isSolo) {
    const previous = reveal.previous;
    if (!previous) return null;
    const same = previous.answer === reveal.mine;
    const color = same ? P.agree : P.clash;
    return (
      <View accessibilityLiveRegion="polite" style={[styles.reveal, { borderColor: color }]}>
        <View style={styles.between}>
          <VText face="display" size={skin.type.title - 2} color={color}>
            {same ? V.play.same : V.play.changed}
          </VText>
        </View>
        <View style={styles.chips}>
          <Chip label={V.play.today(WORD[reveal.mine])} fill={P.you} />
          <Chip label={`${previous.day}: ${WORD[previous.answer]}`} fill={P.you} dashed />
        </View>
        <VText size={skin.type.caption} color={P.soft}>
          {same ? V.play.steady : V.play.moved}
        </VText>
      </View>
    );
  }

  if (reveal.mates.length === 0) return null;
  const agree = reveal.mates.every((mate) => mate.answer === reveal.mine);
  const color = agree ? P.agree : P.clash;
  const verdict = reveal.verdict;

  return (
    <View accessibilityLiveRegion="polite" style={[styles.reveal, { borderColor: color }]}>
      <View style={styles.between}>
        <VText face="display" size={skin.type.headline} color={color}>
          {agree ? V.play.agreed : V.play.clash}
        </VText>
        <VText face="pixel" size={(skin.type.caption - 1) - 4} color={P.muted}>
          {reveal.food.name.toUpperCase()}
        </VText>
      </View>
      <View style={styles.chips}>
        <Chip label={V.said(V.you, WORD[reveal.mine])} fill={P.you} />
        {reveal.mates.map((mate) => (
          <Chip key={mate.userId} label={`${mate.username}: ${WORD[mate.answer]}`} fill={memberColor(members, user?.id, mate.userId)} />
        ))}
      </View>
      {verdict && (
        <VText size={skin.type.caption} color={P.soft}>
          {verdict.result === "tied"
            ? V.play.tiedSoFar
            : V.play.verdictSoFar(verdict.result === "needed")}
        </VText>
      )}
    </View>
  );
};

const Arena = ({ game }: { game: RaceGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const target = game.target;
  const total = Math.max(1, game.total);
  const targetAtHere = game.targetAt(game.position);
  const delta = targetAtHere === null ? null : game.elapsed - targetAtHere;
  const rivalName = target?.kind === "best" ? V.play.yourBestLower : target?.username;
  const deltaLabel =
    !target || game.position === 0 || delta === null
      ? target
        ? `${target.kind === "best" ? V.play.best : target.username}: ${seconds(target.totalMs)}`
        : V.play.settingPace
      : delta <= 0
        ? V.play.ahead(seconds(-delta), rivalName ?? "")
        : V.play.behind(seconds(delta), rivalName ?? "");
  const pad = (direction: SwipeDirection, label: string, aria: string) => {
    const active = game.intent === direction;
    const primary = direction !== "up";
    return (
      <VButton
        key={direction}
        flex={primary ? 1.2 : 1}
        label={label}
        accessibilityLabel={aria}
        variant={primary || active ? "primary" : "secondary"}
        scale={active ? 1.06 : 1}
        onPress={() => game.fling(direction)}
      />
    );
  };

  return (
    <Screen
      padded={false}
      dock={
        <View style={styles.pads}>
          {pad("left", copy.out, V.play.ariaOut)}
          {pad("up", copy.unsure, V.play.ariaUnsure)}
          {pad("right", copy.inStock, V.play.ariaIn)}
        </View>
      }
    >
      <View style={styles.hud}>
        <View style={styles.between}>
          <VText face="pixel" size={skin.type.title - 4}>{clock(game.elapsed)}</VText>
          <VText face="bold" size={skin.type.label} color={delta !== null && delta <= 0 && game.position > 0 ? P.agree : P.muted}>
            {deltaLabel}
          </VText>
        </View>
        <Lane label={V.you} color={P.you} progress={game.position / total} />
        {target && (
          <Lane
            label={target.kind === "best" ? V.play.best : target.username}
            color={target.kind === "best" ? P.you : P.mates[0]!}
            progress={game.ghostDone / total}
            ghost={target.kind === "best"}
          />
        )}
      </View>
      <View style={styles.flex}>
        <SwipeDeck
          items={game.foods}
          keyOf={(food) => food.id}
          allowUp
          background="transparent"
          stamps={{ right: copy.stampIn, left: copy.stampOut, up: copy.stampUnsure }}
          flingRef={game.flingRef}
          onIntent={game.setIntent}
          onSwipe={game.handleSwipe}
          renderSheet={(food, depth) => <FoodCard food={food} position={game.position + depth} total={game.total} />}
        />
        {game.reveal && (
          <View pointerEvents="none" style={styles.revealWrap}>
            <RevealCard game={game} />
          </View>
        )}
      </View>
    </Screen>
  );
};

const Start = ({ game }: { game: RaceGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const race = game.race!;
  const target = game.target;
  const first = !game.isSolo && !target;

  return (
    <Screen dock={<VButton big label={game.isSolo ? V.home.raceBest : first ? V.play.setPace : V.play.takeOn(target?.username ?? "")} onPress={game.begin} />}>
      <View style={styles.between}>
        <Kicker>{`${game.isSolo ? V.play.soloRace : V.play.todaysRace} · ${V.day(race.level)}`}</Kicker>
        {game.balance !== undefined && <VText face="bold" size={skin.type.label}>{V.tickets(game.balance)}</VText>}
      </View>
      <View style={styles.versus}>
        <Card line={P.you} style={styles.fighter}>
          <Avatar name={V.you} color={P.you} size={skin.size.button.xl} />
          <VText face="bold" size={skin.type.lead}>{game.isSolo ? V.play.youToday : V.you}</VText>
          <VText size={skin.type.caption} color={P.muted}>{V.play.notPlayed}</VText>
        </Card>
        <VText face="display" size={skin.type.display.sm}>VS</VText>
        <Card line={game.isSolo ? P.you : first ? P.line : P.mates[0]} dashed={game.isSolo} style={styles.fighter}>
          <Avatar
            name={game.isSolo ? V.you : first ? "?" : target?.username ?? "?"}
            color={game.isSolo ? P.you : first ? P.panelHigh : P.mates[0]!}
            size={skin.size.button.xl}
            ghost={game.isSolo}
          />
          <VText face="bold" size={skin.type.lead} numberOfLines={1}>
            {game.isSolo ? V.play.yourBest : first ? V.play.yourRivals : target?.username}
          </VText>
          <VText size={skin.type.caption} color={P.muted}>
            {game.isSolo ? (target ? seconds(target.totalMs) : V.play.noBest) : first ? V.play.notPlayed : V.play.played(seconds(target?.totalMs))}
          </VText>
        </Card>
      </View>
      <Card>
        <VText face="bold" size={skin.type.lead}>
          {game.isSolo ? V.play.beatGhost : first ? V.play.firstToday : skin.copy.swipe.startTitle}
        </VText>
        <VText size={skin.type.label} color={P.soft}>
          {game.isSolo
            ? V.play.soloIntro
            : first
              ? V.play.firstIntro
              : V.play.raceIntro}
        </VText>
      </Card>
      <View style={styles.lineup}>
        {race.foods.map((food) => (
          <View key={food.id} style={styles.lineupCell}>
            <FoodPicture food={food} size={skin.size.icon.row - 8} />
          </View>
        ))}
      </View>
    </Screen>
  );
};

const Results = ({ game }: { game: RaceGame }) => {
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

const Closed = ({ game }: { game: RaceGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const race = game.race!;
  const rows = race.members
    .map((member) => ({ member, run: race.runs.find((run) => run.userId === member.id && run.finished) }))
    .sort((a, b) => (a.run?.totalMs ?? Infinity) - (b.run?.totalMs ?? Infinity));
  const waiting = rows.filter((row) => !row.run);

  return (
    <Screen dock={<VButton big label={V.play.goShopping} href="/shop" />}>
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

const VersusPlay = () => {
  const game = useRaceGame();
  const suggestion = useDailySuggestion(game.screen === "done");

  const body = () => {
    if (suggestion.item) return <SuggestionStep suggestion={suggestion} />;

    switch (game.screen) {
      case "loading":
        return <VersusLoading />;
      case "play":
        return <Arena game={game} />;
      case "done":
        return <Results game={game} />;
      case "closed":
        return <Closed game={game} />;
      case "empty":
        return (
          <VersusEmpty
            kicker={V.play.todaysRace}
            title={V.play.nothingTitle}
            line={V.play.nothingLine}
            action={{ label: V.home.checkInventory, onPress: () => router.navigate("/inventory") }}
          />
        );
      default:
        return <Start game={game} />;
    }
  };

  return <StateFade stateKey={suggestion.item ? "suggestion" : game.screen}>{body()}</StateFade>;
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
    cardSlot: { flex: 1, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter, paddingTop: s.spacing.small },
    foodCard: {
      backgroundColor: P.white,
      borderRadius: s.shape.radius + s.spacing.inline,
      flex: 1,
      gap: s.spacing.small,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.stack,
    },
    hero: { alignItems: "center", flex: 1, justifyContent: "center", minHeight: 0 },
    hud: { gap: s.spacing.small, paddingBottom: s.spacing.tight, paddingHorizontal: s.spacing.gutter },
    lane: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    laneLabel: { width: 52 },
    track: { backgroundColor: P.panelHigh, borderRadius: 6, flex: 1, height: 12, overflow: "hidden" },
    trackFill: { borderRadius: 6, height: "100%" },
    revealWrap: { left: s.spacing.gutter + s.spacing.small, position: "absolute", right: s.spacing.gutter + s.spacing.small, top: "30%" },
    reveal: {
      backgroundColor: P.ground,
      borderRadius: s.shape.radius + s.spacing.hair,
      borderWidth: s.shape.border + 1,
      boxShadow: `0 6px 0 ${P.cardShadow}`,
      gap: s.spacing.inline,
      padding: s.spacing.dock - 2,
    },
    pads: { flexDirection: "row", gap: s.spacing.inline },
    versus: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    fighter: { alignItems: "center", flex: 1, gap: s.spacing.small },
    lineup: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    lineupCell: {
      alignItems: "center",
      aspectRatio: 1,
      backgroundColor: P.white,
      borderRadius: s.spacing.dock - 2,
      flexBasis: "17%",
      flexGrow: 1,
      justifyContent: "center",
    },
    clashRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline + 2, padding: s.spacing.inline + 2 },
    clashBody: { gap: s.spacing.tight + 2 },
    table: { gap: 0, overflow: "hidden", padding: 0 },
    ladderRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline + 2, paddingHorizontal: s.spacing.stack, paddingVertical: s.spacing.dock - 2 },
    ladderBorder: { borderTopColor: P.line, borderTopWidth: s.shape.divider },
  });

export default VersusPlay;
