import AnimatedListItem from "@/components/elements/AnimatedListItem";
import KilButton from "@/components/elements/KilButton";
import { ArrowsUpDownIcon, XMarkIcon } from "react-native-heroicons/solid";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useShopList from "@/providers/ShopListProvider";
import { FoodType } from "@/types/model";
import { inStockScoreToDisplay } from "@/utils/scoreUtils";
import { useEffect, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  LinearTransition,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ShopListFoodRow from "./_components/ShopListFoodRow";
import ShopListFoodSuggestion from "./_components/ShopListFoodSuggestion";
import { router } from "expo-router";

const ShopList = () => {
  const theme = useTheme();
  const {
    foods,
    isFoodLoading,
    suggestedFoodIds,
    buyFood,
    snoozeFood,
    mutateFood,
    shopListId,
    startNewShopList,
    cancelShopList,
    setShopListId,
    orderFoodBy,
    reverseOrderFood,
    orderedBy,
  } = useShopList();
  const ref = useRef<View>(null);

  useEffect(() => {
    if (!shopListId) startNewShopList();
  }, [shopListId]);

  const headerHeight = 110;
  const suggestionHeight = 158;
  const suggestionBottom = useSharedValue<number>(0);
  const listHeight = useSharedValue<number>(10);
  const { height: winHeight } = Dimensions.get("window");

  const suggestionAnimStyle = useAnimatedStyle(() => ({
    bottom: withTiming(suggestionBottom.value),
  }));

  const listAnimStyle = useAnimatedStyle(() => ({
    height: withTiming(listHeight.value),
  }));

  const suggestionFood = foods?.find((f) => f.id === suggestedFoodIds[0]);
  const suggestionDisplay = inStockScoreToDisplay(
    suggestionFood?.inStockScore,
    theme,
  );

  useEffect(() => {
    if (suggestionFood) {
      suggestionBottom.value = 0;
      listHeight.value = winHeight - suggestionHeight - headerHeight;
    } else {
      suggestionBottom.value = -suggestionHeight;
      listHeight.value = winHeight - headerHeight;
    }
  }, [suggestionFood, winHeight]);

  const handleBuyFood = (foodId: number) => {
    buyFood(foodId);
  };

  const handleDismissFood = (foodId: number) => {
    snoozeFood(foodId);
  };

  const handleRefresh = () => {
    mutateFood();
  };

  const handleStopShopList = async () => {
    await cancelShopList();
    setShopListId(undefined);
    router.push("/");
  };

  if (!foods || foods.length === 0) {
    return (
      <ThemedView>
        <ThemedText>No foods available</ThemedText>
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: FoodType }) => (
    <AnimatedListItem key={item.id}>
      <ShopListFoodRow
        food={item}
        onBuy={handleBuyFood}
        onDismiss={handleDismissFood}
      />
    </AnimatedListItem>
  );

  const renderEmptyList = () => (
    <ThemedView>
      <ThemedText>No foods available</ThemedText>
    </ThemedView>
  );

  // const handleScrollToTop = () => {
  //   if (ref.current) {
  //     ref.current.scrollTop = 0;
  //   }
  // };

  return (
    <ThemedView
      style={{
        height: "100%",
        backgroundColor: suggestionDisplay.color[5],
        ...styles.container,
      }}
    >
      <ThemedView style={styles.buttonContainer}>
        <KilButton
          onTouch={handleStopShopList}
          style={{
            container: { ...styles.button, backgroundColor: theme.cancel[50] },
          }}
          Icon={<XMarkIcon size={30} color={theme.cancel[10]} />}
        />

        <KilButton
          onTouch={reverseOrderFood}
          style={{
            container: {
              ...styles.button,
              backgroundColor: theme.background,
            },
          }}
          Icon={<ArrowsUpDownIcon size={30} color={theme.text} />}
        />

        <KilButton
          onTouch={() => orderFoodBy(orderedBy === "score" ? "name" : "score")}
          style={{
            container: {
              ...styles.button,
              backgroundColor: theme.background,
            },
            label: { color: theme.textSecondary },
          }}
          label={orderedBy === "score" ? "AZ" : "09"}
          // Icon={<ArrowsUpDownIcon size={30} color={theme.cancel[10]} />}
        />
      </ThemedView>

      <Animated.View style={[styles.listContainer, listAnimStyle]}>
        <Animated.FlatList
          // onViewableItemsChanged={handleScrollToTop}
          data={foods}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          itemLayoutAnimation={LinearTransition.duration(250)}
          inverted
          // maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          ListEmptyComponent={renderEmptyList}
          onRefresh={handleRefresh}
          refreshing={isFoodLoading}
          // onViewableItemsChanged
        />
      </Animated.View>

      {suggestionFood && (
        <Animated.View
          exiting={SlideOutDown}
          style={[
            styles.suggestionContainer,
            { height: suggestionHeight },
            suggestionAnimStyle,
          ]}
        >
          <ShopListFoodSuggestion
            ref={ref}
            food={suggestionFood}
            onBuy={buyFood}
          />
        </Animated.View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },

  buttonContainer: {
    position: "absolute",
    top: 0,
    width: "100%",
    paddingTop: Spacing.seven,
    padding: Spacing.three,
    backgroundColor: "transparent",
    zIndex: 100,
    gap: 20,
  },
  button: {
    aspectRatio: 1,
    alignSelf: "flex-end",
  },

  listContainer: {
    paddingTop: Spacing.six,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  suggestionContainer: {
    position: "absolute",
    width: "100%",
    // bottom: 0,
    paddingBottom: Spacing.four,
    // height: "20%",
  },
});

export default ShopList;
