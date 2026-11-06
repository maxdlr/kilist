import useShopRun from "@/hooks/screens/useShopRun";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { calmPalette as C } from "..";
import { CButton, CText, Dot, Screen } from "./parts";
import { CalmLoading, CalmMessage } from "./States";

const Circle = ({ done }: { done: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={[styles.circle, done ? styles.circleDone : { borderColor: C.ring }]}>
      {done && (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12l4 4 10-10" stroke={C.ground} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
      {!done && <View style={{ width: skin.spacing.hair }} />}
    </View>
  );
};

const CalmShop = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const run = useShopRun();
  const [basket, setBasket] = useState<FoodType[]>([]);
  const [later, setLater] = useState<FoodType[]>([]);
  const [result, setResult] = useState<{ bought: number; left: number } | null>(null);
  const remaining = run.foods ?? [];

  const tick = (food: FoodType) => {
    setBasket((list) => [...list, food]);
    run.buy(food.id);
  };

  const postpone = (food: FoodType) => {
    setLater((list) => [...list, food]);
    run.snooze(food.id);
  };

  const finish = async () => {
    setResult({ bought: basket.length, left: remaining.length + later.length });
    await run.cancelShopList();
  };

  const leave = () => {
    run.setShopListId(undefined);
    setBasket([]);
    setLater([]);
    setResult(null);
    router.navigate("/");
  };

  if (result) {
    return (
      <CalmMessage
        title="Done."
        line={`${result.bought} bought${result.left ? `, ${result.left} left for next time` : ""}.`}
        dock={<CButton label="Back to today" onPress={leave} />}
      />
    );
  }

  if (run.isLoading) return <CalmLoading />;

  if (run.isEmpty && basket.length === 0 && later.length === 0) {
    return (
      <CalmMessage
        title={skin.copy.shop.emptyTitle}
        line={skin.copy.shop.emptyLine}
        dock={<CButton variant="secondary" label="Back to today" onPress={() => router.navigate("/")} />}
      />
    );
  }

  return (
    <Screen padded={false} dock={<CButton label="Done shopping" onPress={finish} />}>
      <View style={styles.head}>
        <Pressable accessibilityRole="button" onPress={() => router.navigate("/")} style={styles.back}>
          <CText size={skin.type.label + 1} color={C.soft}>Back</CText>
        </Pressable>
        <View style={styles.titleRow}>
          <CText weight="medium" size={skin.type.headline} accessibilityRole="header">List</CText>
          <CText size={skin.type.label} color={C.soft}>{`${remaining.length} to buy`}</CText>
        </View>
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
        {remaining.map((food) => {
          const level = levelOf(food.inStockScore);
          return (
            <View key={food.id} style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}. Tap when it's in the basket`}
                onPress={() => tick(food)}
                style={styles.rowMain}
              >
                <Circle done={false} />
                <CText size={skin.type.lead} style={styles.flex} numberOfLines={1}>{food.name}</CText>
                <Dot color={skin.colors.levels[level]} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${food.name}: next time`}
                onPress={() => postpone(food)}
                style={styles.later}
              >
                <CText size={skin.type.label} color={C.soft}>Later</CText>
              </Pressable>
            </View>
          );
        })}
        {basket.length > 0 && (
          <>
            <CText size={skin.type.label} color={C.soft} style={styles.basketLabel}>In the basket</CText>
            {basket.map((food) => (
              <View key={`basket-${food.id}`} accessible accessibilityLabel={`${food.name}, in the basket`} style={styles.row}>
                <View style={styles.rowMain}>
                  <Circle done />
                  <CText size={skin.type.lead} color={C.faint} style={[styles.flex, styles.struck]} numberOfLines={1}>
                    {food.name}
                  </CText>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    head: { gap: s.spacing.tight, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
    back: { alignSelf: "flex-start", justifyContent: "center", minHeight: s.size.button.xs },
    titleRow: { alignItems: "baseline", flexDirection: "row", justifyContent: "space-between" },
    list: { paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter },
    row: {
      alignItems: "center",
      borderTopColor: C.hairline,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.shop,
    },
    rowMain: { alignItems: "center", flex: 1, flexDirection: "row", gap: s.spacing.dock - 2, minHeight: s.size.row.shop },
    later: { justifyContent: "center", minHeight: s.size.button.xs, paddingLeft: s.spacing.small },
    circle: {
      alignItems: "center",
      borderRadius: s.size.check,
      borderWidth: 1.5,
      height: s.size.check,
      justifyContent: "center",
      width: s.size.check,
    },
    circleDone: { backgroundColor: C.ink, borderColor: C.ink },
    basketLabel: { paddingBottom: s.spacing.small, paddingTop: s.spacing.gutter },
    struck: { textDecorationLine: "line-through" },
  });

export default CalmShop;
