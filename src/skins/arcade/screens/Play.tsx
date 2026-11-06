import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import KilButton from "@/components/elements/KilButton";
import SwipeDeck, { SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useSwipeGame, { SWIPE_TICKETS, SwipeGame } from "@/hooks/screens/useSwipeGame";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { findSkin } from "@/skins";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { arcadePalette as P } from "..";
import Ground from "./Ground";
import { ArcadeCard, Row, Rule, shadowOf, TicketChip } from "./parts";
import { ArcadeLoading, OutOfOrder } from "./States";
import { arcadeText as T } from "./text";

const CONFETTI = 18;
const SHUTTER_SLATS = 9;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
const padTickets = (value: number) => String(value).padStart(4, "0");

const Swatch = ({ look }: { look: Skin }) => {
  const styles = useSkinStyles(createStyles);
  const colors = [
    look.colors.ground,
    look.actions.primary.fill,
    look.colors.levels[1],
    look.colors.onPaper,
  ];

  return (
    <View style={styles.swatch}>
      {colors.map((color, index) => (
        <View key={index} style={[styles.swatchCell, { backgroundColor: color }]} />
      ))}
    </View>
  );
};

const PrizeShelf = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const prizes = game.counter?.prizes ?? [];

  return (
    <View style={styles.shelf}>
      <ThemedText size={skin.type.label} color={P.white}>
        {T.shelfTitle}
      </ThemedText>
      {prizes.map((prize) => {
        const look = findSkin(prize.skin);
        const isWorn = look.id === skin.id;
        const tag = isWorn
          ? skin.copy.prizes.wearing
          : prize.owned
            ? skin.copy.prizes.wear
            : String(prize.price);

        return (
          <ArcadeCard key={prize.id} style={styles.prize}>
            <Swatch look={look} />
            <View style={styles.flex}>
              <ThemedText size={skin.type.body} color={P.navy}>
                {look.name}
              </ThemedText>
              <ThemedText size={skin.type.caption - 2} color={P.navy}>
                {T.appSkin}
              </ThemedText>
            </View>
            <View style={[styles.tag, isWorn && { backgroundColor: P.pale }]}>
              <ThemedText size={skin.type.caption} color={P.navy}>
                {tag}
              </ThemedText>
            </View>
          </ArcadeCard>
        );
      })}
      <ArcadeCard dashed fill="rgba(255,255,255,0.75)" style={styles.prize}>
        <View style={[styles.swatch, styles.swatchBlank]} />
        <View style={styles.flex}>
          <ThemedText size={skin.type.body} color={P.navy}>
            {T.nextPrize}
          </ThemedText>
          <ThemedText size={skin.type.caption - 2} color={P.navy}>
            {T.comingSoon}
          </ThemedText>
        </View>
        <View style={styles.tag}>
          <ThemedText size={skin.type.caption} color={P.navy}>
            ?
          </ThemedText>
        </View>
      </ArcadeCard>
    </View>
  );
};

const Booth = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;

  return (
    <Ground
      dock={
        <KilButton
          height={skin.size.button.xl - skin.spacing.tight}
          fontSize={skin.type.title}
          label={copy.start}
          onTouch={game.begin}
        />
      }
    >
      <View style={styles.header}>
        <ThemedText size={skin.type.lead} color={P.white}>
          {T.booth}
        </ThemedText>
        {game.balance !== undefined && <TicketChip count={game.balance} />}
      </View>
      <View style={styles.intro}>
        <Title size={skin.type.display.md} lines={2} color={P.white}>
          {copy.startTitle}
        </Title>
        <ThemedText size={skin.type.label} color={P.white}>
          {`${copy.startLabel(game.level)} · ${copy.startLine(game.foods.length)}`}
        </ThemedText>
      </View>
      <PrizeShelf game={game} />
    </Ground>
  );
};

