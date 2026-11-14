import ActionPanel from "@/components/elements/ActionPanel";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import Press from "@/components/elements/Press";
import StateFade from "@/components/elements/StateFade/StateFade";
import SwipeDeck, {
  SwipeDirection,
} from "@/components/elements/SwipeDeck/SwipeDeck";
import SuggestionStep from "@/components/views/SwipeFoods/_components/SuggestionStep";
import useDailySuggestion from "@/hooks/screens/useDailySuggestion";
import useSwipeGame, { SwipeGame } from "@/hooks/screens/useSwipeGame";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { DrawnMark } from "@/providers/MarkProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import goBack from "@/utils/goBack";
import withPressed from "@/utils/withPressed";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ArrowPathIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "react-native-heroicons/outline";
import { InformationCircleIcon as InformationCircleSolid } from "react-native-heroicons/solid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import T from "../text";
import { calmColors, useCalmColors } from "./colors";
import { CardPads, CButton, CText, Dot, Screen } from "./parts";
import { CalmLoading, CalmMessage } from "./States";

const IDLE_MS = 3000;

const CheckCard = ({
  food,
  intent,
  labels,
  onFling,
}: {
  food: FoodType;
  intent: SwipeDirection | null;
  labels: boolean;
  onFling?: (direction: SwipeDirection) => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const intentColor: Record<SwipeDirection, string> = {
    left: C.negative,
    up: C.textSoft,
    right: C.positive,
  };
  const hint = intent
    ? { text: T.intent[intent], color: intentColor[intent] }
    : null;

  return (
    <View style={styles.cardSlot}>
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.hint}>
            {hint && (
              <CText weight="medium" size={skin.type.label} color={hint.color}>
                {hint.text}
              </CText>
            )}
          </View>
          <FoodPicture food={food} size={skin.size.icon.card} />
          <View style={styles.cardText}>
            <CText
              weight="medium"
              size={skin.type.headline + 2}
              style={styles.center}
              numberOfLines={2}
            >
              {food.name}
            </CText>
            <CText
              size={skin.type.body - 1}
              color={C.textSoft}
              style={styles.center}
            >
              {T.play.question}
            </CText>
          </View>
        </View>
        <CardPads intent={intent} labels={labels} onFling={onFling} />
      </View>
    </View>
  );
};

const Checking = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  useStatusBarStyle(skin.statusBarOnGround);
  const total = Math.max(1, game.total);
  const [labels, setLabels] = useState(false);
  const InfoIcon = labels ? InformationCircleSolid : InformationCircleIcon;
  const [touches, setTouches] = useState(0);
  const [idleFor, setIdleFor] = useState<number | null>(null);
  const canNudge = game.position === 0 && !game.removeRequest;
  const nudging = canNudge && idleFor === touches;

  useEffect(() => {
    if (!canNudge) return;
    const timer = setTimeout(() => setIdleFor(touches), IDLE_MS);
    return () => clearTimeout(timer);
  }, [canNudge, touches]);

  return (
    <View
      onTouchStart={() => setTouches((count) => count + 1)}
      style={[styles.root, { paddingTop: insets.top + skin.spacing.stack }]}
    >
      <View style={styles.header}>
        <View style={styles.between}>
          <Press
            accessibilityRole="button"
            accessibilityLabel={T.close}
            hitSlop={skin.spacing.small}
            onPress={goBack}
            style={withPressed(styles.close)}
          >
            <XMarkIcon
              size={skin.size.icon.action}
              color={C.textSoft}
              strokeWidth={1.8}
            />
          </Press>
          <View style={styles.headerEnd}>
            <CText size={skin.type.label} color={C.textSoft}>
              {T.play.position(
                Math.min(game.position + 1, game.total),
                game.total,
              )}
            </CText>
            <Press
              accessibilityRole="switch"
              accessibilityLabel={T.play.showLabels}
              accessibilityState={{ checked: labels }}
              hitSlop={skin.spacing.small}
              onPress={() => setLabels((on) => !on)}
              style={withPressed(styles.info)}
            >
              <InfoIcon
                size={skin.size.icon.action}
                color={labels ? C.text : C.textSoft}
                strokeWidth={1.8}
              />
            </Press>
          </View>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: total, now: game.position }}
          style={styles.track}
        >
          <View
            style={[
              styles.fill,
              { width: `${(game.position / total) * 100}%` },
            ]}
          />
        </View>
      </View>
      <View style={styles.flex}>
        <SwipeDeck
          items={game.foods}
          keyOf={(food) => food.id}
          allowUp
          background="transparent"
          stamps={{}}
          nudging={nudging}
          flingRef={game.flingRef}
          onIntent={game.setIntent}
          onSwipe={game.handleSwipe}
          onLongPress={game.askRemove}
          renderSheet={(food, depth) => (
            <CheckCard
              food={food}
              intent={depth === 0 ? game.intent : null}
              labels={labels}
              onFling={depth === 0 ? game.fling : undefined}
            />
          )}
        />
      </View>
      <ActionPanel request={game.removeRequest} onClose={game.cancelRemove} />
    </View>
  );
};

