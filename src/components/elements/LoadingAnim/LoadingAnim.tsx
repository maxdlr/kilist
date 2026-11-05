import type { Skin } from "@/skins/types";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

const STEP_DURATION = 420;

const LoadingAnim = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => s + 1), STEP_DURATION);
    return () => clearInterval(timer);
  }, []);

  const { fill, ink } = skin.colors.sheets[step % skin.colors.sheets.length]!;
  const { label, title, line } = skin.copy.loading;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[styles.sheet, { backgroundColor: fill }]}
    >
      <ThemedText size={skin.type.body} color={ink}>
        {label}
      </ThemedText>
      <Title size={skin.type.display.xl} lines={2} color={ink} header={false}>
        {title}
      </Title>
      <ThemedText size={skin.type.body} color={ink}>
        {line}
      </ThemedText>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    sheet: {
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: s.spacing.gutter,
      paddingVertical: s.spacing.page,
    },
  });

export default LoadingAnim;
