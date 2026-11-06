import type { Skin } from "@/skins/types";
import AnimatedListItem from "@/components/elements/AnimatedListItem";
import Dock from "@/components/elements/Dock/Dock";
import EmptyData from "@/components/elements/EmptyData";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import Sheet from "@/components/elements/Sheet/Sheet";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useShopRun from "@/hooks/screens/useShopRun";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { FoodType } from "@/types/model";
import { StyleSheet, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ShopListFoodRow from "./_components/ShopListFoodRow";

const ShopList = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.shop;
  const insets = useSafeAreaInsets();
  const {
    foods,
    isFoodLoading,
    mutateFood,
    orderFoodBy,
    reverseOrderFood,
    orderedBy,
    buy: handleBuy,
    snooze: handleSnooze,
    stop: handleStop,
    refreshEmpty: handleRefreshEmpty,
    bought,
    handled,
    suggestion,
    rows,
  } = useShopRun();

  useStatusBarStyle(foods?.length ? skin.statusBarOnGround : "dark");

  if (isFoodLoading && foods === undefined) {
    return <LoadingAnim />;
  }

  if (!foods || foods.length === 0) {
    if (handled > 0) {
      return (
        <Sheet
          fill={skin.colors.accent}
          dock={
            <Dock>
              <KilButton
                height={skin.size.button.xl}
                fontSize={skin.type.headline}
                label={copy.doneAction}
                onTouch={handleStop}
              />
            </Dock>
          }
        >
          <ThemedText size={skin.type.body}>{copy.doneLabel(bought)}</ThemedText>
          <Title size={skin.type.display.lg}>{copy.doneTitle}</Title>
          <ThemedText size={skin.type.lead}>{copy.doneLine}</ThemedText>
        </Sheet>
      );
    }

    return (
      <EmptyData
        label={copy.emptyLabel}
        title={copy.emptyTitle}
        line={copy.emptyLine}
        onRefresh={handleRefreshEmpty}
      />
    );
  }

  const renderItem = ({ item }: { item: FoodType }) => (
    <AnimatedListItem key={item.id}>
      <ShopListFoodRow food={item} onBuy={handleBuy} onDismiss={handleSnooze} />
    </AnimatedListItem>
  );

  return (
    <View style={[styles.root, { backgroundColor: skin.colors.ground }]}>
      <View style={[styles.header, { paddingTop: insets.top + skin.spacing.top }]}>
        <Title size={skin.type.display.sm} lines={1} color={skin.colors.accent}>
          {copy.toGo(foods.length)}
        </Title>
      </View>

      <Animated.FlatList
        style={styles.flex}
        data={rows}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        itemLayoutAnimation={LinearTransition.duration(250)}
        inverted
        onRefresh={mutateFood}
        refreshing={isFoodLoading}
      />

      {suggestion && (
        <View>
          <ThemedText size={skin.type.caption} color={skin.colors.onGround} style={styles.label}>
            {copy.suggestion}
          </ThemedText>
          <ShopListFoodRow
            key={suggestion.id}
            food={suggestion}
            onBuy={handleBuy}
            onDismiss={handleSnooze}
          />
        </View>
      )}

      <Dock>
        <View style={styles.hints}>
          <ThemedText size={skin.type.label} color={skin.colors.onGround}>
            {copy.hintLater}
          </ThemedText>
          <ThemedText size={skin.type.label} color={skin.colors.onGround}>
            {copy.hintBought}
          </ThemedText>
        </View>
        <View style={styles.controls}>
          <KilButton
            flex={1}
            height={skin.size.button.sm}
            fontSize={skin.type.body}
            variant="danger"
            label={copy.stop}
            accessibilityLabel="Stop shopping"
            onTouch={handleStop}
          />
          <KilButton
            flex={1}
            height={skin.size.button.sm}
            fontSize={skin.type.body}
            variant="secondary"
            label={copy.flip}
            accessibilityLabel="Reverse the order"
            onTouch={reverseOrderFood}
          />
          <KilButton
            flex={1}
            height={skin.size.button.sm}
            fontSize={skin.type.body}
            variant="secondary"
            label={orderedBy === "score" ? copy.byName : copy.byScore}
            accessibilityLabel={
              orderedBy === "score" ? "Sort by name" : "Sort by score"
            }
            onTouch={() => orderFoodBy(orderedBy === "score" ? "name" : "score")}
          />
        </View>
      </Dock>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    header: {
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    label: {
      paddingHorizontal: s.spacing.gutter,
      paddingVertical: s.spacing.tight,
    },
    hints: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: s.spacing.small,
    },
    controls: {
      flexDirection: "row",
      gap: s.spacing.inline,
    },
  });

export default ShopList;
