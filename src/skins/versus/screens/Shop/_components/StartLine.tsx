import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import { buyRangeOf } from "@/hooks/screens/useBuyRange";
import V from "@/skins/versus/text";
import FoodPicture from "@/components/elements/FoodIcon/FoodPicture";
import common from "@/i18n/common";
import { mmss } from "@/skins/versus/hooks/api";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { StyleSheet, View } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { Card, Kicker, Screen, VButton, VText } from "@/skins/versus/components";
import StartLight from "./StartLight";

const LINEUP_SIZE = 9;

const StartLine = ({
  foods,
  record,
  onStart,
  selected,
  onPick,
  onCancel,
  onLater,
}: {
  foods: FoodType[];
  record: { ms: number; username: string } | null;
  onStart: () => void;
  selected: number[];
  onPick: (food: FoodType) => void;
  onCancel: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const more = foods.length - LINEUP_SIZE;
  const selecting = selected.length > 0;

  return (
    <Screen
      dock={
        selecting ? (
          <View style={styles.selectDock}>
            <VButton flex={1} variant="secondary" label={skin.copy.common.cancel} onPress={onCancel} />
            <VButton flex={1} label={common.shop.buyLater(selected.length)} onPress={onLater} />
          </View>
        ) : (
          <VButton big label={V.shop.start} onPress={onStart} />
        )
      }
    >
      <Kicker>{V.shop.kicker}</Kicker>
      <View style={styles.startHero}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.lights}>
          {[P.buy, P.tie, P.agree].map((color, index) => (
            <StartLight key={color} color={color} index={index} />
          ))}
        </View>
        <VText face="pixel" size={skin.type.display.md} color={P.you}>{mmss(0)}</VText>
        <VText face="display" size={skin.type.headline} style={styles.centerText}>{V.shop.toBuy(buyRangeOf(foods).low, foods.length)}</VText>
      </View>
      <Card>
        <VText face="bold" size={skin.type.lead}>
          {record ? V.home.timeToBeat(mmss(record.ms)) : V.shop.setRecord}
        </VText>
        {record && <VText size={skin.type.label} color={P.soft}>{V.shop.houseRecord(record.username)}</VText>}
        <VText size={skin.type.label} color={P.soft}>{V.shop.clockLine}</VText>
      </Card>
      <View style={styles.lineup}>
        {foods.slice(0, LINEUP_SIZE).map((food) => (
          <Press
            key={food.id}
            accessibilityRole="button"
            accessibilityLabel={food.name}
            accessibilityState={{ selected: selected.includes(food.id) }}
            onPress={() => onPick(food)}
            style={withPressed([styles.lineupCell, selected.includes(food.id) && styles.lineupPicked])}
          >
            <FoodPicture food={food} size={skin.size.icon.row - 8} />
          </Press>
        ))}
        {more > 0 && (
          <View style={styles.lineupCell}>
            <VText face="bold" size={skin.type.label} color={P.ink}>{V.shop.lineup(more)}</VText>
          </View>
        )}
      </View>
      {selecting && (
        <VText face="bold" size={skin.type.lead} color={P.action} accessibilityLiveRegion="polite">
          {common.shop.selected(selected.length)}
        </VText>
      )}
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    centerText: { textAlign: "center" },
    startHero: { alignItems: "center", flex: 1, gap: s.spacing.inline, justifyContent: "center" },
    lights: { flexDirection: "row", gap: s.spacing.inline },
    lineupPicked: { backgroundColor: P.action },
    selectDock: { flexDirection: "row", gap: s.spacing.inline },
    lineup: { flexDirection: "row", flexWrap: "wrap", gap: s.spacing.small },
    lineupCell: {
      alignItems: "center",
      aspectRatio: 1,
      backgroundColor: P.white,
      borderRadius: s.spacing.dock - 2,
      flexBasis: "17%",
      flexGrow: 0,
      justifyContent: "center",
    },
  });

export default StartLine;