const FoodTicket = ({ food }: { food: FoodType }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const tint = skin.colors.levels[level];
  const [hero, setHero] = useState(0);

  return (
    <View style={styles.ticketSlot}>
      <View style={[styles.ticket, { backgroundColor: tint, boxShadow: shadowOf(skin, 3) }]}>
        <View style={styles.ticketTop}>
          <ThemedText size={skin.type.caption} color={P.navy}>
            {T.admitOne}
          </ThemedText>
          <ThemedText size={skin.type.caption} color={P.navy}>
            {skin.copy.tickets.cardTag(SWIPE_TICKETS)}
          </ThemedText>
        </View>
        <View
          style={styles.hero}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setHero(Math.floor(Math.min(width * 0.76, height * 0.84)));
          }}
        >
          {hero > 0 && <FoodPicture food={food} size={hero} />}
        </View>
        <View style={styles.stub}>
          <Title size={skin.type.display.sm} lines={1} color={P.navy} style={styles.flex}>
            {food.name}
          </Title>
          <View style={[styles.levelChip, { backgroundColor: tint }]}>
            <ThemedText size={skin.type.caption} color={P.navy}>
              {skin.copy.levels[level]}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={[styles.notch, styles.notchRight]} />
      </View>
    </View>
  );
};

const Clock = ({ startedAt }: { startedAt: number }) => {
  const skin = useSkin();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <ThemedText size={skin.type.caption} color={P.softNavy}>
      {formatTime(Math.max(0, Math.floor((now - startedAt) / 1000)))}
    </ThemedText>
  );
};

const Counter = ({ game, startedAt }: { game: SwipeGame; startedAt: number }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const strip = Math.min(
    skin.spacing.gutter + skin.spacing.tight,
    skin.spacing.small + game.position * 3,
  );

  return (
    <View style={styles.counterWrap}>
      <View style={[styles.counter, { boxShadow: shadowOf(skin, 0, P.plankShadow) }]}>
        <View style={styles.counterMain}>
          <ThemedText size={skin.type.caption} color={P.softNavy}>
            {T.ticketsToday}
          </ThemedText>
          <ThemedText
            accessibilityLiveRegion="polite"
            size={skin.type.headline + skin.spacing.tight}
            color={P.white}
            style={styles.digits}
          >
            {padTickets(game.earned)}
          </ThemedText>
        </View>
        <View style={styles.counterSide}>
          <ThemedText size={skin.type.label} color={P.white}>
            {`${Math.min(game.position + 1, game.total)} of ${game.total}`}
          </ThemedText>
          <Clock startedAt={startedAt} />
        </View>
      </View>
      <View style={styles.stripSlot}>
        <View style={[styles.strip, { height: strip }]}>
          {Array.from({ length: Math.ceil(strip / 15) }, (_, index) => (
            <View key={index} style={styles.stripLine} />
          ))}
        </View>
      </View>
    </View>
  );
};

const PATHS: Record<SwipeDirection, string> = {
  left: "M3 7h18v3H3zM5 10v10h14V10M10 13l4 4M14 13l-4 4",
  up: "M8.5 9a3.5 3.5 0 1 1 5.6 2.8c-1.3 1-2.1 1.7-2.1 3.2M12 19h.01",
  right: "M3 7h18v3H3zM5 10v10h14V10M9 15l2 2 4-4",
};

const RoundButton = ({
  direction,
  label,
  accessibilityLabel,
  game,
  small = false,
}: {
  direction: SwipeDirection;
  label: string;
  accessibilityLabel: string;
  game: SwipeGame;
  small?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { intent } = game;
  const idle = small ? P.white : P.yellow;
  const fill = intent ? (intent === direction ? P.yellow : P.white) : idle;
  const size = small ? skin.size.button.sm + skin.spacing.tight : skin.size.button.lg;
  const icon = small ? skin.size.icon.action - skin.spacing.tight : skin.size.icon.action - 2;

  return (
    <View style={styles.roundSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => game.fling(direction)}
        style={({ pressed }) => [
          styles.round,
          {
            backgroundColor: fill,
            borderRadius: size,
            boxShadow: shadowOf(skin, pressed ? -4 : 0),
            height: size,
            transform: [
              { translateY: pressed ? 4 : 0 },
              { scale: intent === direction ? 1.14 : 1 },
            ],
            width: size,
          },
        ]}
      >
        <Svg width={icon} height={icon} viewBox="0 0 24 24" fill="none">
          <Path
            d={PATHS[direction]}
            stroke={P.navy}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <ThemedText size={skin.type.caption} color={P.white}>
        {label}
      </ThemedText>
    </View>
  );
};

const INTENT_TINT: Record<SwipeDirection, string> = {
  right: "rgba(30,158,74,0.32)",
  left: "rgba(229,72,77,0.32)",
  up: "rgba(255,255,255,0.28)",
};

const Arena = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const [startedAt] = useState(() => Date.now());

  return (
    <Ground
      padded={false}
      style={styles.arena}
      dock={
        <View style={styles.roundRow}>
          <RoundButton direction="left" label={copy.out} accessibilityLabel="Out of stock" game={game} />
          <RoundButton direction="up" label={copy.unsure} accessibilityLabel="Not sure" game={game} small />
          <RoundButton direction="right" label={copy.inStock} accessibilityLabel="In stock" game={game} />
        </View>
      }
    >
      {game.intent && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: INTENT_TINT[game.intent] }]}
        />
      )}
      <Counter game={game} startedAt={startedAt} />
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
          renderSheet={(food) => <FoodTicket food={food} />}
        />
        {game.bonusPop > 0 && (
          <View pointerEvents="none" style={styles.bonusWrap}>
            <View style={[styles.bonus, { boxShadow: shadowOf(skin) }]}>
              <ThemedText accessibilityLiveRegion="polite" size={skin.type.lead} color={P.navy}>
                {skin.copy.tickets.bonus(game.bonusPop)}
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </Ground>
  );
};

