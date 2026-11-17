import ActionPanel from "@/components/elements/ActionPanel";
import Press from "@/components/elements/Press";
import SwipeDeck, { SwipeDirection } from "@/components/elements/SwipeDeck";
import { SwipeGame } from "@/hooks/screens/useSwipeGame";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import goBack from "@/utils/goBack";
import withPressed from "@/utils/withPressed";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { InfoCircleIcon, InfoCircleSolidIcon, XmarkIcon } from "@/components/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText, GlassScene, UndoButton, useTabBarInset } from "@/skins/calm/components";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import CheckCard from "./CheckCard";

const IDLE_MS = 3000;

const Checking = ({ game }: { game: SwipeGame }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const tabBar = useTabBarInset();
  const tabBarRoom = useAnimatedStyle(() => ({ paddingBottom: tabBar.offset.value }));
  useStatusBarStyle(skin.statusBarOnGround);
  const total = Math.max(1, game.total);
  const [labels, setLabels] = useState(false);
  const intentColor: Record<SwipeDirection, string> = {
    left: C.negative,
    up: C.textSoft,
    right: C.positive,
  };
  const InfoIcon = labels ? InfoCircleSolidIcon : InfoCircleIcon;
  const [touches, setTouches] = useState(0);
  const [idleFor, setIdleFor] = useState<number | null>(null);
  const canNudge = game.position === 0 && !game.removeRequest;
  const nudging = canNudge && idleFor === touches;

  useEffect(() => {
    if (!canNudge) return;
    const timer = setTimeout(() => setIdleFor(touches), IDLE_MS);
    return () => clearTimeout(timer);
  }, [canNudge, touches]);

  return (
    <View style={styles.root}>
      <GlassScene fade={false}>
        <Animated.View
          onTouchStart={() => setTouches((count) => count + 1)}
          style={[styles.root, { paddingTop: insets.top + skin.spacing.stack }, tabBarRoom]}
        >
          <View style={styles.header}>
            <View style={styles.between}>
              <View style={styles.headerStart}>
                <Press
                  accessibilityRole="button"
                  accessibilityLabel={T.close}
                  hitSlop={skin.spacing.small}
                  onPress={goBack}
                  style={withPressed(styles.close)}
                >
                  <XmarkIcon
                    size={skin.size.icon.action}
                    color={C.textSoft}
                    strokeWidth={1.8}
                  />
                </Press>
                <UndoButton enabled={game.canUndo} onPress={game.undo} />
              </View>
              <View style={styles.hint} accessibilityLiveRegion="polite">
                {game.hint && (
                  <CText weight="bold" size={skin.type.label} color={intentColor[game.hint]}>
                    {T.intent[game.hint]}
                  </CText>
                )}
              </View>
              <View style={styles.headerEnd}>
                <CText size={skin.type.label} color={C.textSoft}>
                  {T.play.position(
                    Math.min(game.position + 1, game.total),
                    game.total,
                  )}
                </CText>
                <Press
                  accessibilityRole="switch"
                  accessibilityLabel={T.play.showLabels}
                  accessibilityState={{ checked: labels }}
                  hitSlop={skin.spacing.small}
                  onPress={() => setLabels((on) => !on)}
                  style={withPressed(styles.info)}
                >
                  <InfoIcon
                    size={skin.size.icon.action}
                    color={labels ? C.text : C.textSoft}
                    strokeWidth={1.8}
                  />
                </Press>
              </View>
            </View>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: total, now: game.position }}
              style={styles.track}
            >
              <View
                style={[
                  styles.fill,
                  { width: `${(game.position / total) * 100}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.flex}>
            <SwipeDeck
              items={game.foods}
              keyOf={(food) => food.id}
              allowUp
              background="transparent"
              stamps={{}}
              nudging={nudging}
              returnFrom={game.returning}
              flingRef={game.flingRef}
              onIntent={game.setIntent}
              onSwipe={game.handleSwipe}
              onLongPress={game.askRemove}
              renderSheet={(food, depth) => (
                <CheckCard
                  food={food}
                  intent={depth === 0 ? game.intent : null}
                  labels={labels}
                  behind={depth > 0}
                  onFling={depth === 0 ? game.fling : undefined}
                />
              )}
            />
          </View>
        </Animated.View>
      </GlassScene>
      <ActionPanel request={game.removeRequest} onClose={game.cancelRemove} />
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    between: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    header: {
      gap: s.spacing.dock - 2,
      paddingHorizontal: s.spacing.gutter,
      paddingBottom: s.spacing.small,
    },
    close: { justifyContent: "center", minHeight: s.size.button.xs },
    headerStart: { alignItems: "center", flexDirection: "row", gap: s.spacing.stack },
    headerEnd: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    info: {
      alignItems: "flex-end",
      justifyContent: "center",
      minHeight: s.size.button.xs,
    },
    track: { backgroundColor: C.line, height: 2 },
    fill: { backgroundColor: C.fill, height: "100%" },
    hint: { alignItems: "center", flex: 1 },
  });

export default Checking;
