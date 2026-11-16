import Press from "@/components/elements/Press";
import type { SwipeDirection } from "@/components/elements/SwipeDeck";
import { CartIcon, CheckIcon, ShrugIcon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import T from "../text";
import { useCalmColors } from "../theme/useCalmColors";
import { CText } from "./CText";
import { createButtonStyles } from "./styles";

export const CardPads = ({
  intent,
  labels,
  onFling,
}: {
  intent: SwipeDirection | null;
  labels: boolean;
  onFling?: (direction: SwipeDirection) => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const live = onFling !== undefined;

  const pad = (direction: "left" | "right", label: string, aria: string) => {
    const on = intent === direction;
    const ink = on ? C.onFill : C.text;
    return (
      <Press
        accessibilityRole="button"
        accessibilityLabel={aria}
        scale
        disabled={!live}
        onPress={() => onFling?.(direction)}
        style={({ pressed }) => [
          styles.button,
          labels ? styles.pill : styles.round,
          {
            backgroundColor: on ? C.fill : C.tint,
            borderColor: on ? C.fill : C.tint,
            opacity: pressed ? skin.shape.pressedOpacity : 1,
          },
        ]}
      >
        {direction === "left" &&
          (on ? (
            <CartIcon size={skin.size.icon.action} color={ink} />
          ) : (
            <CartIcon
              size={skin.size.icon.action}
              color={ink}
              strokeWidth={1.8}
            />
          ))}
        {labels && (
          <CText
            weight="medium"
            size={skin.type.label + 1}
            color={ink}
            numberOfLines={1}
          >
            {label}
          </CText>
        )}
        {direction === "right" && (
          <CheckIcon
            size={skin.size.icon.action}
            color={on ? C.onFill : C.positive}
            strokeWidth={on ? 3 : 2}
          />
        )}
      </Press>
    );
  };
  const unsureOn = intent === "up";

  const hidden = {
    accessibilityElementsHidden: !live,
    importantForAccessibility: live
      ? ("auto" as const)
      : ("no-hide-descendants" as const),
  };

  return (
    <>
      <View {...hidden} style={[styles.actionRow, styles.pads]}>
        {pad("left", copy.out, T.play.ariaOut)}
        {pad("right", copy.inStock, T.play.ariaIn)}
      </View>
      <View
        {...hidden}
        pointerEvents="box-none"
        style={[styles.unsureSlot, styles.pads]}
      >
        <Press
          accessibilityRole="button"
          accessibilityLabel={T.intent.up}
          scale
          disabled={!live}
          onPress={() => onFling?.("up")}
          style={({ pressed }) => [
            styles.button,
            labels ? styles.pill : styles.round,
            {
              backgroundColor: "transparent",
              borderColor: unsureOn ? C.text : C.fieldLine,
              opacity: pressed ? skin.shape.pressedOpacity : 1,
            },
          ]}
        >
          <ShrugIcon
            size={skin.size.icon.action}
            color={unsureOn ? C.text : C.textSoft}
            strokeWidth={unsureOn ? 2.6 : 1.8}
          />
          {labels && (
            <CText
              size={skin.type.label + 1}
              color={unsureOn ? C.text : C.textSoft}
              numberOfLines={1}
            >
              {copy.unsure}
            </CText>
          )}
        </Press>
      </View>
    </>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    ...createButtonStyles(s),
    pads: { padding: s.spacing.stack },
    unsureSlot: { alignItems: "center", left: 0, position: "absolute", right: 0, top: 0 },
  });
