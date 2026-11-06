import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import KilButton from "@/components/elements/KilButton";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useShopRun from "@/hooks/screens/useShopRun";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { arcadePalette as P } from "..";
import Ground from "./Ground";
import { ArcadeCard, Row, shadowOf } from "./parts";
import { ArcadeLoading } from "./States";
import { arcadeText as T } from "./text";

const CARD_CELLS = 8;
const FREE_AT = 4;
const HEADER = ["KIL", "I", "ST"];

const Stamp = ({ on }: { on: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const progress = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(on ? 1 : 0, { duration: 160 }));
  }, [on, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ rotateZ: "-12deg" }, { scale: 1.6 - progress.value * 0.6 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.stamp, style]}>
      <ThemedText size={skin.type.label} color={P.white}>
        {T.bought}
      </ThemedText>
    </Animated.View>
  );
};

const Cell = ({
  food,
  stamped,
  bonus,
  onStamp,
  onLater,
}: {
  food: FoodType;
  stamped: boolean;
  bonus: boolean;
  onStamp: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const [size, setSize] = useState(0);
  const [stamping, setStamping] = useState(true);

  const cell = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: stamped, disabled: stamped }}
      accessibilityLabel={`${food.name}, ${stamped ? "bought" : "not bought yet"}`}
      disabled={stamped}
      onPress={onStamp}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize(Math.min(width, height));
      }}
      style={[
        styles.cell,
        { backgroundColor: skin.colors.levels[level] },
        bonus && styles.dashed,
      ]}
    >
      {size > 0 && <FoodPicture food={food} size={size * 0.46} />}
      <ThemedText numberOfLines={1} size={skin.type.caption} color={P.navy}>
        {food.name}
      </ThemedText>
      <ThemedText numberOfLines={1} size={skin.type.caption - 4} color={P.navy}>
        {bonus ? T.bonusPick : skin.copy.levels[level]}
      </ThemedText>
      <Stamp on={stamped} />
    </Pressable>
  );

  if (stamped) return cell;

  return (
    <View
      accessibilityActions={[{ name: "later", label: T.nextTime }]}
      onAccessibilityAction={(event) => event.nativeEvent.actionName === "later" && onLater()}
      style={[styles.swipeSlot, { backgroundColor: stamping ? P.navy : P.lilac }]}
    >
      <View style={[styles.behind, { justifyContent: stamping ? "flex-start" : "flex-end" }]}>
        <ThemedText size={skin.type.caption - 2} color={stamping ? P.white : P.navy}>
          {stamping ? T.bought : T.nextTime}
        </ThemedText>
      </View>
      <SwipeGesture
        onSwipeRight={onStamp}
        onSwipeLeft={onLater}
        onSwipingRight={() => setStamping(true)}
        onSwipingLeft={() => setStamping(false)}
        swipeThreshold={48}
        styles={{ box: styles.swipeBox }}
      >
        {cell}
      </SwipeGesture>
    </View>
  );
};

const NextStop = ({ food, onStamp, onLater }: { food: FoodType; onStamp: () => void; onLater: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [stamping, setStamping] = useState(true);

  return (
    <View
      accessible
      accessibilityLabel={`${T.nextStop}: ${food.name}`}
      accessibilityActions={[
        { name: "activate", label: T.bought },
        { name: "later", label: T.nextTime },
      ]}
      onAccessibilityAction={(event) => (event.nativeEvent.actionName === "later" ? onLater() : onStamp())}
      style={[styles.nextSlot, { backgroundColor: stamping ? P.navy : P.lilac }]}
    >
      <View style={[styles.behind, { justifyContent: stamping ? "flex-start" : "flex-end" }]}>
        <ThemedText size={skin.type.caption} color={stamping ? P.white : P.navy}>
          {stamping ? T.bought : T.nextTime}
        </ThemedText>
      </View>
      <SwipeGesture
        onSwipeRight={onStamp}
        onSwipeLeft={onLater}
        onSwipingRight={() => setStamping(true)}
        onSwipingLeft={() => setStamping(false)}
        swipeThreshold={100}
        styles={{ box: styles.nextBox }}
      >
        <FoodPicture food={food} size={skin.size.icon.row} />
        <View style={styles.flex}>
          <ThemedText size={skin.type.caption - 3} color={P.dimInk}>
            {T.nextStop}
          </ThemedText>
          <ThemedText numberOfLines={1} size={skin.type.body} color={P.navy}>
            {food.name}
          </ThemedText>
        </View>
      </SwipeGesture>
    </View>
  );
};

const FreeCell = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.cell, styles.free]}>
      <Svg width={skin.size.icon.action + 2} height={skin.size.icon.action + 2} viewBox="0 0 24 24">
        <Path
          d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
          fill={P.white}
          stroke={P.white}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
      <ThemedText size={skin.type.caption} color={P.white}>
        {T.free}
      </ThemedText>
    </View>
  );
};