const ConfettiBit = ({ index }: { index: number }) => {
  const styles = useSkinStyles(createStyles);
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.set(
      withDelay(
        60,
        withTiming(1, { duration: 1500 + (index % 5) * 220, easing: Easing.in(Easing.quad) }),
      ),
    );
  }, [fall, index]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -40 - (index % 6) * 44 + fall.value * (SCREEN_HEIGHT + 300) },
      { rotateZ: `${fall.value * (200 + index * 70)}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[styles.confetti, { left: `${((index * 53 + 13) % 360) / 3.9}%` }, style]}
    />
  );
};

const CashOut = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.tickets;
  const balance = game.balance ?? 0;
  const prize = game.nextPrize;
  const prizeName = prize ? findSkin(prize.skin).name : "";
  const goal = !prize
    ? copy.allOwned
    : balance >= prize.price
      ? copy.canAfford(prizeName)
      : copy.nextPrize(prize.price - balance, prizeName);
  const progress = prize ? Math.min(100, Math.round((balance / prize.price) * 100)) : 100;

  return (
    <Ground
      dock={
        <>
          <KilButton
            height={skin.size.button.lg}
            fontSize={skin.type.lead}
            label={skin.copy.swipe.overShop}
            href="/shop"
          />
          <KilButton
            variant="ghost"
            height={skin.size.button.xs}
            fontSize={skin.type.label}
            label={T.doneForToday}
            onTouch={game.reset}
          />
        </>
      }
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: CONFETTI }, (_, index) => (
          <ConfettiBit key={index} index={index} />
        ))}
      </View>
      <View style={styles.cashTop}>
        <ThemedText size={skin.type.body} color={P.white}>
          {T.cashedOut}
        </ThemedText>
        <Title size={skin.type.display.xl} lines={1} color={P.white} textStyle={styles.centerText}>
          {copy.cashOut(game.earned)}
        </Title>
        <ThemedText size={skin.type.label} color={P.white}>
          {T.ticketsIn(formatTime(game.seconds))}
        </ThemedText>
      </View>
      <ArcadeCard lift={1} style={styles.breakdown}>
        <Row left={copy.rowSwipes(game.position)} right={`+${game.earned - game.bonus}`} size={skin.type.label} />
        <Row left={copy.rowBonus} right={`+${game.bonus}`} size={skin.type.label} />
        <Rule />
        <Row left={copy.rowBalance} right={String(balance)} size={skin.type.body} />
        <View accessible accessibilityLabel={goal} style={styles.goal}>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${progress}%` }]} />
          </View>
          <ThemedText size={skin.type.caption} color={P.navy}>
            {goal}
          </ThemedText>
        </View>
      </ArcadeCard>
      <View style={styles.added}>
        <ThemedText size={skin.type.label} color={P.white}>
          {game.outFoods.length ? T.wentOnList(game.outFoods.length) : skin.copy.swipe.overNothing}
        </ThemedText>
        <View style={styles.chips}>
          {game.outFoods.map((food) => (
            <View key={food.id} style={styles.foodChip}>
              <FoodPicture food={food} size={skin.size.icon.action - 2} />
              <ThemedText size={skin.type.label} color={P.navy}>
                {food.name}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </Ground>
  );
};

const Closed = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <Ground
      dock={
        <>
          <KilButton
            height={skin.size.button.lg}
            fontSize={skin.type.lead}
            label={skin.copy.swipe.tomorrowAction}
            href="/shop"
          />
          <KilButton
            variant="ghost"
            height={skin.size.button.xs}
            fontSize={skin.type.label}
            label={T.visitCounter}
            onTouch={() => router.navigate("/account")}
          />
        </>
      }
    >
      <ThemedText size={skin.type.lead} color={P.white}>
        {T.booth}
      </ThemedText>
      <View style={[styles.booth, { boxShadow: shadowOf(skin, 3, P.plankShadow) }]}>
        <View style={styles.closedSign}>
          <ThemedText size={skin.type.lead} color={P.white}>
            {T.closed}
          </ThemedText>
        </View>
        <View style={styles.shutter}>
          {Array.from({ length: SHUTTER_SLATS }, (_, index) => (
            <View key={index} style={styles.slat} />
          ))}
        </View>
        <ThemedText size={skin.type.label} color={P.white} style={styles.centerText}>
          {T.opensTomorrow(game.level + 1)}
        </ThemedText>
      </View>
      <ArcadeCard style={styles.haul}>
        <View>
          <ThemedText size={skin.type.caption} color={P.navy}>
            {game.earned ? T.haul : T.balance}
          </ThemedText>
          <ThemedText size={skin.type.title} color={P.navy}>
            {game.earned
              ? T.haulTickets(game.earned)
              : skin.copy.prizes.balance(game.balance ?? 0)}
          </ThemedText>
        </View>
        {game.earned > 0 && (
          <ThemedText size={skin.type.caption} color={P.navy} style={styles.rightText}>
            {`${T.balance}\n${game.balance ?? 0}`}
          </ThemedText>
        )}
      </ArcadeCard>
      <ThemedText size={skin.type.label} color={P.white}>
        {T.closedLine}
      </ThemedText>
    </Ground>
  );
};

