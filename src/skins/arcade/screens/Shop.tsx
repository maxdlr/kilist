import withPressed from "@/utils/withPressed";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import KilButton from "@/components/elements/KilButton";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import ShopPanels from "@/components/views/ShopList/_components/ShopPanels";
import useShopRun from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { XMarkIcon } from "react-native-heroicons/outline";
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

const BRAND = "KILIST";
const EMPTY_ROWS = 5;

const Star = () => {
  const skin = useSkin();
  const size = skin.size.icon.action - 6;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"
        fill={P.yellow}
      />
    </Svg>
  );
};

const Marquee = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <View style={styles.marquee}>
      <View style={styles.marqueeSide}>
        <Star />
      </View>
      <View style={styles.marqueeCenter}>
        <ThemedText size={skin.type.label} color={P.white} numberOfLines={1}>
          {BRAND}
        </ThemedText>
      </View>
      <View style={styles.marqueeSide}>
        <Star />
      </View>
    </View>
  );
};

const Stamp = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(1, { duration: 160 }));
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ rotateZ: "-8deg" }, { scale: 1.6 - progress.value * 0.6 }],
  }));

  return (
    <Animated.View style={[styles.stamp, style]}>
      <ThemedText size={skin.type.caption - 2} color={P.white} numberOfLines={1}>
        {T.bought}
      </ThemedText>
    </Animated.View>
  );
};

