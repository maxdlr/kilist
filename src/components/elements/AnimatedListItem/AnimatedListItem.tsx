import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

// Shared enter animation for any row that can appear in a list (Inventory,
// ShopList, ...) — new data, search results, etc. Exit/reflow is handled by
// the FlatList's own itemLayoutAnimation prop, not here: stacking a separate
// per-item exiting animation on top of it caused removed rows to visually
// linger and overlap the reflowed siblings underneath.
const AnimatedListItem = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  return (
    <Animated.View entering={FadeIn.duration(250)} style={style}>
      {children}
    </Animated.View>
  );
};

export default AnimatedListItem;
