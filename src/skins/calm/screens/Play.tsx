import goBack from "@/utils/goBack";
import withPressed from "@/utils/withPressed";
import SuggestionStep from "@/components/views/SwipeFoods/_components/SuggestionStep";
import useDailySuggestion from "@/hooks/screens/useDailySuggestion";
import T from "../text";
import ActionPanel from "@/components/elements/ActionPanel";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import SwipeDeck, { SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import useSwipeGame, { SwipeGame } from "@/hooks/screens/useSwipeGame";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { calmPalette as C } from "..";
import { CButton, CText, Dot, Screen } from "./parts";
import { CalmLoading, CalmMessage } from "./States";

const INTENT_COLOR: Record<SwipeDirection, string> = {
  left: C.needIt,
  up: C.soft,
  right: C.haveIt,
};

const CheckCard = ({ food, intent }: { food: FoodType; intent: SwipeDirection | null }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const hint = intent ? { text: T.intent[intent], color: INTENT_COLOR[intent] } : null;

  return (
    <View style={styles.cardSlot}>
      <View style={styles.card}>
        <View style={styles.hint}>
          {hint && (
            <CText weight="medium" size={skin.type.label} color={hint.color}>
              {hint.text}
            </CText>
          )}
        </View>
        <FoodPicture food={food} size={skin.size.icon.card} />
        <View style={styles.cardText}>
          <CText weight="medium" size={skin.type.headline + 2} style={styles.center} numberOfLines={2}>
            {food.name}
          </CText>
          <CText size={skin.type.body - 1} color={C.soft} style={styles.center}>
            {T.play.question}
          </CText>
        </View>
      </View>
    </View>
  );
};

const Checking = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const copy = skin.copy.swipe;
  useStatusBarStyle(skin.statusBarOnGround);
  const total = Math.max(1, game.total);
  const pad = (direction: SwipeDirection, label: string, aria: string) => {
    const on = game.intent === direction;
    return (
      <Pressable
        key={direction}
        accessibilityRole="button"
        accessibilityLabel={aria}
        onPress={() => game.fling(direction)}
        style={({ pressed }) => [
          styles.pad,
          {
            backgroundColor: on ? C.ink : "transparent",
            borderColor: on ? C.ink : C.field,
            opacity: pressed ? skin.shape.pressedOpacity : 1,
          },
        ]}
      >
        <CText weight="medium" size={skin.type.body} color={on ? C.ground : C.ink}>
          {label}
        </CText>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + skin.spacing.stack }]}>
      <View style={styles.header}>
        <View style={styles.between}>
          <Pressable accessibilityRole="button" onPress={goBack} style={withPressed(styles.close)}>
            <CText size={skin.type.label + 1} color={C.soft}>{T.close}</CText>
          </Pressable>
          <CText size={skin.type.label} color={C.soft}>{T.play.position(Math.min(game.position + 1, game.total), game.total)}</CText>
        </View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: game.position }} style={styles.track}>
          <View style={[styles.fill, { width: `${(game.position / total) * 100}%` }]} />
        </View>
      </View>
      <View style={styles.flex}>
        <SwipeDeck
          items={game.foods}
          keyOf={(food) => food.id}
          allowUp
          background="transparent"
          stamps={{}}
          flingRef={game.flingRef}
          onIntent={game.setIntent}
          onSwipe={game.handleSwipe}
          onLongPress={game.askRemove}
          renderSheet={(food, depth) => <CheckCard food={food} intent={depth === 0 ? game.intent : null} />}
        />
      </View>
      <View style={[styles.pads, { paddingBottom: skin.spacing.stack }]}>
        {pad("left", copy.out, T.play.ariaOut)}
        <Pressable accessibilityRole="button" accessibilityLabel={T.intent.up} onPress={() => game.fling("up")} style={withPressed(styles.unsure)}>
          <CText size={skin.type.label} color={game.intent === "up" ? C.ink : C.soft}>{copy.unsure}</CText>
        </Pressable>
        {pad("right", copy.inStock, T.play.ariaIn)}
      </View>
      <ActionPanel request={game.removeRequest} onClose={game.cancelRemove} />
    </View>
  );
};

