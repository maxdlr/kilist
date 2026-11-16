import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import AnimatedListItem from "@/components/elements/AnimatedListItem";
import Dock from "@/components/elements/Dock";
import EmptyData from "@/components/elements/EmptyData";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim";
import Sheet from "@/components/elements/Sheet";
import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useShopRun from "@/hooks/screens/useShopRun";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { FoodType } from "@/types/model";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XmarkIcon } from "@/components/icons";
import ShopListFoodRow from "./_components/ShopFoodRow";
import ShopPanels from "@/components/features/Shop/ShopPanels";

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
    const selecting = run.selected.length > 0;
    return (
      <View style={styles.flex}>
      <Sheet
        fill={skin.colors.accent}
        dock={
          <Dock>
            {selecting ? (
              <View style={styles.controls}>
                <KilButton
                  flex={1}
                  height={skin.size.button.xl}
                  fontSize={skin.type.lead}
                  variant="secondary"
                  label={skin.copy.common.cancel}
                  onTouch={run.clearSelection}
                />
                <KilButton
                  flex={1}
                  height={skin.size.button.xl}
                  fontSize={skin.type.lead}
                  label={caseFor(skin, common.shop.buyLater(run.selected.length))}
                  onTouch={run.buyLater}
                />
              </View>
            ) : (
              <KilButton
                height={skin.size.button.xl}
                fontSize={skin.type.headline}
                label={caseFor(skin, common.shop.start)}
                onTouch={run.start}
              />
            )}
          </Dock>
        }
      >
        <ThemedText size={skin.type.body}>
          {caseFor(skin, selecting ? common.shop.selected(run.selected.length) : common.shop.startLabel)}
        </ThemedText>
        <Title size={skin.type.display.lg}>{caseFor(skin, common.shop.startTitle(run.range.low, run.range.high))}</Title>
        <ThemedText size={skin.type.lead}>{caseFor(skin, common.shop.startRight)}</ThemedText>
        <ThemedText size={skin.type.lead}>{caseFor(skin, common.shop.startLeft)}</ThemedText>
        <ScrollView style={styles.tagScroll} contentContainerStyle={styles.tags}>
          {run.preview.map((food) => {
            const picked = run.selected.includes(food.id);
            return (
              <Press
                key={food.id}
                accessibilityRole="button"
                accessibilityState={{ selected: picked }}
                onPress={() => run.toggleSelect(food)}
                style={withPressed([
                  styles.tag,
                  { borderColor: skin.colors.onPaper },
                  picked && { backgroundColor: skin.colors.onPaper },
                ])}
              >
                <ThemedText size={skin.type.body} color={picked ? skin.colors.accent : undefined} numberOfLines={1}>
                  {caseFor(skin, food.name)}
                </ThemedText>
              </Press>
            );
          })}
        </ScrollView>
      </Sheet>
      </View>
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
        <Press
          accessibilityRole="button"
          accessibilityLabel={common.stopShopping}
          onPress={run.askStop}
          hitSlop={skin.spacing.small}
          style={withPressed(styles.close)}
        >
          <XmarkIcon size={skin.size.icon.action} color={skin.colors.muted} strokeWidth={2.5} />
        </Press>
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
    tagScroll: { flexGrow: 0, flexShrink: 1 },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    tag: {
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.tight,
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
