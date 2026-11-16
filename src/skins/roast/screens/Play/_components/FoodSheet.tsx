import Title from "@/components/elements/Title";
import { ThemedText } from "@/components/elements/ThemedText";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sheetAt } from "./shared";
import FoodHero from "./FoodHero";

const pad = (value: number) => String(value).padStart(2, "0");

const padTickets = (value: number) => String(value).padStart(4, "0");

const FoodSheet = ({
  food,
  position,
  total,
  tickets,
}: {
  food: FoodType;
  position: number;
  total: number;
  tickets: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const insets = useSafeAreaInsets();
  const { fill, ink } = sheetAt(skin, position);
  const dignity = Math.round(100 - (position / total) * 100);
  const name = caseFor(skin, food.name);
  const taunt = copy.taunts[position % copy.taunts.length]!(name);

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

      <View style={styles.metaRow}>
        <ThemedText size={skin.type.body} color={ink} style={styles.metaMain}>
          {`${pad(position + 1)}/${pad(total)} / ${skin.copy.levels[levelOf(food.inStockScore)]}`}
        </ThemedText>
        <ThemedText
          size={skin.type.body}
          color={ink}
          style={styles.metaSide}
          accessibilityLabel={`${skin.copy.tickets.counter} ${tickets}`}
        >
          {`${skin.copy.tickets.counter} ${padTickets(tickets)}`}
        </ThemedText>
      </View>

      <FoodHero food={food} />

      <Title size={skin.type.display.md} lines={2} color={ink}>
        {name}
      </Title>
      {Boolean(taunt) && (
        <Title size={skin.type.lead} lines={2} color={ink} header={false}>
          {taunt}
        </Title>
      )}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
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
  });

export default FoodSheet;
