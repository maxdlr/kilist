import Dock from "@/components/elements/Dock/Dock";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Intro = ({ onDone }: { onDone: () => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.intro;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const [step, setStep] = useState(0);
  const last = copy.steps.length - 1;
  const sheets = skin.colors.sheets;
  const sheet = sheets[step % sheets.length]!;

  useStatusBarStyle(sheet.fill === skin.colors.ground ? skin.statusBarOnGround : "dark");

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== step) setStep(Math.max(0, Math.min(last, next)));
  };

  const next = () => {
    if (step >= last) return onDone();
    pager.current?.scrollTo({ x: width * (step + 1), animated: true });
    setStep(step + 1);
  };

  return (
    <View style={[styles.flex, { backgroundColor: skin.colors.ground }]}>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={styles.flex}
      >
        {copy.steps.map((item, index) => {
          const { fill, ink } = sheets[index % sheets.length]!;
          return (
            <View
              key={item.title}
              accessible
              accessibilityLabel={`Step ${index + 1} of ${copy.steps.length}. ${item.title} ${item.line}`}
              style={[styles.page, { backgroundColor: fill, paddingTop: insets.top + skin.spacing.top, width }]}
            >
              <ThemedText size={skin.type.label} color={ink}>
                {`${index + 1}/${copy.steps.length}`}
              </ThemedText>
              <View style={styles.body}>
                <Title size={skin.type.display.lg} lines={4} color={ink}>
                  {item.title}
                </Title>
                <ThemedText size={skin.type.lead} color={ink}>
                  {item.line}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Dock>
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {copy.steps.map((item, index) => (
            <View
              key={item.title}
              style={[
                styles.dot,
                {
                  backgroundColor: skin.colors.onGround,
                  opacity: index === step ? 1 : 0.3,
                  width: index === step ? skin.spacing.section : skin.spacing.small,
                },
              ]}
            />
          ))}
        </View>
        <KilButton height={skin.size.button.lg} label={step >= last ? copy.start : copy.next} onTouch={next} />
        {step < last && (
          <KilButton
            variant="ghost"
            height={skin.size.button.xs}
            fontSize={skin.type.label}
            label={copy.skip}
            onTouch={onDone}
          />
        )}
      </Dock>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1 },
    page: { paddingBottom: s.spacing.section, paddingHorizontal: s.spacing.gutter },
    body: { flex: 1, gap: s.spacing.inline, justifyContent: "center" },
    dots: { alignSelf: "center", flexDirection: "row", gap: s.spacing.small - 2, paddingBottom: s.spacing.small },
    dot: { borderRadius: s.spacing.tight, height: s.spacing.small },
  });

export default Intro;