const Done = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const added = game.outFoods;
  const close = () => {
    game.reset();
    goBack();
  };

  return (
    <Screen
      dock={
        <>
          <CButton label={T.openList} href="/shop" />
          <CButton variant="text" label={T.close} onPress={close} />
        </>
      }
    >
      <ScrollView contentContainerStyle={styles.doneContent}>
        <View style={styles.doneHead}>
          <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">{T.done}</CText>
          <CText size={skin.type.body} color={C.soft}>
            {added.length
              ? T.play.added(added.length)
              : T.play.nothingNew}
          </CText>
        </View>
        {added.length > 0 && (
          <View>
            {added.map((food) => (
              <View key={food.id} style={styles.row}>
                <Dot color={skin.colors.levels[1]} />
                <CText size={skin.type.body}>{food.name}</CText>
              </View>
            ))}
          </View>
        )}
        <View style={styles.points}>
          <CText size={skin.type.label} color={C.soft} style={styles.flex}>{T.play.points}</CText>
          <CText weight="medium" size={skin.type.label + 1}>
            {game.balance !== undefined ? T.play.pointsTotal(game.earned, game.balance) : `+${game.earned}`}
          </CText>
        </View>
      </ScrollView>
    </Screen>
  );
};

const CalmPlay = () => {
  const skin = useSkin();
  const game = useSwipeGame();
  const copy = skin.copy.swipe;
  const { screen, begin } = game;

  const suggestion = useDailySuggestion(screen === "done" && !game.isReplay);

  useEffect(() => {
    if (screen === "start") begin();
  }, [screen, begin]);

  if (suggestion.item) return <SuggestionStep suggestion={suggestion} />;

  switch (screen) {
    case "play":
      return <Checking game={game} />;
    case "done":
      return <Done game={game} />;
    case "closed":
      return (
        <CalmMessage
          title={copy.tomorrowTitle}
          line={`${copy.tomorrowLine} ${T.play.replayLine}`}
          dock={
            <>
              <CButton variant="secondary" label={T.play.replay} onPress={game.replay} />
              <CButton variant="text" label={copy.tomorrowAction} href="/shop" />
            </>
          }
        />
      );
    case "empty":
      return (
        <CalmMessage
          title={copy.emptyTitle}
          line={copy.emptyLine}
          dock={<CButton variant="text" label={T.browseInventory} href="/inventory" />}
        />
      );
    default:
      return <CalmLoading />;
  }
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    center: { textAlign: "center" },
    between: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
    header: { gap: s.spacing.dock - 2, paddingHorizontal: s.spacing.gutter, paddingBottom: s.spacing.small },
    close: { justifyContent: "center", minHeight: s.size.button.xs },
    track: { backgroundColor: C.hairline, height: 2 },
    fill: { backgroundColor: C.ink, height: "100%" },
    cardSlot: { flex: 1, paddingHorizontal: s.spacing.gutter, paddingVertical: s.spacing.stack },
    card: {
      alignItems: "center",
      backgroundColor: C.white,
      borderColor: C.hairline,
      borderRadius: s.shape.radius + 6,
      borderWidth: s.shape.border,
      flex: 1,
      gap: s.spacing.section - 4,
      justifyContent: "center",
      padding: s.spacing.gutter,
    },
    hint: { alignItems: "center", height: s.spacing.section, left: 0, position: "absolute", right: 0, top: s.spacing.gutter },
    cardText: { alignItems: "center", gap: s.spacing.tight + 2 },
    pads: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline - 2, paddingHorizontal: s.spacing.gutter },
    pad: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flex: 1,
      height: s.size.button.lg,
      justifyContent: "center",
    },
    unsure: { justifyContent: "center", minHeight: s.size.button.xs, paddingHorizontal: s.spacing.small },
    doneContent: { flexGrow: 1, gap: s.spacing.section, justifyContent: "center" },
    doneHead: { gap: s.spacing.small },
    row: {
      alignItems: "center",
      borderTopColor: C.hairline,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.stripe,
    },
    points: {
      alignItems: "baseline",
      borderColor: C.hairline,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.dock - 2,
    },
  });

export default CalmPlay;
