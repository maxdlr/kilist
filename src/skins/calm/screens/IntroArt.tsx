import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, ClockIcon } from "react-native-heroicons/outline";
import { CheckIcon, ShoppingCartIcon } from "react-native-heroicons/solid";
import { calmColors, useCalmColors } from "./colors";
import T from "../text";
import { CText } from "./parts";

const ICON = 28;

const Cue = ({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={styles.cue}>
      {icon}
      <CText
        weight={active ? "semibold" : "regular"}
        size={skin.type.label}
        color={active ? C.positive : C.textSoft}
        style={styles.center}
      >
        {label}
      </CText>
    </View>
  );
};

export const SortArt = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const labels = T.tutorial.stamps;

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.art}>
      <Cue icon={<ArrowUpIcon size={ICON} color={C.textSoft} strokeWidth={1.6} />} label={labels.up} />
      <View style={styles.line}>
        <Cue icon={<ArrowLeftIcon size={ICON} color={C.textSoft} strokeWidth={1.6} />} label={labels.left} />
        <View style={styles.card}>
          <CText weight="medium" size={skin.type.title}>{T.tutorial.samples[1]}</CText>
        </View>
        <Cue icon={<ArrowRightIcon size={ICON} color={C.positive} strokeWidth={3} />} label={labels.right} active />
      </View>
    </View>
  );
};

export const ShopArt = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const [bought, current, next] = T.tutorial.samples;

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.art}>
      <View style={styles.listRow}>
        <CheckIcon size={ICON - 8} color={C.positive} />
        <CText size={skin.type.lead} color={C.textFaint} style={styles.struck}>{bought}</CText>
      </View>
      <View style={styles.line}>
        <Cue icon={<ClockIcon size={ICON} color={C.textSoft} strokeWidth={1.6} />} label={T.shop.later} />
        <ArrowLeftIcon size={ICON - 10} color={C.ring} strokeWidth={1.8} />
        <View style={styles.swipeRow}>
          <CText weight="medium" size={skin.type.lead}>{current}</CText>
        </View>
        <ArrowRightIcon size={ICON - 10} color={C.positive} strokeWidth={1.8} />
        <Cue icon={<ShoppingCartIcon size={ICON} color={C.positive} />} label={T.shop.legendBasket} active />
      </View>
      <View style={[styles.listRow, styles.lastRow]}>
        <CText size={skin.type.lead}>{next}</CText>
      </View>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    art: { alignItems: "center", gap: s.spacing.inline, paddingBottom: s.spacing.section },
    center: { textAlign: "center" },
    line: { alignItems: "center", alignSelf: "stretch", flexDirection: "row", gap: s.spacing.small, justifyContent: "center" },
    cue: { alignItems: "center", gap: s.spacing.tight, width: 68 },
    card: {
      alignItems: "center",
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.shape.radius + 6,
      borderWidth: s.shape.border,
      height: 190,
      justifyContent: "center",
      transform: [{ rotateZ: "4deg" }],
      width: 140,
    },
    listRow: {
      alignItems: "center",
      alignSelf: "stretch",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.stripe,
    },
    lastRow: { borderBottomColor: C.line, borderBottomWidth: s.shape.divider },
    struck: { textDecorationLine: "line-through" },
    swipeRow: {
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flex: 1,
      justifyContent: "center",
      minHeight: s.size.button.lg,
      paddingHorizontal: s.spacing.stack,
    },
  });
