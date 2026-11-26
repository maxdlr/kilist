import type { ComponentRef, RefObject } from "react";
import { FeedbackRow } from "@/components/elements/Feedback";
import Press from "@/components/elements/Press";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import { CheckIcon, ClockIcon, MoreHorizIcon, XmarkIcon } from "@/components/icons";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import withPressed from "@/utils/withPressed";
import { StyleSheet, TextInput, useWindowDimensions, View } from "react-native";
import Animated, { interpolate, type SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";

const ARM = 90;

const HOLD_SLOP = 10;

const Under = ({
  drag,
  side,
  armed,
}: {
  drag: SharedValue<number>;
  side: 1 | -1;
  armed: { fill: string; ink: string };
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const { width } = useWindowDimensions();
  const shown = useAnimatedStyle(() => ({ opacity: drag.value * side > 0 && Math.abs(drag.value) < width ? 1 : 0 }));
  const lit = useAnimatedStyle(() => ({
    opacity: interpolate(drag.value * side, [ARM - 16, ARM], [0, 1], "clamp"),
  }));
  const layer = (ink: string) => (
    <>
      {side > 0 && <CheckIcon size={skin.size.icon.action} color={ink} strokeWidth={2.2} />}
      <CText weight="semibold" size={skin.type.label} color={ink}>
        {side > 0 ? T.shop.bought : T.shop.nextTime}
      </CText>
      {side < 0 && <ClockIcon size={skin.size.icon.action} color={ink} strokeWidth={2} />}
    </>
  );
  const align = side > 0 ? styles.underBuy : styles.underLater;
  return (
    <Animated.View style={[styles.under, align, { backgroundColor: C.tint }, shown]}>
      {layer(C.textSoft)}
      <Animated.View style={[styles.under, align, { backgroundColor: armed.fill }, lit]}>
        {layer(armed.ink)}
      </Animated.View>
    </Animated.View>
  );
};

type Rename = {
  draft: string;
  anchor: RefObject<ComponentRef<typeof View> | null>;
  onDraft: (draft: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

export const ShopRow = ({
  food,
  selected,
  selecting,
  rename,
  error,
  onRetry,
  onBuy,
  onLater,
  onSelect,
  onHold,
  onDetails,
}: {
  food: FoodType;
  selected: boolean;
  selecting: boolean;
  rename: Rename | null;
  error?: string | null;
  onRetry?: () => void;
  onBuy: () => void;
  onLater: () => void;
  onSelect: () => void;
  onHold: () => void;
  onDetails: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const drag = useSharedValue(0);
  const quantity = food.quantity ?? null;
  const holdInPlace = () => {
    if (Math.abs(drag.get()) < HOLD_SLOP) onHold();
  };


  return (
    <FeedbackRow error={error} retryLabel={common.feedback.rowRetry} onRetry={onRetry}>
      <View ref={rename?.anchor} style={styles.slot}>
        <Under drag={drag} side={1} armed={{ fill: C.positive, ink: C.onPositive }} />
        <Under drag={drag} side={-1} armed={{ fill: C.textSoft, ink: C.onFill }} />
        <SwipeGesture
          onSwipeRight={onBuy}
          onSwipeLeft={onLater}
          onLongPress={rename ? undefined : holdInPlace}
          translation={drag}
          swipeThreshold={ARM}
          styles={{ box: styles.box }}
        >
          <Press
            accessibilityRole="button"
            accessibilityLabel={[food.name, quantity, food.note].filter(Boolean).join(", ")}
            accessibilityHint={T.shop.rowHint}
            accessibilityState={{ selected }}
            accessibilityActions={[
              { name: "activate", label: T.shop.select },
              { name: "buy", label: T.shop.bought },
              { name: "later", label: T.shop.nextTime },
              { name: "longpress", label: T.shop.rename },
            ]}
            onAccessibilityAction={(event) => {
              const action = event.nativeEvent.actionName;
              if (action === "buy") onBuy();
              else if (action === "later") onLater();
              else if (action === "longpress") onHold();
              else onSelect();
            }}
            onPress={rename ? undefined : onSelect}
            style={rename ? [styles.row, styles.renaming] : withPressed([styles.row, selected && styles.selected])}
          >
            {selecting && (
              <View style={[styles.check, selected && styles.checkOn]}>
                {selected && <CheckIcon size={skin.type.caption} color={C.onFill} strokeWidth={3} />}
              </View>
            )}
            {rename ? (
              <TextInput
                autoFocus
                accessibilityLabel={T.shop.nameField}
                value={rename.draft}
                onChangeText={rename.onDraft}
                onSubmitEditing={rename.onCommit}
                onBlur={rename.onCommit}
                returnKeyType="done"
                selectionColor={C.positive}
                style={styles.edit}
              />
            ) : null}
            {rename && (
              <View style={styles.editActions}>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={T.shop.renameCancel}
                  onPress={rename.onCancel}
                  hitSlop={skin.spacing.tight}
                  style={withPressed([styles.editButton, styles.editCancel])}
                >
                  <XmarkIcon size={skin.type.body} color={C.text} strokeWidth={2} />
                </Press>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={T.shop.renameSave}
                  onPress={rename.onCommit}
                  hitSlop={skin.spacing.tight}
                  style={withPressed([styles.editButton, styles.editSave])}
                >
                  <CheckIcon size={skin.type.body} color={C.onFill} strokeWidth={2.4} />
                </Press>
              </View>
            )}
            {rename ? null : (
              <>
                <CText weight="medium" size={skin.type.body} numberOfLines={1} style={styles.name}>
                  {food.name}
                </CText>
                <View style={styles.meta}>
                  {quantity && (
                    <CText size={skin.type.label} color={C.textSoft} numberOfLines={1}>
                      {quantity}
                    </CText>
                  )}
                  {quantity && food.note && <View style={styles.bigDot} />}
                  {food.note && (
                    <CText size={skin.type.label} color={C.textFaint} numberOfLines={1} style={styles.note}>
                      {food.note}
                    </CText>
                  )}
                </View>
              </>
            )}
          </Press>
        </SwipeGesture>
        {!rename && (
          <Press
            accessibilityRole="button"
            accessibilityLabel={T.shop.details}
            onPress={onDetails}
            hitSlop={skin.spacing.tight}
            style={withPressed(styles.more)}
          >
            <MoreHorizIcon size={skin.size.icon.action} color={C.textSoft} />
          </Press>
        )}
      </View>
    </FeedbackRow>
  );
};

export const SunkRow = ({ food, action }: { food: FoodType; action: "buy" | "snooze" }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  return (
    <View
      accessible
      accessibilityLabel={`${food.name}, ${action === "buy" ? T.shop.bought : T.shop.nextTime}`}
      style={[styles.row, styles.sunk]}
    >
      <CText
        weight="medium"
        size={skin.type.label}
        numberOfLines={1}
        style={[styles.name, action === "buy" && styles.struck]}
      >
        {food.name}
      </CText>
      <View style={styles.meta} />
      {action === "snooze" && (
        <View style={styles.tag}>
          <CText size={skin.type.caption} color={C.textSoft}>
            {T.shop.nextTag}
          </CText>
        </View>
      )}
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    slot: { borderBottomColor: C.tint, borderBottomWidth: s.shape.divider, overflow: "hidden" },
    under: {
      alignItems: "center",
      bottom: 0,
      flexDirection: "row",
      gap: s.spacing.small,
      left: 0,
      paddingHorizontal: s.spacing.stack,
      position: "absolute",
      right: 0,
      top: 0,
    },
    underBuy: { justifyContent: "flex-start" },
    underLater: { justifyContent: "flex-end" },
    box: { backgroundColor: "transparent" },
    row: {
      alignItems: "center",
      backgroundColor: C.ground,
      flexDirection: "row",
      gap: s.spacing.inline,
      minHeight: s.size.row.shop,
      paddingEnd: s.size.button.xs + s.spacing.tight,
      paddingStart: s.spacing.tight,
      transitionDuration: AnimationService.feedback.tint.duration,
      transitionProperty: ["backgroundColor"],
    },
    selected: { backgroundColor: C.tint },
    renaming: { paddingEnd: s.spacing.small },
    editActions: { flexDirection: "row", gap: s.spacing.small },
    editButton: {
      alignItems: "center",
      borderRadius: (s.size.button.xs - 10) / 2,
      borderWidth: s.shape.border,
      height: s.size.button.xs - 10,
      justifyContent: "center",
      width: s.size.button.xs - 10,
    },
    editCancel: { borderColor: C.fieldLine },
    editSave: { backgroundColor: C.fill, borderColor: C.fill },
    sunk: { minHeight: s.size.row.shop * 0.6, opacity: 0.45, paddingEnd: s.spacing.stack },
    check: {
      alignItems: "center",
      borderColor: C.ring,
      borderRadius: s.size.icon.action,
      borderWidth: s.shape.border + 0.5,
      height: s.size.icon.action + 2,
      justifyContent: "center",
      width: s.size.icon.action + 2,
    },
    checkOn: { backgroundColor: C.fill, borderColor: C.fill },
    name: { flexShrink: 1, maxWidth: "55%" },
    struck: { textDecorationLine: "line-through" },
    meta: { alignItems: "center", flex: 1, flexDirection: "row", gap: s.spacing.small, minWidth: 0 },
    bigDot: { backgroundColor: C.ring, borderRadius: 3, height: 6, width: 6 },
    note: { flexShrink: 1, fontStyle: "italic" },
    edit: {
      borderBottomColor: C.text,
      borderBottomWidth: s.shape.border,
      color: C.text,
      flex: 1,
      fontSize: s.type.body,
      paddingVertical: s.spacing.tight,
    },
    tag: {
      borderColor: C.fieldLine,
      borderRadius: s.spacing.section,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.small,
      paddingVertical: s.spacing.hair,
    },
    more: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      position: "absolute",
      right: 0,
      top: 0,
      width: s.size.button.xs,
    },
  });
