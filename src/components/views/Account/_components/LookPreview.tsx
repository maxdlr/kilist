import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useLooks from "@/hooks/screens/useLooks";
import common from "@/i18n/common";
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
import { LookActions } from "./LooksShowcase";

const SLIDES: ("Home" | "Play" | "Shop")[] = ["Home", "Play", "Shop"];
const LOADING_MS = 1000;
const PEEK = 48;

const withData = (slot: ScreenSlot, screen: ReactNode) =>
  slot === "Play" ? (
    <SwipeFoodsProvider>{screen}</SwipeFoodsProvider>
  ) : slot === "Shop" ? (
    <ShopListProvider>{screen}</ShopListProvider>
  ) : (
    screen
  );

const Frame = ({
  skinId,
  slot,
  width,
  height,
  scale,
}: {
  skinId: string;
  slot: ScreenSlot;
  width: number;
  height: number;
  scale: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
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
      style={[
        styles.frame,
        {
          borderColor: skin.colors.onGround,
          borderRadius: skin.shape.radius + skin.spacing.tight,
          height: height * scale,
          width: width * scale,
        },
      ]}
    >
      <View style={{ height, transform: [{ scale }], transformOrigin: "top left", width }}>
        <SkinOverride id={skinId}>
          <PreviewProvider>
            {ready ? withData(slot, <SkinScreen slot={slot} />) : <SkinScreen slot="Loading" />}
          </PreviewProvider>
        </SkinOverride>
      </View>
    </View>
  );
};

const LookPreview = ({ skinId }: { skinId?: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const looks = useLooks();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { hide } = useTabBarVisibility();
  const [focused, setFocused] = useState(false);
  const [room, setRoom] = useState(0);
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

  const widest = window.width - skin.spacing.gutter * 2 - PEEK;
  const scale = room > 0 ? Math.min(room / window.height, widest / window.width) : 0;
  const frameWidth = window.width * scale;
  const step = frameWidth + skin.spacing.inline;
  const edge = (window.width - frameWidth) / 2;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (step > 0) setIndex(Math.max(0, Math.min(SLIDES.length - 1, Math.round(event.nativeEvent.contentOffset.x / step))));
  };

  return (
    <View style={[styles.root, { paddingBottom: skin.spacing.stack + insets.bottom }]}>
      <View style={styles.head}>
        <Title size={skin.type.title} lines={1} color={skin.colors.onGround}>
          {look.skin.name}
        </Title>
        <ThemedText size={skin.type.label} color={skin.colors.onGround}>
          {common.looks.slideOf(common.looks.slides[SLIDES[index]!], index + 1, SLIDES.length)}
        </ThemedText>
      </View>
      <View style={styles.stage} onLayout={(event) => setRoom(event.nativeEvent.layout.height)}>
        {focused && scale > 0 && (
          <ScrollView
            key={look.skin.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={step}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={32}
            contentContainerStyle={[styles.track, { paddingHorizontal: edge }]}
          >
            {SLIDES.map((slot) => (
              <Frame
                key={slot}
                skinId={look.skin.id}
                slot={slot}
                width={window.width}
                height={window.height}
                scale={scale}
              />
            ))}
          </ScrollView>
        )}
      </View>
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {SLIDES.map((slot, position) => (
          <View
            key={slot}
            style={[styles.dot, { backgroundColor: skin.colors.onGround, opacity: position === index ? 1 : 0.3 }]}
          />
        ))}
      </View>
      <View style={styles.dock}>
        <LookActions look={look} looks={looks} />
      </View>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: { flex: 1, gap: s.spacing.inline },
    head: { gap: s.spacing.hair, paddingHorizontal: s.spacing.gutter },
    stage: { flex: 1, minHeight: 0 },
    track: { alignItems: "center", gap: s.spacing.inline },
    frame: { borderWidth: s.shape.border, overflow: "hidden" },
    dots: { flexDirection: "row", gap: s.spacing.small, justifyContent: "center" },
    dot: { borderRadius: s.spacing.tight, height: s.spacing.small, width: s.spacing.small },
    dock: { paddingHorizontal: s.spacing.gutter },
  });

export default LookPreview;
