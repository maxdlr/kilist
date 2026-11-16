import { ThemedText } from "@/components/elements/ThemedText";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import { findSkin } from "@/skins";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";

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
  const { nextPrize, nextPrizeFunds: balance } = useTickets();
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

const createStyles = (s: Skin) =>
  StyleSheet.create({
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
  });

export default CashOut;
