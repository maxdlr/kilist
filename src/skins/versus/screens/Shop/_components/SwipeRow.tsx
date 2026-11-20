import V from "@/skins/versus/text";
import { FeedbackRow } from "@/components/elements/Feedback";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import type { SwipeOutcome } from "@/components/gestures/SwipeGesture/useSwipeGesture";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { VText } from "@/skins/versus/components";
import Row from "./Row";

const SwipeRow = ({
  food,
  onBuy,
  onLater,
  error,
  onRetry,
}: {
  food: FoodType;
  onBuy: SwipeOutcome;
  onLater: SwipeOutcome;
  error?: string | null;
  onRetry?: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [buying, setBuying] = useState(true);

  return (
    <FeedbackRow error={error} retryLabel={common.feedback.rowRetry} onRetry={onRetry}>
    <View
      accessibilityActions={[
        { name: "activate", label: V.shop.bought },
        { name: "later", label: V.shop.nextTime },
      ]}
      onAccessibilityAction={(event) => (event.nativeEvent.actionName === "later" ? onLater() : onBuy())}
      style={[styles.swipeSlot, { backgroundColor: buying ? P.agree : P.panelHigh }]}
    >
      <View style={[styles.behind, { justifyContent: buying ? "flex-start" : "flex-end" }]}>
        <VText face="display" size={skin.type.title} color={buying ? P.ink : P.soft}>
          {buying ? V.shop.bought : V.shop.nextTime}
        </VText>
      </View>
      <SwipeGesture
        onSwipeRight={onBuy}
        onSwipeLeft={onLater}
        onSwipingRight={() => setBuying(true)}
        onSwipingLeft={() => setBuying(false)}
        swipeThreshold={100}
        styles={{ box: styles.swipeBox }}
      >
        <Row food={food} done={false} />
      </SwipeGesture>
    </View>
    </FeedbackRow>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    swipeSlot: { borderRadius: s.shape.radius, overflow: "hidden" },
    behind: { alignItems: "center", bottom: 0, flexDirection: "row", left: 0, paddingHorizontal: s.spacing.section, position: "absolute", right: 0, top: 0 },
    swipeBox: { borderRadius: s.shape.radius },
  });

export default SwipeRow;
