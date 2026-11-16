import V from "@/skins/versus/text";
import SwipeDeck, { SwipeDirection } from "@/components/elements/SwipeDeck";
import { seconds } from "@/skins/versus/hooks/api";
import useSwipeGame from "@/hooks/screens/useSwipeGame";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Screen, VButton, VText } from "@/skins/versus/components";
import { VersusLoading } from "@/skins/versus/screens/States";
import FoodCard from "./FoodCard";

const ExtraRound = ({ onLeave }: { onLeave: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const game = useSwipeGame();
  const [ready, setReady] = useState(false);
  const asked = useRef(false);
  const { playAgain } = game;

  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    playAgain().then((started) => (started ? setReady(true) : onLeave()));
  }, [playAgain, onLeave]);

  if (!ready || game.screen === "loading") return <VersusLoading />;

  if (game.screen === "done") {
    return (
      <Screen
        dock={
          <>
            <VButton big label={V.play.goShopping} href="/shop" />
            <VButton variant="ghost" label={copy.overAgain} onPress={onLeave} />
          </>
        }
      >
        <View style={styles.centered}>
          <VText face="display" size={skin.type.display.lg} style={styles.centerText}>
            {copy.overTitle}
          </VText>
          <VText size={skin.type.body} color={P.soft} style={styles.centerText}>
            {V.play.time(seconds(game.seconds * 1000), game.earned)}
          </VText>
        </View>
      </Screen>
    );
  }

  const pad = (direction: SwipeDirection, label: string, aria: string) => (
    <VButton
      key={direction}
      flex={direction !== "up" ? 1.2 : 1}
      label={label}
      accessibilityLabel={aria}
      variant={direction !== "up" || game.intent === direction ? "primary" : "secondary"}
      scale={game.intent === direction ? 1.06 : 1}
      onPress={() => game.fling(direction)}
    />
  );

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
      </View>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    centered: { alignItems: "center", gap: s.spacing.tight },
    centerText: { textAlign: "center" },
    pads: { flexDirection: "row", gap: s.spacing.inline },
  });

export default ExtraRound;
