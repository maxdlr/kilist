import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useShop from "@/providers/ShopProvider";
import { FoodType } from "@/types/model";
import { inStockScoreToDisplay } from "@/utils/scoreUtils";
import { useEffect, useRef } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import Animated, {
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ShopFoodRow from "./_components/ShopFoodRow";
import ShopFoodSuggestion from "./_components/ShopFoodSuggestion";

const ShopList = () => {
  const theme = useTheme();
  const {
    foods,
    isFoodLoading,
    suggestedFoodIds,
    buyFood,
    snoozeFood,
    mutateFood,
    session,
    startNewSession,
  } = useShop();
  const ref = useRef<View>(null);

  // console.log(foods);

  useEffect(() => {
    if (!session) startNewSession();
  }, [session]);

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

  const handleOnRefresh = () => {
    mutateFood();
  };

  if (!foods || foods.length === 0) {
    return (
      <ThemedView>
        <ThemedText>No foods available</ThemedText>
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: FoodType }) => {
    return (
      <ShopFoodRow
        food={item}
        onBuy={handleBuyFood}
        onDismiss={handleDismissFood}
      />
    );
  };

  return (
    <ThemedView
      style={{
        height: "100%",
        position: "relative",
        backgroundColor: suggestionDisplay.color[5],
      }}
    >
      <Animated.View style={[styles.container, listAnimStyle]}>
        <FlatList
          data={foods}
          renderItem={renderItem}
          inverted
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          // onViewableItemsChanged
          ListEmptyComponent={() => (
            <ThemedView>
              <ThemedText>No foods available</ThemedText>
            </ThemedView>
          )}
          onRefresh={handleOnRefresh}
          refreshing={isFoodLoading}
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
          <ShopFoodSuggestion ref={ref} food={suggestionFood} onBuy={buyFood} />
        </Animated.View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    position: "relative",
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
