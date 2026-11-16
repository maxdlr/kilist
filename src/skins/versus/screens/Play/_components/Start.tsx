import V from "@/skins/versus/text";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import { seconds } from "@/skins/versus/hooks/api";
import { RaceGame } from "@/skins/versus/hooks/useRaceGame";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Avatar, Card, Kicker, Screen, VButton, VText } from "@/skins/versus/components";

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

const createStyles = (s: Skin) =>
  StyleSheet.create({
    between: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
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
  });

export default Start;
