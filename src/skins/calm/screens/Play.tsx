import StateFade from "@/components/elements/StateFade/StateFade";
import Press from "@/components/elements/Press";
import goBack from "@/utils/goBack";
import withPressed from "@/utils/withPressed";
import SuggestionStep from "@/components/views/SwipeFoods/_components/SuggestionStep";
import useDailySuggestion from "@/hooks/screens/useDailySuggestion";
import T from "../text";
import ActionPanel from "@/components/elements/ActionPanel";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import SwipeDeck, { SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import useSwipeGame, { SwipeGame } from "@/hooks/screens/useSwipeGame";
import { DrawnMark } from "@/providers/MarkProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  CheckIcon,
  QuestionMarkCircleIcon,
  ShoppingBagIcon,
  SparklesIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";
import {
  QuestionMarkCircleIcon as QuestionMarkCircleSolid,
  ShoppingBagIcon as ShoppingBagSolid,
} from "react-native-heroicons/solid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { calmColors, useCalmColors } from "./colors";
import { CButton, CText, Dot, Screen } from "./parts";
import { CalmLoading, CalmMessage } from "./States";

const HINT_ROUNDS = 3;
const EDGE = 22;

const CheckCard = ({
  food,
  intent,
  showCues,
}: {
  food: FoodType;
  intent: SwipeDirection | null;
  showCues: boolean;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const intentColor: Record<SwipeDirection, string> = { left: C.negative, up: C.textSoft, right: C.positive };
  const hint = intent ? { text: T.intent[intent], color: intentColor[intent] } : null;
  const cues = showCues || intent !== null;

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
        {cues && (
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
            <View style={styles.cueLeft}>
              {intent === "left" ? (
                <ShoppingBagSolid size={EDGE + 4} color={C.text} />
              ) : (
                <ShoppingBagIcon size={EDGE} color={C.ring} strokeWidth={1.6} />
              )}
            </View>
            <View style={styles.cueRight}>
              <CheckIcon size={intent === "right" ? EDGE + 4 : EDGE} color={intent === "right" ? C.positive : C.ring} strokeWidth={intent === "right" ? 3 : 1.6} />
            </View>
            {intent === "up" ? null : (
              <View style={styles.cueUp}>
                <QuestionMarkCircleIcon size={EDGE} color={C.ring} strokeWidth={1.6} />
              </View>
            )}
          </View>
        )}
        <FoodPicture food={food} size={skin.size.icon.card} />
        <View style={styles.cardText}>
          <CText weight="medium" size={skin.type.headline + 2} style={styles.center} numberOfLines={2}>
            {food.name}
          </CText>
          <CText size={skin.type.body - 1} color={C.textSoft} style={styles.center}>
            {T.play.question}
          </CText>
        </View>
      </View>
    </View>
  );
};

const Checking = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const copy = skin.copy.swipe;
  useStatusBarStyle(skin.statusBarOnGround);
  const total = Math.max(1, game.total);
  const pad = (direction: SwipeDirection, label: string, aria: string) => {
    const on = game.intent === direction;
    return (
      <Press
        key={direction}
        accessibilityRole="button"
        scale
        accessibilityLabel={aria}
        onPress={() => game.fling(direction)}
        style={({ pressed }) => [
          styles.pad,
          {
            backgroundColor: on ? C.fill : "transparent",
            borderColor: on ? C.fill : C.fieldLine,
            opacity: pressed ? skin.shape.pressedOpacity : 1,
          },
        ]}
      >
        {direction === "left" &&
          (on ? (
            <ShoppingBagSolid size={20} color={C.onFill} />
          ) : (
            <ShoppingBagIcon size={20} color={C.text} strokeWidth={1.8} />
          ))}
        <CText weight="medium" size={skin.type.body} color={on ? C.onFill : C.text}>
          {label}
        </CText>
        {direction === "right" && <CheckIcon size={20} color={on ? C.onFill : C.positive} strokeWidth={on ? 3 : 2} />}
      </Press>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + skin.spacing.stack }]}>
      <View style={styles.header}>
        <View style={styles.between}>
          <Press accessibilityRole="button" accessibilityLabel={T.close} hitSlop={skin.spacing.small} onPress={goBack} style={withPressed(styles.close)}>
            <XMarkIcon size={skin.size.icon.action} color={C.textSoft} strokeWidth={1.8} />
          </Press>
          <CText size={skin.type.label} color={C.textSoft}>{T.play.position(Math.min(game.position + 1, game.total), game.total)}</CText>
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
          renderSheet={(food, depth) => (
            <CheckCard food={food} intent={depth === 0 ? game.intent : null} showCues={depth === 0 && game.level <= HINT_ROUNDS} />
          )}
        />
      </View>
      <View style={[styles.pads, { paddingBottom: skin.spacing.stack }]}>
        {pad("left", copy.out, T.play.ariaOut)}
        <Press accessibilityRole="button" accessibilityLabel={T.intent.up} onPress={() => game.fling("up")} style={withPressed(styles.unsure)}>
          {game.intent === "up" ? (
            <QuestionMarkCircleSolid size={22} color={C.text} />
          ) : (
            <QuestionMarkCircleIcon size={22} color={C.textSoft} strokeWidth={1.8} />
          )}
          <CText size={skin.type.caption} color={game.intent === "up" ? C.text : C.textSoft}>{copy.unsure}</CText>
        </Press>
        {pad("right", copy.inStock, T.play.ariaIn)}
      </View>
      <ActionPanel request={game.removeRequest} onClose={game.cancelRemove} />
    </View>
  );
};

