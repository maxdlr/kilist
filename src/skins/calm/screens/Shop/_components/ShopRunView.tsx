import { FeedbackSlot } from "@/components/elements/Feedback";
import EditFoodPanel from "@/components/features/Inventory/EditFoodPanel";
import ShopPanels from "@/components/features/Shop/ShopPanels";
import useRunAisles from "@/hooks/screens/useRunAisles";
import type { ShopRun } from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { type ComponentRef, useRef, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CText, DockSpacer, HelpTip, Screen } from "@/skins/calm/components";
import GLASS from "../glass";
import useRunPills from "../useRunPills";
import AisleScrubBar from "./AisleScrubBar";
import LiveDot from "./LiveDot";
import RunBoxes from "./RunBoxes";
import ShopDock from "./ShopDock";
import ShopPill from "./ShopPill";

const ENTER = FadeIn.duration(AnimationService.enter.duration);
const EXIT = FadeOut.duration(AnimationService.exit.duration);
const REFLOW = LinearTransition.duration(AnimationService.reflow);

const ShopRunView = ({ run }: { run: ShopRun }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const [touches, setTouches] = useState(0);
  const [editing, setEditing] = useState<FoodType | null>(null);
  const listRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const pills = useRunPills(run);
  const runAisles = useRunAisles({
    foods: pills.remaining,
    suggestionId: pills.suggestion?.id,
    runKey: run.shopListId,
    otherLabel: T.shop.otherAisle,
  });
  const open = runAisles.open;
  const suggestion = pills.suggestion;
  const suggestionAisle = suggestion ? runAisles.aisleOfFood(suggestion.id) : null;
  const suggestionAisleLabel =
    suggestionAisle && suggestionAisle !== open?.id
      ? runAisles.aisles.find((aisle) => aisle.id === suggestionAisle)?.label
      : undefined;
  const failed = pills.remaining.find((food) => run.rowError(food.id));
  const failure = failed ? run.rowError(failed.id) : null;

  const undo = () =>
    pills.undo((foodId) => {
      const aisle = runAisles.aisleOfFood(foodId);
      if (aisle) runAisles.setOpen(aisle);
    });

  const pill = (food: FoodType, suggested: boolean) => (
    <ShopPill
      key={food.id}
      food={food}
      big
      suggested={suggested}
      teach={suggested && pills.teach}
      ticking={pills.isTicking(food.id)}
      error={Boolean(run.rowError(food.id))}
      onTap={() => pills.tap(food)}
      onFlick={() => pills.flickAway(food)}
      onFlickArm={(armed) => pills.armFlick(food, armed)}
      onHold={() => setEditing(food)}
    />
  );

  return (
    <View style={styles.flex} onTouchStart={() => setTouches((count) => count + 1)}>
      <Screen
        padded={false}
        glass
        glassLook={GLASS}
        dock={<ShopDock run={run} label={common.shop.finish} onPress={run.finish} onUndo={undo} />}
      >
        <View style={styles.top}>
          <View style={styles.head}>
            <View>
              <View style={styles.title}>
                <LiveDot />
                <CText weight="medium" size={skin.type.headline} accessibilityRole="header">
                  {T.shop.title}
                </CText>
              </View>
              <CText size={skin.type.label} color={C.textSoft}>
                {T.shop.toBuy(pills.remaining.length)}
              </CText>
            </View>
            <View style={styles.help}>
              <HelpTip text={T.shop.runHelp} accessibilityLabel={T.shop.howAria} activity={touches} lines={3} />
            </View>
          </View>
          {failure && (
            <Animated.View entering={ENTER} exiting={EXIT} style={styles.failure}>
              <CText size={skin.type.caption} color={C.danger} accessibilityLiveRegion="polite" style={styles.flex}>
                {failure.message}
              </CText>
              <CButton small variant="text" label={common.feedback.rowRetry} onPress={failure.retry} />
            </Animated.View>
          )}
          <RunBoxes
            later={Math.max(0, run.handled - run.bought)}
            basket={run.bought}
            laterArmed={pills.flickArmed}
            basketArmed={pills.anyTicking}
          />
        </View>
        <View style={[styles.flex, styles.body]}>
          <ScrollView
            ref={listRef}
            style={styles.flex}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={false} onRefresh={run.refreshEmpty} tintColor={C.textSoft} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          >
            <FeedbackSlot place="list" />
            {open && (
              <Animated.View key={open.id} entering={ENTER} exiting={EXIT} layout={REFLOW} style={styles.aisle}>
                <View style={styles.aisleHead}>
                  <CText
                    weight="medium"
                    size={skin.type.title}
                    accessibilityRole="header"
                    style={styles.flex}
                    numberOfLines={1}
                  >
                    {open.label}
                  </CText>
                  <CText size={skin.type.label} color={C.textSoft}>
                    {open.count > 0 ? T.shop.toBuy(open.count) : T.shop.aisleEmpty}
                  </CText>
                </View>
                <View style={styles.pills}>{open.foods.map((food) => pill(food, false))}</View>
              </Animated.View>
            )}
            {suggestion && (
              <Animated.View layout={REFLOW} entering={ENTER} exiting={EXIT} style={styles.next}>
                <View style={styles.aisleHead}>
                  <CText size={skin.type.caption} color={C.textSoft}>
                    {T.shop.usuallyNext}
                  </CText>
                  {suggestionAisleLabel && (
                    <CText size={skin.type.caption} color={C.textSoft} numberOfLines={1}>
                      {suggestionAisleLabel}
                    </CText>
                  )}
                </View>
                <View style={styles.pills}>{pill(suggestion, true)}</View>
              </Animated.View>
            )}
          </ScrollView>
          <AisleScrubBar aisles={runAisles.aisles} openId={open?.id ?? null} onPick={runAisles.setOpen} />
          <DockSpacer />
        </View>
      </Screen>
      <ShopPanels run={run} />
      <EditFoodPanel food={editing} onClose={() => setEditing(null)} />
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    top: { gap: s.spacing.inline },
    head: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: s.spacing.gutter,
    },
    title: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    help: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
      minWidth: 0,
      paddingLeft: s.spacing.stack,
    },
    failure: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
      paddingHorizontal: s.spacing.gutter,
    },
    body: { borderTopColor: C.line, borderTopWidth: s.shape.divider },
    list: {
      flexGrow: 1,
      gap: s.spacing.section,
      justifyContent: "flex-end",
      paddingBottom: s.spacing.inline,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.stack,
    },
    aisle: { gap: s.spacing.inline },
    aisleHead: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "space-between",
    },
    pills: { flexDirection: "row", flexWrap: "wrap-reverse", gap: s.spacing.small },
    next: { gap: s.spacing.small },
  });

export default ShopRunView;
