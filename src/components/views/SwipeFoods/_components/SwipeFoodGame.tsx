import common from "@/i18n/common";
import Dock from "@/components/elements/Dock/Dock";
import EmptyData from "@/components/elements/EmptyData";
import FoodIcon from "@/components/elements/FoodIcon";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import Sheet from "@/components/elements/Sheet/Sheet";
import SwipeDeck, {
  deckButtonColors,
} from "@/components/elements/SwipeDeck/SwipeDeck";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useSwipeGame from "@/hooks/screens/useSwipeGame";
import useTickets from "@/providers/TicketsProvider";
import { caseFor, findSkin } from "@/skins";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { Image } from "expo-image";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


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
  const game = useSwipeGame();
  const { screen, position, total, intent } = game;

  useStatusBarStyle(
    screen === "done" ||
      (screen === "play" && sheetAt(skin, position).fill === skin.colors.ground)
      ? skin.statusBarOnGround
      : "dark",
  );

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
              onTouch={game.reset}
            />
          </Dock>
        }
      >
        <ScrollView contentContainerStyle={styles.doneContent}>
          <Title size={skin.type.display.lg} lines={2} color={skin.colors.accent}>
            {copy.overTitle}
          </Title>
          <Title size={skin.type.display.xl} lines={1} color={skin.colors.onGround} header={false}>
            {skin.copy.tickets.cashOut(game.earned)}
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
          <CashOut earned={game.earned} bonus={game.bonus} swipes={position} />
          <Title size={skin.type.title} lines={2} color={skin.colors.onGround} header={false}>
            {game.outFoods.length ? copy.overWelcome : copy.overNothing}
          </Title>
          {game.outFoods.map((food) => (
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
            {copy.overNext(game.level + 1)}
          </ThemedText>
        </ScrollView>
      </Sheet>
    );
  }

  if (screen === "loading") return <LoadingAnim />;

  if (screen === "play") {
    return (
      <View style={[styles.flex, { backgroundColor: skin.colors.ground }]}>
        <View style={styles.flex}>
          <SwipeDeck
            items={game.foods}
            keyOf={(food) => food.id}
            allowUp
            stamps={{
              right: copy.stampIn,
              left: copy.stampOut,
              up: copy.stampUnsure,
            }}
            flingRef={game.flingRef}
            onIntent={game.setIntent}
            onSwipe={game.handleSwipe}
            renderSheet={(food, depth) => (
              <FoodSheet
                food={food}
                position={position + depth}
                total={total}
                tickets={game.earned}
              />
            )}
          />
          {game.bonusPop > 0 && (
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
                  {skin.copy.tickets.bonus(game.bonusPop)}
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
            accessibilityLabel={common.ariaOut}
            colors={deckButtonColors(skin, intent, "left")}
            onTouch={() => game.fling("left")}
          />
          <KilButton
            flex={1}
            fontSize={skin.type.body}
            label={copy.unsure}
            accessibilityLabel={common.ariaUnsure}
            colors={deckButtonColors(skin, intent, "up", true)}
            onTouch={() => game.fling("up")}
          />
          <KilButton
            flex={1.2}
            fontSize={skin.type.lead}
            label={copy.inStock}
            accessibilityLabel={common.ariaIn}
            colors={deckButtonColors(skin, intent, "right")}
            onTouch={() => game.fling("right")}
          />
        </Dock>
      </View>
    );
  }

  if (screen === "closed") {
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
          {copy.tomorrowLabel(game.level + 1)}
        </ThemedText>
        <Title size={skin.type.display.lg}>{copy.tomorrowTitle}</Title>
        <ThemedText size={skin.type.lead}>{copy.tomorrowLine}</ThemedText>
      </Sheet>
    );
  }

  if (screen === "empty") {
    return (
      <EmptyData
        label={copy.emptyLabel}
        title={copy.emptyTitle}
        line={copy.emptyLine}
        fill={skin.colors.accent}
        onRefresh={game.refreshFoods}
      />
    );
  }

  return (
    <Sheet
      fill={skin.colors.accent}
      dock={
        <Dock>
          <KilButton
            height={skin.size.button.xl}
            fontSize={skin.type.headline}
            label={copy.start}
            onTouch={game.begin}
          />
        </Dock>
      }
    >
      <View style={styles.metaRow}>
        <ThemedText size={skin.type.body}>{copy.startLabel(game.level)}</ThemedText>
        {game.balance !== undefined && (
          <ThemedText size={skin.type.body}>
            {skin.copy.tickets.balance(game.balance)}
          </ThemedText>
        )}
      </View>
      <Title size={skin.type.display.lg}>{copy.startTitle}</Title>
      <ThemedText size={skin.type.lead}>{copy.startLine(game.foods.length)}</ThemedText>
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
