import V from "@/skins/versus/text";
import SwipeDeck, { SwipeDirection } from "@/components/elements/SwipeDeck";
import { clock, seconds } from "@/skins/versus/hooks/api";
import { RaceGame } from "@/skins/versus/hooks/useRaceGame";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Screen, VButton, VText } from "@/skins/versus/components";
import FoodCard from "./FoodCard";
import Lane from "./Lane";
import RevealCard from "./RevealCard";

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

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    between: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline, justifyContent: "space-between" },
    hud: { gap: s.spacing.small, paddingBottom: s.spacing.tight, paddingHorizontal: s.spacing.gutter },
    revealWrap: { left: s.spacing.gutter + s.spacing.small, position: "absolute", right: s.spacing.gutter + s.spacing.small, top: "30%" },
    pads: { flexDirection: "row", gap: s.spacing.inline },
  });

export default Arena;