const ArcadeShop = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const run = useShopRun();
  const [card, setCard] = useState<FoodType[]>([]);
  const [stamped, setStamped] = useState<number[]>([]);

  const remaining = run.foods ?? [];
  const live = new Set(remaining.map((food) => food.id));
  const onCard = card.filter((food) => live.has(food.id) || stamped.includes(food.id));
  const isCardDone = onCard.length > 0 && onCard.every((food) => stamped.includes(food.id));
  const needsDeal =
    remaining.length > 0 && (onCard.length === 0 || (isCardDone && stamped.length === 0));

  if (needsDeal) {
    const regulars = run.rows.slice(0, run.suggestion ? CARD_CELLS - 1 : CARD_CELLS);
    setCard(run.suggestion ? [...regulars, run.suggestion] : regulars);
    setStamped([]);
  }

  if (run.isLoading) return <ArcadeLoading />;

  if (run.isFinished) {
    return (
      <Ground
        style={styles.middle}
        dock={
          <KilButton
            height={skin.size.button.lg}
            fontSize={skin.type.lead}
            label={T.backToFloor}
            onTouch={run.stop}
          />
        }
      >
        <View style={styles.bingoSign}>
          <Title size={skin.type.display.lg} lines={1} color={P.white}>
            {T.bingo}
          </Title>
        </View>
        <ThemedText size={skin.type.body} color={P.white} style={styles.center}>
          {T.bingoLine}
        </ThemedText>
        <ArcadeCard style={styles.summary}>
          <Row left={T.bought} right={String(run.bought)} size={skin.type.label} />
          <Row left={T.nextTime} right={String(run.handled - run.bought)} size={skin.type.label} />
          <Row left={T.listsWritten} right="0" size={skin.type.label} />
        </ArcadeCard>
      </Ground>
    );
  }

  if (run.isEmpty) {
    return (
      <Ground
        dock={
          <KilButton
            height={skin.size.button.lg}
            fontSize={skin.type.lead}
            label={T.playToday}
            onTouch={() => router.navigate("/swipe")}
          />
        }
      >
        <View>
          <ThemedText size={skin.type.label} color={P.lilac}>
            {T.shopRun}
          </ThemedText>
          <Title size={skin.type.display.sm} lines={1} color={P.white}>
            {T.noCard}
          </Title>
        </View>
        <View style={[styles.grid, styles.emptyCard]}>
          {Array.from({ length: CARD_CELLS + 1 }, (_, index) => (
            <View key={index} style={[styles.gridSlot]}>
              <View style={[styles.cell, styles.emptyCell]} />
            </View>
          ))}
        </View>
        <ThemedText size={skin.type.label} color={P.white}>
          {T.noCardLine}
        </ThemedText>
      </Ground>
    );
  }

  const left = remaining.length;
  const nextId = run.suggestion?.id;
  const offCard = run.suggestion && !onCard.some((food) => food.id === nextId) ? run.suggestion : null;
  const stamp = (food: FoodType) => {
    setStamped((ids) => [...ids, food.id]);
    run.buy(food.id);
  };
  const cells: (FoodType | null)[] = [...onCard];
  cells.splice(Math.min(FREE_AT, cells.length), 0, null);

  const finishLabel =
    left === 0 ? T.bingoFinish : isCardDone ? T.nextCard : T.finishRun;
  const finish = () => {
    if (isCardDone && left > 0) {
      setStamped([]);
      setCard([]);
      return;
    }
    run.stop();
  };

  return (
    <Ground
      dock={
        <>
          <ThemedText size={skin.type.caption} color={P.white} style={styles.center}>
            {T.stampHint}
          </ThemedText>
          <View style={styles.actions}>
            <KilButton
              flex={1}
              height={skin.size.button.lg - skin.spacing.tight}
              fontSize={skin.type.body}
              variant="secondary"
              label={skin.copy.shop.stop}
              accessibilityLabel="Stop shopping"
              onTouch={run.stop}
            />
            <KilButton
              flex={1.6}
              height={skin.size.button.lg - skin.spacing.tight}
              fontSize={skin.type.body}
              label={finishLabel}
              onTouch={finish}
            />
          </View>
        </>
      }
    >
      <View style={styles.titleRow}>
        <View style={styles.flex}>
          <ThemedText size={skin.type.label} color={P.lilac}>
            {T.shopRun}
          </ThemedText>
          <Title size={skin.type.display.sm} lines={1} color={P.white}>
            {left === 0 ? T.fullCard : T.toFind(left)}
          </Title>
        </View>
        <View
          accessible
          accessibilityLabel={`${run.bought} bought, ${left} left`}
          style={[styles.progress, { boxShadow: shadowOf(skin, -1) }]}
        >
          <ThemedText size={skin.type.label} color={P.navy}>
            {`${run.bought}/${run.bought + left}`}
          </ThemedText>
        </View>
      </View>

      {offCard && (
        <NextStop food={offCard} onStamp={() => run.buy(offCard.id)} onLater={() => run.snooze(offCard.id)} />
      )}

      <ArcadeCard lift={2} style={styles.board}>
        <View style={styles.header}>
          {HEADER.map((letter) => (
            <View key={letter} style={styles.headerCell}>
              <ThemedText size={skin.type.label} color={P.white}>
                {letter}
              </ThemedText>
            </View>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((food, index) => (
            <View key={food?.id ?? `free-${index}`} style={styles.gridSlot}>
              {food ? (
                <Cell
                  food={food}
                  stamped={stamped.includes(food.id)}
                  bonus={food.id === nextId}
                  onStamp={() => stamp(food)}
                  onLater={() => run.snooze(food.id)}
                />
              ) : (
                <FreeCell />
              )}
            </View>
          ))}
        </View>
      </ArcadeCard>
    </Ground>
  );
};

const createStyles = (s: Skin) => {
  const gap = s.spacing.small + 2;

  return StyleSheet.create({
    swipeSlot: {
      borderRadius: s.spacing.section - 2,
      flex: 1,
      overflow: "hidden",
    },
    behind: {
      alignItems: "center",
      bottom: 0,
      flexDirection: "row",
      left: 0,
      paddingHorizontal: s.spacing.small,
      position: "absolute",
      right: 0,
      top: 0,
    },
    swipeBox: {
      flex: 1,
    },
    nextSlot: {
      borderRadius: s.shape.radius,
      overflow: "hidden",
    },
    nextBox: {
      alignItems: "center",
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.small,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
    center: {
      textAlign: "center",
    },
    middle: {
      alignItems: "center",
      justifyContent: "center",
    },
    titleRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    progress: {
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.spacing.inline,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.tight + 2,
    },
    board: {
      flex: 1,
      gap,
      minHeight: 0,
      padding: s.spacing.inline,
    },
    header: {
      flexDirection: "row",
      gap,
    },
    headerCell: {
      alignItems: "center",
      backgroundColor: P.navy,
      borderRadius: s.spacing.inline,
      flex: 1,
      paddingVertical: s.spacing.tight,
    },
    grid: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      minHeight: 0,
      rowGap: gap,
      columnGap: gap,
    },
    gridSlot: {
      flexBasis: "30%",
      flexGrow: 1,
      height: "31%",
    },
    cell: {
      alignItems: "center",
      borderColor: P.navy,
      borderRadius: s.spacing.section - 2,
      borderWidth: s.shape.border,
      flex: 1,
      gap: s.spacing.hair,
      justifyContent: "center",
      overflow: "hidden",
      padding: s.spacing.tight + 2,
    },
    dashed: {
      borderStyle: "dashed",
    },
    free: {
      backgroundColor: P.navy,
    },
    stamp: {
      alignItems: "center",
      backgroundColor: "rgba(106,63,200,0.72)",
      borderColor: P.navy,
      borderRadius: s.size.button.xl,
      borderWidth: s.shape.border,
      height: s.size.button.xl + s.spacing.small,
      justifyContent: "center",
      position: "absolute",
      width: s.size.button.xl + s.spacing.small,
    },
    emptyCard: {
      borderColor: P.white,
      borderRadius: s.shape.radius + s.spacing.small,
      borderStyle: "dashed",
      borderWidth: s.shape.border,
      padding: s.spacing.inline,
    },
    emptyCell: {
      borderColor: "rgba(255,255,255,0.5)",
      borderStyle: "dashed",
    },
    bingoSign: {
      backgroundColor: P.navy,
      borderColor: P.white,
      borderRadius: s.shape.radius + s.spacing.tight,
      borderStyle: "dotted",
      borderWidth: s.shape.border + 3,
      paddingHorizontal: s.spacing.gutter + s.spacing.tight,
      paddingVertical: s.spacing.stack,
      transform: [{ rotateZ: "-3deg" }],
    },
    summary: {
      alignSelf: "stretch",
      gap: s.spacing.tight + 2,
      paddingHorizontal: s.spacing.section - 2,
      paddingVertical: s.spacing.dock,
    },
    actions: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });
};

export default ArcadeShop;
