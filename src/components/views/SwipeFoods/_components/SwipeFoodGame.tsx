import Dock from "@/components/elements/Dock/Dock";
import EmptyData from "@/components/elements/EmptyData";
import FoodIcon from "@/components/elements/FoodIcon";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import Sheet from "@/components/elements/Sheet/Sheet";
import SwipeDeck, {
  deckButtonColors,
  SwipeDeckFling,
  SwipeDirection,
} from "@/components/elements/SwipeDeck/SwipeDeck";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useSwipeFoods, { SwipeReward } from "@/providers/SwipeFoodsProvider";
import useTickets from "@/providers/TicketsProvider";
import { caseFor, findSkin } from "@/skins";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IN_STOCK: Record<SwipeDirection, boolean | null> = {
  right: true,
  left: false,
  up: null,
};
const SWIPE_TICKETS = 10;
const BONUS_VISIBLE_MS = 700;

const pad = (value: number) => String(value).padStart(2, "0");
const padTickets = (value: number) => String(value).padStart(4, "0");

const sheetAt = (skin: Skin, position: number) =>
  skin.colors.sheets[position % skin.colors.sheets.length]!;

const FoodHero = ({ food }: { food: FoodType }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [heroSize, setHeroSize] = useState(0);

  return (
    <View
      style={styles.hero}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setHeroSize(
          Math.floor(Math.min(width, height - 2 * skin.spacing.small)),
        );
      }}
    >
      {heroSize > 0 &&
        (food.imageUrl ? (
          <Image
            source={{ uri: food.imageUrl }}
            style={{ height: heroSize, width: heroSize }}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <FoodIcon name={food.icon} size={heroSize} />
        ))}
    </View>
  );
};

const FoodSheet = ({
  food,
  position,
  total,
  tickets,
}: {
  food: FoodType;
  position: number;
  total: number;
  tickets: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const insets = useSafeAreaInsets();
  const { fill, ink } = sheetAt(skin, position);
  const dignity = Math.round(100 - (position / total) * 100);
  const name = caseFor(skin, food.name);
  const taunt = copy.taunts[position % copy.taunts.length]!(name);

  return (
    <View
      style={[
        styles.foodSheet,
        { backgroundColor: fill, paddingTop: insets.top + skin.spacing.top },
      ]}
    >
      <View
        accessible
        accessibilityLabel={`${copy.dignity} ${dignity}%`}
        style={styles.dignity}
      >
        <ThemedText size={skin.type.label} color={ink}>
          {copy.dignity}
        </ThemedText>
        <View
          style={[
            styles.dignityTrack,
            { borderColor: ink, borderWidth: skin.shape.border },
          ]}
        >
          <View
            style={{
              backgroundColor: ink,
              height: "100%",
              width: `${dignity}%`,
            }}
          />
        </View>
        <ThemedText size={skin.type.label} color={ink}>
          {`${dignity}%`}
        </ThemedText>
      </View>

      <View style={styles.metaRow}>
        <ThemedText size={skin.type.body} color={ink}>
          {`${pad(position + 1)}/${pad(total)} / ${skin.copy.levels[levelOf(food.inStockScore)]}`}
        </ThemedText>
        <ThemedText
          size={skin.type.body}
          color={ink}
          accessibilityLabel={`${skin.copy.tickets.counter} ${tickets}`}
        >
          {`${skin.copy.tickets.counter} ${padTickets(tickets)}`}
        </ThemedText>
      </View>

      <FoodHero food={food} />

      <Title size={skin.type.display.md} lines={2} color={ink}>
        {name}
      </Title>
      {Boolean(taunt) && (
        <Title size={skin.type.lead} lines={2} color={ink} header={false}>
          {taunt}
        </Title>
      )}
    </View>
  );
};

const FoodTicket = ({
  food,
  position,
  total,
}: {
  food: FoodType;
  position: number;
  total: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const tint = skin.colors.levels[level];
  const ink = skin.colors.onPaper;
  const { offset, color } = skin.shape.shadow;
  const notch = {
    backgroundColor: skin.colors.ground,
    borderColor: ink,
    borderWidth: skin.shape.border,
  };

  return (
    <View style={styles.ticketSlot}>
      <View
        style={[
          styles.ticket,
          {
            backgroundColor: tint,
            borderColor: ink,
            borderRadius: skin.shape.radius * 1.4,
            borderWidth: skin.shape.border,
          },
          offset > 0 && { boxShadow: `0 ${offset + 3}px 0 ${color}` },
        ]}
      >
        <View style={styles.ticketTop}>
          <ThemedText size={skin.type.caption} color={ink}>
            {`${position + 1}/${total}`}
          </ThemedText>
          <ThemedText size={skin.type.caption} color={ink}>
            {skin.copy.tickets.cardTag(SWIPE_TICKETS)}
          </ThemedText>
        </View>
        <FoodHero food={food} />
        <View
          style={[
            styles.ticketStub,
            {
              backgroundColor: skin.colors.paper,
              borderTopColor: ink,
              borderTopWidth: skin.shape.border,
            },
          ]}
        >
          <Title
            size={skin.type.display.sm}
            lines={1}
            color={ink}
            style={styles.flex}
          >
            {caseFor(skin, food.name)}
          </Title>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: tint,
                borderColor: ink,
                borderWidth: skin.shape.border - 1,
              },
            ]}
          >
            <ThemedText size={skin.type.caption} color={ink}>
              {skin.copy.levels[level]}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.notch, styles.notchLeft, notch]} />
        <View style={[styles.notch, styles.notchRight, notch]} />
      </View>
    </View>
  );
};

