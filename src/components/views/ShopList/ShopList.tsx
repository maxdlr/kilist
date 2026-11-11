import common from "@/i18n/common";
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
import { caseFor } from "@/skins";
import { FoodType } from "@/types/model";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XMarkIcon } from "react-native-heroicons/outline";
import ShopListFoodRow from "./_components/ShopListFoodRow";
import ShopPanels from "./_components/ShopPanels";

const ShopList = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.shop;
  const insets = useSafeAreaInsets();
  const run = useShopRun();
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
  } = run;

  useStatusBarStyle(foods?.length ? skin.statusBarOnGround : "dark");

  if (run.isLoading) {
    return <LoadingAnim />;
  }

  if (!run.isStarted && !run.isEmpty) {
    return (
      <Sheet
        fill={skin.colors.accent}
        dock={
          <Dock>
            <KilButton
              height={skin.size.button.xl}
              fontSize={skin.type.headline}
              label={caseFor(skin, common.shop.start)}
              onTouch={run.start}
            />
          </Dock>
        }
      >
        <ThemedText size={skin.type.body}>{caseFor(skin, common.shop.startLabel)}</ThemedText>
        <Title size={skin.type.display.lg}>{caseFor(skin, common.shop.startTitle(run.preview.length))}</Title>
        <ThemedText size={skin.type.lead}>{caseFor(skin, common.shop.startRight)}</ThemedText>
        <ThemedText size={skin.type.lead}>{caseFor(skin, common.shop.startLeft)}</ThemedText>
      </Sheet>
    );
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
        <Title
          size={skin.type.display.sm}
          lines={1}
          color={skin.colors.accent}
          style={styles.flex}
          gutter={skin.spacing.gutter * 2 + skin.size.button.xs}
        >
          {copy.toGo(foods.length)}
        </Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={common.stopShopping}
          onPress={run.askStop}
          hitSlop={skin.spacing.small}
          style={styles.close}
        >
          <XMarkIcon size={skin.size.icon.action} color={skin.colors.muted} strokeWidth={2.5} />
        </Pressable>
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
            variant="secondary"
            label={caseFor(skin, common.shop.add)}
            onTouch={run.openAdd}
          />
          <KilButton
            flex={1}
            height={skin.size.button.sm}
            fontSize={skin.type.body}
            label={caseFor(skin, common.shop.finish)}
            onTouch={run.finish}
          />
        </View>
        <View style={styles.controls}>
          <KilButton
            flex={1}
            height={skin.size.button.sm}
            fontSize={skin.type.body}
            variant="secondary"
            label={copy.flip}
            accessibilityLabel={common.reverseOrder}
            onTouch={reverseOrderFood}
          />
          <KilButton
            flex={1}
            height={skin.size.button.sm}
            fontSize={skin.type.body}
            variant="secondary"
            label={orderedBy === "score" ? copy.byName : copy.byScore}
            accessibilityLabel={
              orderedBy === "score" ? common.sortByName : common.sortByScore
            }
            onTouch={() => orderFoodBy(orderedBy === "score" ? "name" : "score")}
          />
        </View>
      </Dock>
      <ShopPanels run={run} />
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
    close: { alignItems: "center", height: s.size.button.xs, justifyContent: "center", width: s.size.button.xs },
    header: {
      alignItems: "center",
      flexDirection: "row",
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
