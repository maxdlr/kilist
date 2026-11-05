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
import useSwipeFoods from "@/providers/SwipeFoodsProvider";
import type { Skin,  } from "@/skins/types";
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

const pad = (value: number) => String(value).padStart(2, "0");

const sheetAt = (skin: Skin, position: number) =>
  skin.colors.sheets[position % skin.colors.sheets.length]!;

const FoodSheet = ({
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
  const copy = skin.copy.swipe;
  const insets = useSafeAreaInsets();
  const { fill, ink } = sheetAt(skin, position);
  const dignity = Math.round(100 - (position / total) * 100);
  const name = food.name.toUpperCase();
  const taunt = copy.taunts[position % copy.taunts.length]!(name);
  const [heroSize, setHeroSize] = useState(0);

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

      <ThemedText size={skin.type.body} color={ink}>
        {`${pad(position + 1)}/${pad(total)} / ${skin.copy.levels[levelOf(food.inStockScore)]}`}
      </ThemedText>

      <View
        style={styles.hero}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setHeroSize(Math.floor(Math.min(width, height - 2 * skin.spacing.small)));
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

      <Title size={skin.type.display.md} lines={2} color={ink}>
        {name}
      </Title>
      <Title size={skin.type.lead} lines={2} color={ink} header={false}>
        {taunt}
      </Title>
    </View>
  );
};

const SwipeFoodGame = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
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
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const pendingUpdates = useRef<Promise<void>[]>([]);

  useFocusEffect(
    useCallback(() => {
      mutateGame();
      mutateFoods();
      return () => {
        setScreen((current) => (current === "done" ? "idle" : current));
      };
    }, [mutateFoods, mutateGame]),
  );

  const position = swiped;
  const total = swiped + (foods?.length ?? 0);
  useStatusBarStyle(
    screen === "done" ||
      (screen === "play" && sheetAt(skin, position).fill === skin.colors.ground)
      ? skin.statusBarOnGround
      : "dark",
  );

  const begin = () => {
    setSwiped(0);
    setOutFoods([]);
    pendingUpdates.current = [];
    setScreen("play");
  };

  const handleSwipe = (food: FoodType, direction: SwipeDirection) => {
    const isLast = foods?.length === 1;

    setSwiped((count) => count + 1);
    if (direction === "left") setOutFoods((out) => [...out, food]);
    swipe(food.id);
    pendingUpdates.current.push(
      update({ foodId: food.id, isInStock: IN_STOCK[direction] }),
    );

    if (isLast) {
      setScreen("done");
      Promise.allSettled(pendingUpdates.current).then(completeSession);
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
        <Title size={skin.type.display.lg} lines={2} color={skin.colors.accent}>
          {copy.overTitle}
        </Title>
        <View style={styles.scoreRow}>
          <ThemedText size={skin.type.body} color={skin.colors.danger}>
            {copy.overDignity}
          </ThemedText>
          <ThemedText size={skin.type.body} color={skin.colors.danger}>
            {copy.overScore}
          </ThemedText>
        </View>
        <Title size={skin.type.title} lines={2} color={skin.colors.onGround} header={false}>
          {outFoods.length ? copy.overWelcome : copy.overNothing}
        </Title>
        <ScrollView style={styles.outList}>
          {outFoods.map((food) => (
            <View key={food.id} style={styles.outFood}>
              <Title
                size={skin.type.headline}
                lines={1}
                color={skin.colors.accent}
                header={false}
                style={styles.flex}
              >
                {food.name.toUpperCase()}
              </Title>
              <FoodIcon name={food.icon} size={skin.size.icon.row} />
            </View>
          ))}
        </ScrollView>
        <ThemedText size={skin.type.body} color={skin.colors.onGround}>
          {copy.overNext((game?.level ?? 1) + 1)}
        </ThemedText>
      </Sheet>
    );
  }

  if ((isLoading && !foods) || (isGameLoading && !game)) {
    return <LoadingAnim />;
  }

  if (screen === "play" && foods?.length) {
    return (
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
          renderSheet={(food, depth) => (
            <FoodSheet food={food} position={position + depth} total={total} />
          )}
        />
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
      <ThemedText size={skin.type.body}>{copy.startLabel(game?.level ?? 1)}</ThemedText>
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
    hero: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      minHeight: 0,
      paddingVertical: s.spacing.small,
    },
    scoreRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    outList: {
      flexGrow: 0,
      marginVertical: s.spacing.inline,
    },
    outFood: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.stack,
    },
  });

export default SwipeFoodGame;
