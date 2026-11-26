import ActionPanel from "@/components/elements/ActionPanel";
import { FeedbackSlot } from "@/components/elements/Feedback";
import EditFoodPanel from "@/components/features/Inventory/EditFoodPanel";
import ShopPanels from "@/components/features/Shop/ShopPanels";
import { PlusIcon, UndoIcon } from "@/components/icons";
import useAisleManager from "@/hooks/screens/useAisleManager";
import { OTHER_AISLE, type RunSection } from "@/hooks/screens/useRunAisles";
import type { ShopRun } from "@/hooks/screens/useShopRun";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { type ComponentRef, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CButton, CSwitch, CText, HelpTip, Screen, screenTop } from "@/skins/calm/components";
import useShopView from "../useShopView";
import AisleGroup from "./AisleGroup";
import AisleManager from "./AisleManager";
import AisleRail, { type RailStop } from "./AisleRail";
import { ShopRow, SunkRow } from "./ShopRow";

const TINT = {
  transitionDuration: AnimationService.config.duration,
  transitionProperty: ["backgroundColor", "color"] as string[],
  transitionTimingFunction: "ease-out",
};

type Place = { y: number; height: number };

const leftIn = (section: RunSection) => section.total - section.done.length;

const ShopListView = ({ run }: { run: ShopRun }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const view = useShopView(run);
  const [focus, setFocus] = useState<string | null>(null);
  const [gliding, setGliding] = useState<string | null>(null);
  const [touches, setTouches] = useState(0);
  const listRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const stageRef = useRef<ComponentRef<typeof View>>(null);
  const editRef = useRef<ComponentRef<typeof View>>(null);
  const places = useRef(new Map<string, Place>());
  const port = useRef({ offset: 0, height: 0, content: 0 });
  const pinned = useRef(true);
  const aisles = useAisleManager({
    foods: run.preview,
    text: {
      confirmTitle: T.shop.aislesConfirmTitle,
      confirmLine: T.shop.aislesConfirmLine,
      confirmKeep: T.shop.aislesConfirmKeep,
      confirmSave: T.shop.aislesConfirmSave,
      confirmDiscard: T.shop.aislesConfirmDiscard,
    },
    onSaved: run.refreshPreview,
  });

  const running = view.running;
  const tone = running ? "ink" : "ground";
  const selecting = run.selected.length > 0;
  const flipped = skin.statusBarOnGround === "dark" ? "light" : "dark";
  useStatusBarStyle(running ? flipped : skin.statusBarOnGround);

  const sections = view.sections;
  const withOpen = sections.filter((section) => leftIn(section) > 0);
  const focusId =
    focus && withOpen.some((section) => section.id === focus) ? focus : (withOpen[0]?.id ?? null);
  const stops: RailStop[] = withOpen.map((section) => ({
    id: section.id,
    label: section.label,
    left: leftIn(section),
  }));

  const reveal = useEffectEvent(() => {
    editRef.current?.measureInWindow((_x, rowTop, _w, rowHeight) => {
      stageRef.current?.measureInWindow((_sx, stageTop, _sw, stageHeight) => {
        const over = rowTop + rowHeight - (stageTop + stageHeight) + skin.spacing.small;
        if (over > 0) listRef.current?.scrollTo({ y: port.current.offset + over, animated: true });
      });
    });
  });

  const editing = view.renaming !== null;

  useEffect(() => {
    if (!editing) return;
    const shown = Keyboard.addListener("keyboardDidShow", () => reveal());
    return () => shown.remove();
  }, [editing]);

  const readFocus = () => {
    const { offset, height } = port.current;
    const anchor = offset + height - skin.size.row.shop * 1.4;
    let best: string | null = null;
    let distance = Infinity;
    for (const [id, place] of places.current) {
      if (anchor >= place.y && anchor <= place.y + place.height) {
        best = id;
        break;
      }
      const gap = Math.min(Math.abs(place.y - anchor), Math.abs(place.y + place.height - anchor));
      if (gap < distance) {
        distance = gap;
        best = id;
      }
    }
    if (best !== focus) setFocus(best);
  };

  const scrollTo = (id: string) => {
    const place = places.current.get(id);
    if (!place) return;
    const target = place.y + place.height - port.current.height + skin.spacing.inline;
    listRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    port.current = { offset: contentOffset.y, height: layoutMeasurement.height, content: contentSize.height };
    if (!gliding) readFocus();
  };

  const stickToEnd = () => {
    if (!pinned.current) return;
    listRef.current?.scrollToEnd({ animated: false });
    requestAnimationFrame(() => {
      if (pinned.current) listRef.current?.scrollToEnd({ animated: false });
    });
  };

  const settleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    pinned.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - skin.spacing.section;
  };

  const measure = (id: string) => (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    places.current.set(id, { y, height });
  };

  const rowOf = (food: FoodType) => {
    const failure = run.rowError(food.id);
    const renaming = view.renaming?.id === food.id;
    return (
      <ShopRow
        key={food.id}
        food={food}
        selected={run.selected.includes(food.id)}
        selecting={selecting}
        rename={
          renaming
            ? {
                draft: view.renaming!.draft,
                anchor: editRef,
                onDraft: view.setDraft,
                onCommit: view.commitRename,
                onCancel: view.cancelRename,
              }
            : null
        }
        error={failure?.message}
        onRetry={failure?.retry}
        onBuy={() => view.swipe(food, "buy")}
        onLater={() => view.swipe(food, "snooze")}
        onSelect={() => run.toggleSelect(food)}
        onHold={() => view.startRename(food)}
        onDetails={() => view.openDetails(food)}
      />
    );
  };

  const group = (section: RunSection) => (
    <AisleGroup
      key={section.id}
      label={section.label}
      count={running ? T.shop.sectionCount(section.done.length, section.total) : String(leftIn(section))}
      progress={section.total > 0 ? section.done.length / section.total : 0}
      focused={section.id === focusId}
      started={section.done.length > 0}
      targeted={section.id === gliding}
      dimmed={gliding !== null && section.id !== gliding}
      onLayout={measure(section.id)}
      action={
        section.id === OTHER_AISLE && !running && aisles.canManage && !selecting ? (
          <CButton
            small
            variant="text"
            label={T.shop.manageAisles}
            accessibilityLabel={T.shop.manageAislesAria}
            onPress={aisles.open}
          />
        ) : undefined
      }
    >
      {section.done.map((food) => (
        <SunkRow key={food.id} food={food} action={view.actionOf(food.id)} />
      ))}
      {[...section.open].reverse().map(rowOf)}
    </AisleGroup>
  );

  const dock = selecting ? (
    <>
      <CText size={skin.type.label} weight="semibold" color={running ? C.onFill : C.text} accessibilityLiveRegion="polite">
        {common.shop.selected(run.selected.length)}
      </CText>
      <CButton tone={tone} variant="secondary" label={T.shop.later} onPress={run.buyLater} />
      <CButton tone={tone} variant="danger" label={T.shop.deleteSelected} onPress={view.askDelete} />
    </>
  ) : running ? (
    <>
      {run.canUndo && (
        <CButton
          tone={tone}
          variant="secondary"
          accessibilityLabel={common.shop.undo}
          onPress={view.undo}
          icon={(color) => <UndoIcon size={skin.size.icon.action} color={color} strokeWidth={1.8} />}
        />
      )}
      <CButton
        tone={tone}
        variant="secondary"
        accessibilityLabel={common.shop.add}
        onPress={run.openAdd}
        icon={(color) => <PlusIcon size={skin.size.icon.action} color={color} strokeWidth={1.8} />}
      />
      <CButton tone={tone} label={T.shop.finishTrip} onPress={run.finish} />
    </>
  ) : (
    <CButton
      variant="secondary"
      label={common.shop.add}
      onPress={run.openAdd}
      icon={(color) => <PlusIcon size={skin.size.icon.action} color={color} strokeWidth={1.8} />}
    />
  );

  return (
    <View style={styles.flex} onTouchStart={() => setTouches((count) => count + 1)}>
      <Screen padded={false} flushTop dock={dock} dockTone={tone} dockMode={selecting ? "select" : tone}>
        <View style={styles.flex}>
          <View style={[styles.head, { paddingTop: screenTop(skin, insets.top) }, running && styles.headInk, TINT]}>
            <View style={running ? styles.flex : styles.titles}>
              <CText
                weight="semibold"
                size={skin.type.headline}
                color={running ? C.onFill : C.text}
                accessibilityRole="header"
              >
                {T.shop.title}
              </CText>
              <View style={styles.subline}>
                <CText
                  size={skin.type.label}
                  color={running ? C.fieldLine : C.textSoft}
                  accessibilityLiveRegion="polite"
                  numberOfLines={1}
                  style={running && styles.flex}
                >
                  {view.subtitle}
                </CText>
                {running && (
                  <View style={styles.toggle}>
                    <CText size={skin.type.caption} color={C.fieldLine} importantForAccessibility="no">
                      {T.shop.suggestions}
                    </CText>
                    <CSwitch
                      tone="ink"
                      value={view.suggesting}
                      onChange={view.setSuggesting}
                      label={T.shop.suggestionsAria}
                    />
                  </View>
                )}
              </View>
            </View>
            {!running && (
              <View style={styles.help}>
                <HelpTip text={T.shop.rowHelp} accessibilityLabel={T.shop.howAria} activity={touches} lines={3} />
              </View>
            )}
          </View>
          <View ref={stageRef} style={styles.stage}>
            <ScrollView
              ref={listRef}
              style={styles.flex}
              contentContainerStyle={styles.list}
              scrollEventThrottle={32}
              keyboardShouldPersistTaps="handled"
              onScroll={onScroll}
              onScrollEndDrag={settleScroll}
              onMomentumScrollEnd={settleScroll}
              onLayout={(event) => {
                port.current.height = event.nativeEvent.layout.height;
                stickToEnd();
              }}
              onContentSizeChange={() => {
                stickToEnd();
                requestAnimationFrame(readFocus);
              }}
              refreshControl={<RefreshControl refreshing={false} onRefresh={run.refreshEmpty} tintColor={C.textSoft} />}
            >
              <FeedbackSlot place="list" />
              {sections.filter((section) => section.open.length > 0).reverse().map(group)}
            </ScrollView>
            <AisleRail
              stops={stops}
              focusId={focusId}
              onGlide={(id) => {
                setGliding(id);
                if (id) scrollTo(id);
              }}
              onPick={(id) => {
                setFocus(id);
                scrollTo(id);
              }}
            />
          </View>
          {view.suggestion && (
            <View style={[styles.pinned, running && styles.pinnedInk, TINT]}>
              <AisleGroup
                kind="next"
                label={T.shop.usuallyNext}
                count={view.suggestionLabel ?? ""}
                progress={0}
                focused
                started={false}
                targeted={false}
              >
                <View style={styles.nextRow}>{rowOf(view.suggestion)}</View>
              </AisleGroup>
            </View>
          )}
        </View>
      </Screen>
      <ShopPanels run={run} />
      <AisleManager manager={aisles} />
      <EditFoodPanel food={view.details} onClose={view.closeDetails} />
      <ActionPanel
        request={
          view.confirmDelete
            ? {
                title: T.shop.deleteTitle(run.selected.length),
                message: T.shop.deleteLine(run.selected.length),
                cancelLabel: T.shop.deleteKeep,
                actions: [{ label: T.shop.deleteSelected, onPress: run.removeSelected, destructive: true }],
              }
            : null
        }
        onClose={view.closeDelete}
      />
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    head: {
      alignItems: "center",
      backgroundColor: C.ground,
      flexDirection: "row",
      gap: s.spacing.stack,
      paddingBottom: s.spacing.stack,
      paddingHorizontal: s.spacing.gutter,
    },
    headInk: { backgroundColor: C.fill },
    titles: { flexShrink: 0 },
    subline: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    toggle: { alignItems: "center", flexDirection: "row", gap: s.spacing.small },
    help: { alignItems: "center", flex: 1, flexDirection: "row", justifyContent: "flex-end", minWidth: 0 },
    stage: { flex: 1, minHeight: 0 },
    list: {
      flexGrow: 1,
      gap: s.spacing.section,
      justifyContent: "flex-end",
      paddingBottom: s.spacing.inline,
      paddingEnd: s.size.button.xs + s.spacing.tight,
      paddingStart: s.spacing.stack,
      paddingTop: s.spacing.stack,
    },
    pinned: {
      backgroundColor: C.ground,
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      paddingBottom: s.spacing.stack,
      paddingHorizontal: s.spacing.stack,
      paddingTop: s.spacing.small,
    },
    pinnedInk: { backgroundColor: C.line, borderTopColor: C.line },
    nextRow: { borderRadius: s.shape.radius / 2, overflow: "hidden" },
  });

export default ShopListView;