const GameRow = ({
  food,
  rank,
  done = false,
  highlight = false,
}: {
  food: FoodType;
  rank: number;
  done?: boolean;
  highlight?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);

  return (
    <View
      accessible
      accessibilityLabel={`${food.name}, ${done ? T.boughtLower : T.notBought}`}
      style={[styles.row, highlight && styles.rowHighlight, done && styles.rowDone]}
    >
      <View style={styles.rank}>
        <ThemedText mono size={skin.type.caption} color={P.white}>
          {String(rank).padStart(2, "0")}
        </ThemedText>
      </View>
      <View style={done ? styles.dimmed : undefined}>
        <FoodPicture food={food} size={skin.size.icon.row} />
      </View>
      <ThemedText
        numberOfLines={1}
        size={skin.type.body}
        color={done ? P.dimInk : P.navy}
        style={[styles.flex, done && styles.struck]}
      >
        {food.name}
      </ThemedText>
      {done ? (
        <Stamp />
      ) : (
        <View style={[styles.level, { backgroundColor: skin.colors.levels[level] }]}>
          <ThemedText size={skin.type.caption - 2} color={P.navy} numberOfLines={1}>
            {skin.copy.levels[level]}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const SwipeRow = ({
  food,
  rank,
  highlight = false,
  onBuy,
  onLater,
}: {
  food: FoodType;
  rank: number;
  highlight?: boolean;
  onBuy: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [buying, setBuying] = useState(true);

  return (
    <View
      accessibilityActions={[
        { name: "activate", label: T.bought },
        { name: "later", label: T.nextTime },
      ]}
      onAccessibilityAction={(event) => (event.nativeEvent.actionName === "later" ? onLater() : onBuy())}
      style={[styles.swipeSlot, { backgroundColor: buying ? P.navy : P.lilac }]}
    >
      <View style={[styles.behind, { justifyContent: buying ? "flex-start" : "flex-end" }]}>
        <ThemedText size={skin.type.label} color={buying ? P.white : P.navy}>
          {buying ? T.bought : T.nextTime}
        </ThemedText>
      </View>
      <SwipeGesture
        onSwipeRight={onBuy}
        onSwipeLeft={onLater}
        onSwipingRight={() => setBuying(true)}
        onSwipingLeft={() => setBuying(false)}
        swipeThreshold={100}
        styles={{ box: styles.swipeBox }}
      >
        <GameRow food={food} rank={rank} highlight={highlight} />
      </SwipeGesture>
    </View>
  );
};

const ArcadeShop = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const run = useShopRun();
  const [stamped, setStamped] = useState<FoodType[]>([]);

  const leave = () => {
    setStamped([]);
    return run.finish();
  };

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
            onTouch={leave}
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

  if (!run.isStarted && !run.isEmpty) {
    return (
      <Ground
        dock={
          <KilButton
            height={skin.size.button.lg}
            fontSize={skin.type.lead}
            label={common.shop.start}
            onTouch={run.start}
          />
        }
      >
        <View>
          <ThemedText size={skin.type.label} color={P.lilac}>
            {common.shop.startLabel}
          </ThemedText>
          <Title size={skin.type.display.sm} lines={1} color={P.white}>
            {common.shop.startTitle(run.range.low, run.range.high)}
          </Title>
        </View>
        <ArcadeCard lift={2} style={styles.board}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
            {run.preview.map((food, index) => (
              <GameRow key={food.id} food={food} rank={index + 1} />
            ))}
          </ScrollView>
        </ArcadeCard>
        <View style={styles.how}>
          <ThemedText size={skin.type.label} color={P.lilac}>
            {common.shop.startHow}
          </ThemedText>
          <ThemedText size={skin.type.label} color={P.white}>
            {`→ ${common.shop.startRight}`}
          </ThemedText>
          <ThemedText size={skin.type.label} color={P.white}>
            {`← ${common.shop.startLeft}`}
          </ThemedText>
        </View>
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
        <View style={styles.emptyBoard}>
          {Array.from({ length: EMPTY_ROWS }, (_, index) => (
            <View key={index} style={styles.emptyRow} />
          ))}
        </View>
        <ThemedText size={skin.type.label} color={P.white}>
          {T.noCardLine}
        </ThemedText>
      </Ground>
    );
  }

  const stampedIds = new Set(stamped.map((food) => food.id));
  const isOpen = (food: FoodType) => !stampedIds.has(food.id);
  const suggestion = run.suggestion && isOpen(run.suggestion) ? run.suggestion : null;
  const rows = run.rows.filter(isOpen);
  const left = (run.foods ?? []).filter(isOpen).length;
  const firstRank = suggestion ? 2 : 1;

  const stamp = (food: FoodType) => {
    setStamped((list) => [...list, food]);
    run.buy(food.id);
  };

  return (
    <View style={styles.flex}>
    <Ground
      dock={
        <>
          <ThemedText size={skin.type.caption} color={P.white} style={[styles.center, styles.hint]}>
            {T.stampHint}
          </ThemedText>
          <View style={styles.actions}>
            <KilButton
              flex={1}
              height={skin.size.button.lg - skin.spacing.tight}
              fontSize={skin.type.body}
              variant="secondary"
              label={common.shop.add}
              onTouch={run.openAdd}
            />
            <KilButton
              flex={1.6}
              height={skin.size.button.lg - skin.spacing.tight}
              fontSize={skin.type.body}
              label={left === 0 ? T.bingoFinish : T.finishRun}
              onTouch={leave}
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
          <Title size={skin.type.display.sm} lines={1} color={P.white} gutter={skin.spacing.gutter * 2 + skin.size.button.xs * 3}>
            {left === 0 ? T.fullCard : T.toFind(left)}
          </Title>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.stopAria}
          onPress={() => (stamped.length === 0 ? (setStamped([]), run.discard()) : run.askStop())}
          hitSlop={skin.spacing.small}
          style={withPressed(styles.close)}
        >
          <XMarkIcon size={skin.size.icon.action} color={P.lilac} strokeWidth={2.5} />
        </Pressable>
        <View
          accessible
          accessibilityLabel={T.boughtLeftAria(stamped.length, left)}
          style={[styles.progress, { boxShadow: shadowOf(skin, -1) }]}
        >
          <ThemedText size={skin.type.label} color={P.navy}>
            {`${stamped.length}/${stamped.length + left}`}
          </ThemedText>
        </View>
      </View>

      <ArcadeCard lift={2} style={styles.board}>
        <Marquee />
        <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
          {suggestion && (
            <View style={styles.next}>
              <ThemedText size={skin.type.caption - 2} color={P.dimInk}>
                {T.nextStop}
              </ThemedText>
              <SwipeRow
                food={suggestion}
                rank={1}
                highlight
                onBuy={() => stamp(suggestion)}
                onLater={() => run.snooze(suggestion.id)}
              />
            </View>
          )}
          {rows.map((food, index) => (
            <SwipeRow
              key={food.id}
              food={food}
              rank={firstRank + index}
              onBuy={() => stamp(food)}
              onLater={() => run.snooze(food.id)}
            />
          ))}
          {stamped.map((food, index) => (
            <GameRow key={`stamped-${food.id}`} food={food} rank={left + index + 1} done />
          ))}
        </ScrollView>
      </ArcadeCard>
    </Ground>
      <ShopPanels run={run} />
    </View>
  );
};

const createStyles = (s: Skin) => {
  const gap = s.spacing.small;

  return StyleSheet.create({
    flex: {
      flex: 1,
      minWidth: 0,
    },
    center: {
      textAlign: "center",
    },
    hint: {
      paddingBottom: s.spacing.tight,
      paddingTop: s.spacing.small,
    },
    middle: {
      alignItems: "center",
      justifyContent: "center",
    },
    close: { alignItems: "center", height: s.size.button.xs, justifyContent: "center", width: s.size.button.xs },
    how: { gap: s.spacing.tight },
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
    marquee: {
      flexDirection: "row",
      gap,
    },
    marqueeSide: {
      alignItems: "center",
      backgroundColor: P.navy,
      borderRadius: s.spacing.inline,
      flex: 1,
      justifyContent: "center",
      paddingVertical: s.spacing.tight,
    },
    marqueeCenter: {
      alignItems: "center",
      backgroundColor: P.navy,
      borderRadius: s.spacing.inline,
      flex: 2,
      justifyContent: "center",
      paddingVertical: s.spacing.tight,
    },
    list: {
      gap,
    },
    next: {
      gap: s.spacing.hair + 2,
    },
    swipeSlot: {
      borderRadius: s.spacing.inline + 2,
      overflow: "hidden",
    },
    behind: {
      alignItems: "center",
      bottom: 0,
      flexDirection: "row",
      left: 0,
      paddingHorizontal: s.spacing.stack,
      position: "absolute",
      right: 0,
      top: 0,
    },
    swipeBox: {
      borderRadius: s.spacing.inline + 2,
    },
    row: {
      alignItems: "center",
      backgroundColor: P.white,
      borderBottomWidth: s.shape.border + 2,
      borderColor: P.navy,
      borderRadius: s.spacing.inline + 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.small,
      minHeight: s.size.row.shop,
      paddingHorizontal: s.spacing.small,
      paddingVertical: s.spacing.tight,
    },
    rowHighlight: {
      backgroundColor: P.lilac,
    },
    rowDone: {
      borderBottomWidth: s.shape.border,
      borderColor: P.dimInk,
    },
    rank: {
      alignItems: "center",
      backgroundColor: P.navy,
      borderRadius: s.spacing.small,
      justifyContent: "center",
      paddingHorizontal: s.spacing.tight + 2,
      paddingVertical: s.spacing.tight,
    },
    dimmed: {
      opacity: 0.45,
    },
    struck: {
      textDecorationLine: "line-through",
    },
    level: {
      borderColor: P.navy,
      borderRadius: s.spacing.small,
      borderWidth: s.shape.divider,
      flexShrink: 0,
      maxWidth: "34%",
      paddingHorizontal: s.spacing.tight + 2,
      paddingVertical: s.spacing.hair + 1,
    },
    stamp: {
      backgroundColor: P.navy,
      borderRadius: s.spacing.small,
      flexShrink: 0,
      paddingHorizontal: s.spacing.small,
      paddingVertical: s.spacing.tight,
    },
    emptyBoard: {
      borderColor: P.white,
      borderRadius: s.shape.radius + s.spacing.small,
      borderStyle: "dashed",
      borderWidth: s.shape.border,
      flex: 1,
      gap,
      padding: s.spacing.inline,
    },
    emptyRow: {
      borderColor: "rgba(255,255,255,0.5)",
      borderRadius: s.spacing.inline + 2,
      borderStyle: "dashed",
      borderWidth: s.shape.border,
      height: s.size.row.shop,
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