const Done = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const C = useCalmColors();
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
          <DrawnMark kind="done" color={C.positive} />
          <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">{T.done}</CText>
          <CText size={skin.type.body} color={C.textSoft}>
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
          <CText size={skin.type.label} color={C.textSoft} style={styles.flex}>{T.play.points}</CText>
          <CText weight="medium" size={skin.type.label + 1}>
            {game.balance !== undefined ? T.play.pointsTotal(game.earned, game.balance) : `+${game.earned}`}
          </CText>
        </View>
      </ScrollView>
    </Screen>
  );
};

const Sorted = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;

  return (
    <Screen
      dock={
        <CButton
          label={copy.tomorrowAction}
          href="/shop"
          icon={(color) => <ShoppingBagIcon size={20} color={color} strokeWidth={1.8} />}
        />
      }
    >
      <View style={styles.sorted}>
        <CheckIcon size={44} color={C.positive} strokeWidth={2.4} />
        <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
          {T.play.sortedToday}
        </CText>
      </View>
      <View accessible accessibilityLabel={`${T.play.replayTitle} ${T.play.replayLine}`} style={styles.replay}>
        <View style={styles.replayHead}>
          <ArrowPathIcon size={skin.size.icon.action} color={C.text} strokeWidth={1.8} />
          <CText weight="medium" size={skin.type.body}>{T.play.replayTitle}</CText>
        </View>
        <View style={styles.replayFacts}>
          <View style={styles.fact}>
            <ArrowsRightLeftIcon size={15} color={C.textSoft} strokeWidth={1.8} />
            <CText size={skin.type.label} color={C.textSoft}>{T.play.replayReplaces}</CText>
          </View>
          <View style={styles.fact}>
            <SparklesIcon size={15} color={C.textSoft} strokeWidth={1.8} />
            <CText size={skin.type.label} color={C.textSoft}>{T.play.replayNoPoints}</CText>
          </View>
        </View>
        <CButton variant="secondary" label={T.play.replay} onPress={game.replay} />
      </View>
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

  const body = () => {
    if (suggestion.item) return <SuggestionStep suggestion={suggestion} />;

    switch (screen) {
      case "play":
        return <Checking game={game} />;
      case "done":
        return <Done game={game} />;
      case "closed":
        return (
          <Sorted game={game} />
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

  return <StateFade stateKey={suggestion.item ? "suggestion" : screen === "start" ? "loading" : screen}>{body()}</StateFade>;
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    center: { textAlign: "center" },
    between: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
    header: { gap: s.spacing.dock - 2, paddingHorizontal: s.spacing.gutter, paddingBottom: s.spacing.small },
    close: { justifyContent: "center", minHeight: s.size.button.xs },
    track: { backgroundColor: C.line, height: 2 },
    fill: { backgroundColor: C.fill, height: "100%" },
    cardSlot: { flex: 1, paddingHorizontal: s.spacing.gutter, paddingVertical: s.spacing.stack },
    card: {
      alignItems: "center",
      backgroundColor: C.card,
      borderColor: C.line,
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
      flexDirection: "row",
      gap: s.spacing.small,
    },
    unsure: { alignItems: "center", justifyContent: "center", minHeight: s.size.button.xs, paddingHorizontal: s.spacing.small },
    cueLeft: { bottom: 0, justifyContent: "center", left: s.spacing.inline, position: "absolute", top: 0 },
    cueRight: { bottom: 0, justifyContent: "center", position: "absolute", right: s.spacing.inline, top: 0 },
    cueUp: { alignItems: "center", left: 0, position: "absolute", right: 0, top: s.spacing.gutter + s.spacing.section },
    sorted: { flex: 1, gap: s.spacing.stack, justifyContent: "center" },
    replay: {
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.shape.radius + 2,
      borderWidth: s.shape.border,
      gap: s.spacing.inline,
      padding: s.spacing.stack,
    },
    replayHead: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    replayFacts: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.stack },
    fact: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight + 2 },
    doneContent: { flexGrow: 1, gap: s.spacing.section, justifyContent: "center" },
    doneHead: { gap: s.spacing.small },
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.stripe,
    },
    points: {
      alignItems: "baseline",
      borderColor: C.line,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.dock - 2,
    },
  });

export default CalmPlay;