const ArcadePlay = () => {
  const skin = useSkin();
  const game = useSwipeGame();
  const copy = skin.copy.swipe;

  switch (game.screen) {
    case "loading":
      return <ArcadeLoading />;
    case "play":
      return <Arena game={game} />;
    case "done":
      return <CashOut game={game} />;
    case "closed":
      return <Closed game={game} />;
    case "empty":
      return (
        <OutOfOrder
          sign={copy.emptyTitle}
          title={copy.emptyLabel}
          line={copy.emptyLine}
          action={{ label: skin.copy.empty.refresh, onTouch: game.refreshFoods }}
        />
      );
    default:
      return <Booth game={game} />;
  }
};

const createStyles = (s: Skin) => {
  const notch = s.size.check * 1.4;
  const cardRadius = s.shape.radius + s.spacing.tight;

  return StyleSheet.create({
    flex: {
      flex: 1,
      minWidth: 0,
    },
    centerText: {
      textAlign: "center",
    },
    rightText: {
      textAlign: "right",
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    intro: {
      gap: s.spacing.small,
    },
    shelf: {
      flex: 1,
      gap: s.spacing.inline,
      justifyContent: "center",
      minHeight: 0,
    },
    prize: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.dock,
      paddingHorizontal: s.spacing.dock,
      paddingVertical: s.spacing.inline,
    },
    swatch: {
      borderColor: P.navy,
      borderRadius: s.spacing.stack,
      borderWidth: s.shape.border,
      flexDirection: "row",
      flexWrap: "wrap",
      height: s.size.button.sm,
      overflow: "hidden",
      width: s.size.button.sm,
    },
    swatchBlank: {
      backgroundColor: P.pale,
    },
    swatchCell: {
      height: "50%",
      width: "50%",
    },
    tag: {
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.spacing.small + 2,
      borderWidth: s.shape.border - 1,
      paddingHorizontal: s.spacing.small + 2,
      paddingVertical: s.spacing.tight,
    },
    arena: {
      gap: 0,
    },
    counterWrap: {
      paddingHorizontal: s.spacing.section,
    },
    counter: {
      backgroundColor: P.navy,
      borderColor: P.navy,
      borderRadius: s.shape.radius - 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      overflow: "hidden",
    },
    counterMain: {
      flex: 1,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.small,
    },
    digits: {
      letterSpacing: 2,
    },
    counterSide: {
      alignItems: "flex-end",
      borderColor: P.dash,
      borderLeftWidth: s.shape.border,
      borderStyle: "dashed",
      gap: s.spacing.tight,
      justifyContent: "center",
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.small,
    },
    stripSlot: {
      alignItems: "center",
      height: s.spacing.gutter + s.spacing.tight,
    },
    strip: {
      backgroundColor: P.white,
      borderColor: P.navy,
      borderTopWidth: 0,
      borderWidth: 2,
      gap: 13,
      overflow: "hidden",
      paddingTop: 13,
      width: s.size.icon.card * 0.8,
    },
    stripLine: {
      backgroundColor: P.navy,
      height: 2,
    },
    ticketSlot: {
      flex: 1,
      paddingBottom: s.spacing.inline,
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.hair,
    },
    ticket: {
      borderColor: P.navy,
      borderRadius: cardRadius + s.spacing.tight,
      borderWidth: s.shape.border,
      flex: 1,
      overflow: "hidden",
    },
    ticketTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.dock,
    },
    hero: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      minHeight: 0,
    },
    stub: {
      alignItems: "center",
      backgroundColor: P.white,
      borderColor: P.navy,
      borderStyle: "dashed",
      borderTopWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingBottom: s.spacing.section - 2,
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.dock,
    },
    levelChip: {
      borderColor: P.navy,
      borderRadius: s.size.button.xl,
      borderWidth: s.shape.border - 1,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.tight + 2,
    },
    notch: {
      backgroundColor: s.colors.ground,
      borderColor: P.navy,
      borderRadius: notch,
      borderWidth: s.shape.border,
      height: notch,
      position: "absolute",
      top: "62%",
      width: notch,
    },
    notchLeft: {
      left: -notch / 2 - 2,
    },
    notchRight: {
      right: -notch / 2 - 2,
    },
    bonusWrap: {
      alignItems: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: "40%",
    },
    bonus: {
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.size.button.xl,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.section - 2,
      paddingVertical: s.spacing.small,
      transform: [{ rotateZ: "-4deg" }],
    },
    roundRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: s.spacing.section,
      justifyContent: "center",
    },
    roundSlot: {
      alignItems: "center",
      gap: s.spacing.tight + 2,
      width: s.size.button.xl + s.spacing.section,
    },
    round: {
      alignItems: "center",
      borderColor: P.navy,
      borderWidth: s.shape.border,
      justifyContent: "center",
    },
    confetti: {
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: 2,
      borderWidth: 2,
      height: s.spacing.inline,
      position: "absolute",
      top: 0,
      width: s.spacing.section + 2,
    },
    cashTop: {
      alignItems: "center",
    },
    breakdown: {
      gap: s.spacing.small + 2,
      padding: s.spacing.section - 2,
    },
    goal: {
      gap: s.spacing.tight + 2,
    },
    goalTrack: {
      backgroundColor: P.pale,
      borderColor: P.navy,
      borderRadius: s.size.button.xl,
      borderWidth: s.shape.border,
      height: s.size.meter + s.spacing.tight,
      overflow: "hidden",
    },
    goalFill: {
      backgroundColor: s.colors.ground,
      height: "100%",
    },
    added: {
      gap: s.spacing.small + 2,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.small + 2,
    },
    foodChip: {
      alignItems: "center",
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.size.button.xl,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.small,
      paddingLeft: s.spacing.tight + 2,
      paddingRight: s.spacing.dock,
      paddingVertical: s.spacing.tight + 2,
    },
    booth: {
      backgroundColor: P.navy,
      borderColor: P.navy,
      borderRadius: cardRadius + s.spacing.small,
      borderWidth: s.shape.border,
      flex: 1,
      gap: s.spacing.inline,
      minHeight: 0,
      padding: s.spacing.dock,
    },
    closedSign: {
      alignSelf: "center",
      borderColor: P.white,
      borderRadius: s.spacing.stack,
      borderStyle: "dotted",
      borderWidth: s.shape.border + 2,
      paddingHorizontal: s.spacing.section - 2,
      paddingVertical: s.spacing.tight + 2,
    },
    shutter: {
      backgroundColor: P.lilac,
      borderColor: P.navy,
      borderRadius: s.shape.radius - s.spacing.tight,
      borderWidth: s.shape.border,
      flex: 1,
      justifyContent: "space-evenly",
      minHeight: 0,
      overflow: "hidden",
    },
    slat: {
      backgroundColor: P.shutter,
      height: s.spacing.tight,
    },
    haul: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: s.spacing.section - 2,
      paddingVertical: s.spacing.stack,
    },
  });
};

export default ArcadePlay;
