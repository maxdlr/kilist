import Title from "@/components/elements/Title";
import useLooks from "@/hooks/screens/useLooks";
import { PreviewProvider } from "@/providers/PreviewProvider";
import { ShopListProvider } from "@/providers/ShopListProvider";
import { SkinOverride, useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { SwipeFoodsProvider } from "@/providers/SwipeFoodsProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import { type ScreenSlot, SkinScreen } from "@/skins/screens";
import type { Skin } from "@/skins/types";
import { useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActionNote, FeedbackCard } from "@/components/elements/Feedback";
import { CompactLookActions } from "./LooksShowcase";

const SLIDES: ("Home" | "Play" | "Shop")[] = ["Home", "Play", "Shop"];
const LOADING_MS = 1000;

const withData = (slot: ScreenSlot, screen: ReactNode) =>
  slot === "Play" ? (
    <SwipeFoodsProvider>{screen}</SwipeFoodsProvider>
  ) : slot === "Shop" ? (
    <ShopListProvider>{screen}</ShopListProvider>
  ) : (
    screen
  );

const Frame = ({ skinId, slot, width, height }: { skinId: string; slot: ScreenSlot; width: number; height: number }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), LOADING_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ height, overflow: "hidden", width }}
    >
      <SkinOverride id={skinId}>
        <PreviewProvider>
          {ready ? withData(slot, <SkinScreen slot={slot} />) : <SkinScreen slot="Loading" />}
        </PreviewProvider>
      </SkinOverride>
    </View>
  );
};

const LookPreview = ({ skinId }: { skinId?: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const looks = useLooks();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const { hide } = useTabBarVisibility();
  const [focused, setFocused] = useState(false);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [index, setIndex] = useState(0);
  const look = looks.looks.find((candidate) => candidate.skin.id === skinId);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      const show = hide();
      return () => {
        show();
        setFocused(false);
        setIndex(0);
      };
    }, [hide]),
  );

  if (!look) return null;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (stage.width > 0)
      setIndex(Math.max(0, Math.min(SLIDES.length - 1, Math.round(event.nativeEvent.contentOffset.x / stage.width))));
  };

  return (
    <View style={styles.root}>
      <View style={[styles.head, { backgroundColor: skin.colors.ground }]}>
        <View style={styles.headRow}>
          <View style={styles.headText}>
            <Title size={skin.type.title} lines={1} color={skin.colors.onGround}>
              {look.skin.name}
            </Title>
          </View>
          <CompactLookActions look={look} looks={looks} />
        </View>
        <FeedbackCard feedback={looks.problemOf(look)} collapse={skin.spacing.inline} />
        <ActionNote reason={looks.hintOf(look)} collapse={skin.spacing.inline} />
      </View>
      <View
        style={styles.stage}
        onLayout={(event) =>
          setStage({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })
        }
      >
        {focused && stage.width > 0 && (
          <ScrollView
            key={look.skin.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={32}
          >
            {SLIDES.map((slot) => (
              <ScrollView key={slot} style={{ height: stage.height, width: stage.width }} nestedScrollEnabled>
                <Frame skinId={look.skin.id} slot={slot} width={stage.width} height={window.height} />
              </ScrollView>
            ))}
          </ScrollView>
        )}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.dotsWrap, { bottom: skin.spacing.stack + insets.bottom }]}
        >
          <View style={[styles.dots, { backgroundColor: skin.colors.ground }]}>
            {SLIDES.map((slot, position) => (
              <View
                key={slot}
                style={[styles.dot, { backgroundColor: skin.colors.onGround, opacity: position === index ? 1 : 0.3 }]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: { flex: 1 },
    head: { gap: s.spacing.inline, paddingBottom: s.spacing.inline, paddingHorizontal: s.spacing.gutter },
    headRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.inline },
    headText: { flex: 1, minWidth: 0 },
    stage: { flex: 1, minHeight: 0 },
    dotsWrap: { alignItems: "center", left: 0, position: "absolute", right: 0 },
    dots: {
      borderRadius: s.spacing.stack,
      flexDirection: "row",
      gap: s.spacing.small,
      paddingHorizontal: s.spacing.inline,
      paddingVertical: s.spacing.small,
    },
    dot: { borderRadius: s.spacing.tight, height: s.spacing.small, width: s.spacing.small },
  });

export default LookPreview;