const TicketHud = ({
  tickets,
  position,
  total,
}: {
  tickets: number;
  position: number;
  total: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const ink = skin.colors.paper;

  return (
    <View style={[styles.hudWrap, { paddingTop: insets.top + skin.spacing.top }]}>
      <View
        style={[
          styles.hud,
          {
            backgroundColor: skin.colors.onPaper,
            borderColor: skin.colors.onPaper,
            borderRadius: skin.shape.radius,
            borderWidth: skin.shape.border,
          },
        ]}
      >
        <View style={styles.flex}>
          <ThemedText size={skin.type.caption} color={skin.colors.muted}>
            {skin.copy.tickets.counter}
          </ThemedText>
          <ThemedText
            accessibilityLiveRegion="polite"
            size={skin.type.headline}
            color={ink}
          >
            {padTickets(tickets)}
          </ThemedText>
        </View>
        <ThemedText size={skin.type.label} color={ink}>
          {`${Math.min(position + 1, total)}/${total}`}
        </ThemedText>
      </View>
    </View>
  );
};

const CashOut = ({
  earned,
  bonus,
  swipes,
}: {
  earned: number;
  bonus: number;
  swipes: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.tickets;
  const { counter, nextPrize } = useTickets();
  const balance = counter?.balance ?? 0;
  const ink = skin.colors.onPaper;
  const prizeName = nextPrize ? findSkin(nextPrize.skin).name : "";
  const goalLine = !nextPrize
    ? copy.allOwned
    : balance >= nextPrize.price
      ? copy.canAfford(prizeName)
      : copy.nextPrize(nextPrize.price - balance, prizeName);
  const progress = nextPrize
    ? Math.min(100, Math.round((balance / nextPrize.price) * 100))
    : 100;

  return (
    <View
      style={[
        styles.cashOut,
        {
          backgroundColor: skin.colors.paper,
          borderColor: ink,
          borderRadius: skin.shape.radius,
          borderWidth: skin.shape.border,
        },
        skin.shape.shadow.offset > 0 && {
          boxShadow: `0 ${skin.shape.shadow.offset}px 0 ${skin.shape.shadow.color}`,
        },
      ]}
    >
      <View style={styles.cashRow}>
        <ThemedText size={skin.type.body} color={ink}>
          {copy.rowSwipes(swipes)}
        </ThemedText>
        <ThemedText size={skin.type.body} color={ink}>
          {`+${earned - bonus}`}
        </ThemedText>
      </View>
      <View style={styles.cashRow}>
        <ThemedText size={skin.type.body} color={ink}>
          {copy.rowBonus}
        </ThemedText>
        <ThemedText size={skin.type.body} color={ink}>
          {`+${bonus}`}
        </ThemedText>
      </View>
      <View
        style={{ backgroundColor: ink, height: skin.shape.divider }}
      />
      <View style={styles.cashRow}>
        <ThemedText size={skin.type.lead} color={ink}>
          {copy.rowBalance}
        </ThemedText>
        <ThemedText size={skin.type.lead} color={ink}>
          {String(balance)}
        </ThemedText>
      </View>
      <View
        accessible
        accessibilityLabel={goalLine}
        style={[
          styles.goalTrack,
          {
            borderColor: ink,
            borderRadius: skin.shape.radius,
            borderWidth: skin.shape.border,
          },
        ]}
      >
        <View
          style={{
            backgroundColor: skin.colors.ground,
            height: "100%",
            width: `${progress}%`,
          }}
        />
      </View>
      <ThemedText size={skin.type.caption} color={ink}>
        {goalLine}
      </ThemedText>
    </View>
  );
};

const SwipeFoodGame = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const tickets = useTickets();
  const {
    foods,
    game,
    isLoading,
    isGameLoading,
    mutateFoods,
    mutateGame,
    swipe,
    update,
    completeSession,
  } = useSwipeFoods();

  const [screen, setScreen] = useState<"idle" | "play" | "done">("idle");
  const [swiped, setSwiped] = useState(0);
  const [outFoods, setOutFoods] = useState<FoodType[]>([]);
  const [intent, setIntent] = useState<SwipeDirection | null>(null);
  const [earned, setEarned] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [bonusPop, setBonusPop] = useState(0);
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const pendingUpdates = useRef<Promise<SwipeReward | null>[]>([]);
  const bonusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      mutateGame();
      mutateFoods();
      return () => {
        setScreen((current) => (current === "done" ? "idle" : current));
      };
    }, [mutateFoods, mutateGame]),
  );

  const isFramed = skin.game.card === "framed";
  const position = swiped;
  const total = swiped + (foods?.length ?? 0);
  useStatusBarStyle(
    screen === "done" ||
      (screen === "play" &&
        (isFramed || sheetAt(skin, position).fill === skin.colors.ground))
      ? skin.statusBarOnGround
      : "dark",
  );

  const begin = () => {
    setSwiped(0);
    setOutFoods([]);
    setEarned(0);
    setBonus(0);
    pendingUpdates.current = [];
    setScreen("play");
  };

  const collect = (reward: SwipeReward | null) => {
    if (!reward) return reward;
    setEarned((total) => total + reward.earned);
    setBonus((total) => total + reward.bonus);
    if (reward.balance !== null) tickets.setBalance(reward.balance);
    if (reward.bonus > 0) {
      setBonusPop(reward.bonus);
      if (bonusTimer.current) clearTimeout(bonusTimer.current);
      bonusTimer.current = setTimeout(() => setBonusPop(0), BONUS_VISIBLE_MS);
    }
    return reward;
  };

  const handleSwipe = (food: FoodType, direction: SwipeDirection) => {
    const isLast = foods?.length === 1;

    setSwiped((count) => count + 1);
    if (direction === "left") setOutFoods((out) => [...out, food]);
    swipe(food.id);
    pendingUpdates.current.push(
      update({ foodId: food.id, isInStock: IN_STOCK[direction] }).then(collect),
    );

    if (isLast) {
      setScreen("done");
      Promise.allSettled(pendingUpdates.current)
        .then(completeSession)
        .then(tickets.refresh);
    }
  };

  if (screen === "done") {
    return (
      <Sheet
        dock={
          <Dock>
            <KilButton
              height={skin.size.button.lg}
              fontSize={skin.type.title}
              label={copy.overShop}
              href="/shop"
            />
            <KilButton
              variant="ghost"
              height={skin.size.button.xs}
              fontSize={skin.type.label}
              label={copy.overAgain}
              onTouch={() => setScreen("idle")}
            />
          </Dock>
        }
      >
        <ScrollView contentContainerStyle={styles.doneContent}>
          <Title size={skin.type.display.lg} lines={2} color={skin.colors.accent}>
            {copy.overTitle}
          </Title>
          <Title size={skin.type.display.xl} lines={1} color={skin.colors.onGround} header={false}>
            {skin.copy.tickets.cashOut(earned)}
          </Title>
          {Boolean(copy.overDignity || copy.overScore) && (
            <View style={styles.scoreRow}>
              <ThemedText size={skin.type.body} color={skin.colors.danger}>
                {copy.overDignity}
              </ThemedText>
              <ThemedText size={skin.type.body} color={skin.colors.danger}>
                {copy.overScore}
              </ThemedText>
            </View>
          )}
          <CashOut earned={earned} bonus={bonus} swipes={swiped} />
          <Title size={skin.type.title} lines={2} color={skin.colors.onGround} header={false}>
            {outFoods.length ? copy.overWelcome : copy.overNothing}
          </Title>
          {outFoods.map((food) => (
            <View key={food.id} style={styles.outFood}>
              <Title
                size={skin.type.headline}
                lines={1}
                color={skin.colors.accent}
                header={false}
                style={styles.flex}
              >
                {caseFor(skin, food.name)}
              </Title>
              <FoodIcon name={food.icon} size={skin.size.icon.row} />
            </View>
          ))}
          <ThemedText size={skin.type.body} color={skin.colors.onGround}>
            {copy.overNext((game?.level ?? 1) + 1)}
          </ThemedText>
        </ScrollView>
      </Sheet>
    );
  }

  if ((isLoading && !foods) || (isGameLoading && !game)) {
    return <LoadingAnim />;
  }

  if (screen === "play" && foods?.length) {
    return (
      <View style={[styles.flex, { backgroundColor: skin.colors.ground }]}>
        {isFramed && (
          <TicketHud tickets={earned} position={position} total={total} />
        )}
        <View style={styles.flex}>
          <SwipeDeck
            items={foods}
            keyOf={(food) => food.id}
            allowUp
            stamps={{
              right: copy.stampIn,
              left: copy.stampOut,
              up: copy.stampUnsure,
            }}
            flingRef={flingRef}
            onIntent={setIntent}
            onSwipe={handleSwipe}
            renderSheet={(food, depth) =>
              isFramed ? (
                <FoodTicket
                  food={food}
                  position={position + depth}
                  total={total}
                />
              ) : (
                <FoodSheet
                  food={food}
                  position={position + depth}
                  total={total}
                  tickets={earned}
                />
              )
            }
          />
          {bonusPop > 0 && (
            <View pointerEvents="none" style={styles.bonusWrap}>
              <View
                style={[
                  styles.bonus,
                  {
                    backgroundColor: skin.colors.paper,
                    borderColor: skin.colors.onPaper,
                    borderRadius: skin.shape.radius,
                    borderWidth: skin.shape.border,
                  },
                ]}
              >
                <ThemedText
                  accessibilityLiveRegion="polite"
                  size={skin.type.title}
                  color={skin.colors.onPaper}
                >
                  {skin.copy.tickets.bonus(bonusPop)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
        <Dock row>
          <KilButton
            flex={1.2}
            fontSize={skin.type.lead}
            label={copy.out}
            accessibilityLabel="Out of stock"
            colors={deckButtonColors(skin, intent, "left")}
            onTouch={() => flingRef.current?.("left")}
          />
          <KilButton
            flex={1}
            fontSize={skin.type.body}
            label={copy.unsure}
            accessibilityLabel="Not sure"
            colors={deckButtonColors(skin, intent, "up", true)}
            onTouch={() => flingRef.current?.("up")}
          />
          <KilButton
            flex={1.2}
            fontSize={skin.type.lead}
            label={copy.inStock}
            accessibilityLabel="In stock"
            colors={deckButtonColors(skin, intent, "right")}
            onTouch={() => flingRef.current?.("right")}
          />
        </Dock>
      </View>
    );
  }

  if (game?.playedToday) {
    return (
      <Sheet
        fill={skin.colors.alert}
        dock={
          <Dock>
            <KilButton
              height={skin.size.button.xl}
              fontSize={skin.type.headline}
              label={copy.tomorrowAction}
              href="/shop"
            />
          </Dock>
        }
      >
        <ThemedText size={skin.type.body}>
          {copy.tomorrowLabel((game?.level ?? 1) + 1)}
        </ThemedText>
        <Title size={skin.type.display.lg}>{copy.tomorrowTitle}</Title>
        <ThemedText size={skin.type.lead}>{copy.tomorrowLine}</ThemedText>
      </Sheet>
    );
  }

  if (!foods?.length) {
    return (
      <EmptyData
        label={copy.emptyLabel}
        title={copy.emptyTitle}
        line={copy.emptyLine}
        fill={skin.colors.accent}
        onRefresh={() => mutateFoods()}
      />
    );
  }

  const balance = tickets.counter?.balance;

  return (
    <Sheet
      fill={skin.colors.accent}
      dock={
        <Dock>
          <KilButton
            height={skin.size.button.xl}
            fontSize={skin.type.headline}
            label={copy.start}
            onTouch={begin}
          />
        </Dock>
      }
    >
      <View style={styles.metaRow}>
        <ThemedText size={skin.type.body}>
          {copy.startLabel(game?.level ?? 1)}
        </ThemedText>
        {balance !== undefined && (
          <ThemedText size={skin.type.body}>
            {skin.copy.tickets.balance(balance)}
          </ThemedText>
        )}
      </View>
      <Title size={skin.type.display.lg}>{copy.startTitle}</Title>
      <ThemedText size={skin.type.lead}>{copy.startLine(foods.length)}</ThemedText>
    </Sheet>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    foodSheet: {
      flex: 1,
      gap: s.spacing.stack,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    dignity: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    dignityTrack: {
      flex: 1,
      height: s.size.meter,
    },
    metaRow: {
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "space-between",
    },
    hero: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      minHeight: 0,
      paddingVertical: s.spacing.small,
    },
    ticketSlot: {
      flex: 1,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.small,
    },
    ticket: {
      flex: 1,
      overflow: "hidden",
    },
    ticketTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.stack,
    },
    ticketStub: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.section,
      paddingVertical: s.spacing.stack,
    },
    chip: {
      borderRadius: s.shape.radius,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.tight,
    },
    notch: {
      borderRadius: s.size.check,
      height: s.size.check * 1.4,
      position: "absolute",
      top: "62%",
      width: s.size.check * 1.4,
    },
    notchLeft: {
      left: -s.size.check * 0.8,
    },
    notchRight: {
      right: -s.size.check * 0.8,
    },
    hudWrap: {
      paddingHorizontal: s.spacing.gutter,
    },
    hud: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.small,
    },
    bonusWrap: {
      alignItems: "center",
      left: 0,
      position: "absolute",
      right: 0,
      top: "38%",
    },
    bonus: {
      paddingHorizontal: s.spacing.section,
      paddingVertical: s.spacing.small,
      transform: [{ rotateZ: "-4deg" }],
    },
    scoreRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    doneContent: {
      gap: s.spacing.stack,
      paddingBottom: s.spacing.section,
    },
    cashOut: {
      gap: s.spacing.inline,
      padding: s.spacing.section,
    },
    cashRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    goalTrack: {
      height: s.size.meter + s.spacing.tight,
      overflow: "hidden",
    },
    outFood: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.stack,
    },
  });

export default SwipeFoodGame;
