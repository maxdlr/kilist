import T from "@/skins/calm/text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText, Screen } from "@/skins/calm/components";
import { Sample, Answer, SHOP_ROWS, StepNav } from "./shared";
import TopBar from "./TopBar";
import Caption from "./Caption";
import PracticeRow from "./PracticeRow";

const PracticeShop = ({
  answers,
  spares,
  onDone,
  onBack,
  onExit,
}: StepNav & {
  answers: Answer[];
  spares: Sample[];
  onDone: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const out = answers.filter((answer) => answer.direction === "left");
  const rows = [...out, ...spares, ...answers].filter(
    (item, index, list) => list.findIndex((other) => other.name === item.name) === index,
  ).slice(0, SHOP_ROWS);
  const [handled, setHandled] = useState<Record<string, "bought" | "later">>(
    {},
  );
  const [lastAction, setLastAction] = useState<"bought" | "later" | null>(null);
  const open = rows.filter((row) => !handled[row.name]);
  const did = Object.values(handled);
  const expected: "bought" | "later" | null = !did.includes("bought")
    ? "bought"
    : !did.includes("later")
      ? "later"
      : null;
  const finished = expected === null || open.length === 0;

  const left = useRef(false);

  useEffect(() => {
    if (!finished || left.current) return;
    left.current = true;
    onDone();
  }, [finished, onDone]);

  const handle = (name: string, action: "bought" | "later") => {
    setHandled((map) => ({ ...map, [name]: action }));
    setLastAction(action);
  };

  return (
    <Screen>
      <TopBar onBack={onBack} onExit={onExit} />
      <View style={styles.head}>
        <CText size={skin.type.label} color={C.textSoft}>
          {copy.shopLabel}
        </CText>
        <CText
          weight="medium"
          size={skin.type.display.md}
          accessibilityRole="header"
        >
          {copy.shopTitle(open.length)}
        </CText>
      </View>
      <View style={styles.flex}>
        {open.map((row, index) => (
          <PracticeRow
            key={row.name}
            name={row.name}
            nudging={index === 0 && !finished}
            nudgeTo={expected === "later" ? -1 : 1}
            onBuy={() => handle(row.name, "bought")}
            onLater={() => handle(row.name, "later")}
          />
        ))}
        {!finished && (
          <View style={styles.rowHint}>
            <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">
              {expected === "later" ? copy.shopLaterTitle : copy.shopSwipeTitle}
            </CText>
            <CText size={skin.type.body} color={C.textSoft}>
              {expected === "later" ? copy.shopLaterHint : copy.shopSwipeHint}
            </CText>
          </View>
        )}
      </View>
      {lastAction === "bought" && <Caption title={copy.shopBought} />}
    </Screen>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    head: { gap: s.spacing.small },
    rowHint: { gap: s.spacing.tight, paddingTop: s.spacing.section },
  });

export default PracticeShop;
