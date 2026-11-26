import { DrawnMark } from "@/providers/MarkProvider";
import { getLang } from "@/i18n";
import { aisleList, aisleName, aisleOf } from "@/offline/foodNames";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { ScrollView, StyleSheet, View } from "react-native";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, Dot, Screen } from "@/skins/calm/components";
import type { TripSummary } from "../useShopView";

const aisleLabel = (food: FoodType) => {
  const id = aisleOf(food);
  const aisle = aisleList().find((entry) => entry.id === id);
  return aisle ? aisleName(aisle, getLang()) : T.shop.otherAisle;
};

const Section = ({
  title,
  line,
  foods,
  dot,
}: {
  title: string;
  line?: string;
  foods: FoodType[];
  dot: "filled" | "soft" | "hollow";
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  if (foods.length === 0) return null;
  return (
    <View>
      <View style={styles.sectionHead}>
        <CText size={skin.type.label} weight="semibold" accessibilityRole="header">
          {title}
        </CText>
        <CText size={skin.type.label} weight="semibold">
          {foods.length}
        </CText>
      </View>
      {line && (
        <CText size={skin.type.label} color={C.textSoft} style={styles.line}>
          {line}
        </CText>
      )}
      {foods.map((food) => (
        <View key={food.id} style={styles.row}>
          {dot === "hollow" ? (
            <View style={styles.hollow} />
          ) : (
            <Dot color={dot === "filled" ? C.positive : C.ring} size={10} />
          )}
          <CText size={skin.type.body} numberOfLines={1} style={styles.flex}>
            {food.name}
          </CText>
          <CText size={skin.type.caption} color={C.textFaint} numberOfLines={1}>
            {aisleLabel(food)}
          </CText>
        </View>
      ))}
    </View>
  );
};

const TripRecap = ({ summary, onClose }: { summary: TripSummary; onClose: () => void }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const bought = summary.bought.length;
  const total = bought + summary.later.length + summary.left.length;
  const share = total > 0 ? bought / total : 0;

  return (
    <Screen dock={<CButton label={T.shop.recapOk} onPress={onClose} />}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.head}>
          <View style={styles.titleRow}>
            <DrawnMark kind="done" color={C.positive} />
            <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
              {T.shop.tripDone}
            </CText>
          </View>
          <CText size={skin.type.body} color={C.textSoft}>
            {T.shop.recapLine(bought, summary.later.length)}
          </CText>
          <View accessible accessibilityRole="image" accessibilityLabel={T.shop.recapBar(bought, total)} style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.round(share * 100)}%` }]} />
          </View>
        </View>
        <Section title={T.shop.bought} foods={summary.bought} dot="filled" />
        <Section title={T.shop.nextTime} line={T.shop.recapLaterLine} foods={summary.later} dot="soft" />
        <Section title={T.shop.recapLeft} line={T.shop.recapLeftLine} foods={summary.left} dot="hollow" />
      </ScrollView>
    </Screen>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    body: { flexGrow: 1, gap: s.spacing.section, justifyContent: "center", paddingVertical: s.spacing.section },
    head: { gap: s.spacing.small },
    titleRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    bar: { backgroundColor: C.line, borderRadius: 2, height: 4, marginTop: s.spacing.small, overflow: "hidden" },
    barFill: { backgroundColor: C.positive, height: 4 },
    sectionHead: { flexDirection: "row", justifyContent: "space-between", paddingBottom: s.spacing.small },
    line: { paddingBottom: s.spacing.small },
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.button.md - 6,
    },
    hollow: { borderColor: C.ring, borderRadius: 5, borderWidth: 1.5, height: 10, width: 10 },
  });

export default TripRecap;