const Recap = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const recap = game.recap;
  const added = recap?.added ?? [];

  return (
    <Screen
      dock={
        <CButton
          accessibilityLabel={T.play.replay}
          onPress={game.replay}
          icon={(color) => (
            <ArrowPathIcon
              size={skin.size.icon.action}
              color={color}
              strokeWidth={1.8}
            />
          )}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.doneContent}>
        <View style={styles.doneText}>
          <View style={styles.doneHead}>
            <DrawnMark kind="done" color={C.positive} />
            <CText
              weight="medium"
              size={skin.type.display.md}
              accessibilityRole="header"
            >
              {T.play.sorted}
            </CText>
          </View>
          {recap ? (
            <CText size={skin.type.body} color={C.textSoft}>
              {added.length ? T.play.added(added.length) : T.play.nothingNew}
            </CText>
          ) : (
            <CText size={skin.type.body} color={C.textSoft}>
              {T.play.today}
            </CText>
          )}
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

  const body = () => {
    if (suggestion.item) return <SuggestionStep suggestion={suggestion} />;

    switch (screen) {
      case "play":
        return <Checking game={game} />;
      case "done":
      case "closed":
        return <Recap game={game} />;
      case "empty":
        return (
          <CalmMessage
            title={copy.emptyTitle}
            line={copy.emptyLine}
            dock={
              <CButton
                variant="text"
                label={T.browseInventory}
                href="/inventory"
              />
            }
          />
        );
      default:
        return <CalmLoading />;
    }
  };

  return (
    <StateFade
      stateKey={
        suggestion.item
          ? "suggestion"
          : screen === "start"
            ? "loading"
            : screen === "closed"
              ? "done"
              : screen
      }
    >
      {body()}
    </StateFade>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    center: { textAlign: "center" },
    between: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    header: {
      gap: s.spacing.dock - 2,
      paddingHorizontal: s.spacing.gutter,
      paddingBottom: s.spacing.small,
    },
    close: { justifyContent: "center", minHeight: s.size.button.xs },
    headerEnd: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    info: {
      alignItems: "flex-end",
      justifyContent: "center",
      minHeight: s.size.button.xs,
    },
    track: { backgroundColor: C.line, height: 2 },
    fill: { backgroundColor: C.fill, height: "100%" },
    cardSlot: {
      flex: 1,
      paddingHorizontal: s.spacing.gutter,
      paddingVertical: s.spacing.stack,
    },
    card: {
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.size.button.lg / 2 + s.spacing.inline,
      borderWidth: s.shape.border,
      flex: 1,
    },
    cardBody: {
      alignItems: "center",
      flex: 1,
      gap: s.spacing.section - 4,
      justifyContent: "center",
      padding: s.spacing.gutter,
    },
    hint: {
      alignItems: "center",
      height: s.spacing.section,
      left: 0,
      position: "absolute",
      right: 0,
      top: s.spacing.gutter,
    },
    cardText: { alignItems: "center", gap: s.spacing.tight + 2 },
    doneContent: {
      flexGrow: 1,
      gap: s.spacing.section,
      justifyContent: "center",
    },
    doneText: { gap: s.spacing.small },
    doneHead: { flexDirection: "row" },
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.stripe,
    },
  });

export default CalmPlay;
