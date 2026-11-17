import SuggestionStep from "@/components/features/Play/SuggestionStep";
import useDailySuggestion from "@/hooks/screens/useDailySuggestion";
import common from "@/i18n/common";
import Dock from "@/components/elements/Dock";
import EmptyData from "@/components/elements/EmptyData";
import FoodIcon from "@/components/elements/FoodIcon";
import KilButton from "@/components/elements/KilButton";
import { PlayIcon } from "@/components/icons";
import LoadingAnim from "@/components/elements/LoadingAnim";
import Sheet from "@/components/elements/Sheet";
import ActionPanel from "@/components/elements/ActionPanel";
import SwipeDeck, { deckButtonColors } from "@/components/elements/SwipeDeck";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useSwipeGame from "@/hooks/screens/useSwipeGame";
import { caseFor } from "@/skins";
import type { Skin } from "@/skins/types";
import { ScrollView, StyleSheet, View } from "react-native";
import { sheetAt } from "./_components/shared";
import FoodSheet from "./_components/FoodSheet";
import CashOut from "./_components/CashOut";

const SwipeFoodGame = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const game = useSwipeGame();
  const { screen, position, total, intent } = game;
  const suggestion = useDailySuggestion(screen === "done" && game.mode === "daily");

  useStatusBarStyle(
    screen === "done" ||
      (screen === "play" && sheetAt(skin, position).fill === skin.colors.ground)
      ? skin.statusBarOnGround
      : "dark",
  );

  if (suggestion.item) return <SuggestionStep suggestion={suggestion} />;

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
            {game.allSorted ? (
              <ThemedText size={skin.type.lead} color={skin.colors.accent} style={styles.allSorted}>
                {copy.allChecked}
              </ThemedText>
            ) : (
              <KilButton
                variant="secondary"
                height={skin.size.button.sm}
                fontSize={skin.type.body}
                label={copy.playAgain}
                icon={(color) => <PlayIcon size={skin.size.icon.action} color={color} />}
                onTouch={game.playAgain}
              />
            )}
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
          onLongPress={game.askRemove}
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
        <ActionPanel request={game.removeRequest} onClose={game.cancelRemove} />
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
            {game.allSorted ? (
              <ThemedText size={skin.type.lead} style={styles.allSorted}>
                {copy.allChecked}
              </ThemedText>
            ) : (
              <KilButton
                variant="secondary"
                height={skin.size.button.sm}
                fontSize={skin.type.body}
                label={copy.playAgain}
                icon={(color) => <PlayIcon size={skin.size.icon.action} color={color} />}
                onTouch={game.playAgain}
              />
            )}
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
        <ThemedText size={skin.type.body} style={styles.metaMain}>{copy.startLabel(game.level)}</ThemedText>
        {game.balance !== undefined && (
          <ThemedText size={skin.type.body} style={styles.metaSide}>
            {skin.copy.tickets.balance(game.balance)}
          </ThemedText>
        )}
      </View>
      <Title size={skin.type.display.lg}>{copy.startTitle}</Title>
      <ThemedText size={skin.type.lead}>{copy.startLine(game.foods.length)}</ThemedText>
    </Sheet>
  );
};

export default SwipeFoodGame;

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    allSorted: { textAlign: "center" },
    metaRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "space-between",
    },
    metaMain: {
      flex: 1,
      minWidth: 0,
    },
    metaSide: {
      flexShrink: 0,
      textAlign: "right",
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
    outFood: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.stack,
    },
  });
