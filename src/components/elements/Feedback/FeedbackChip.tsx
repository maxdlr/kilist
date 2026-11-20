import { ThemedText } from "@/components/elements/ThemedText";
import type { Icon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import Presence from "./Presence";

const FeedbackChip = ({
  label,
  icon: Glyph,
  collapse,
}: {
  label?: string | null;
  icon?: Icon;
  collapse?: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const chip = skin.feedback.chip;
  const height = skin.type.caption * 2 + skin.spacing.small;

  return (
    <Presence visible={Boolean(label)} collapse={collapse} style={styles.wrap}>
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.chip,
          {
            backgroundColor: chip.fill,
            borderColor: chip.line,
            borderRadius: skin.shape.pill ? height / 2 : skin.shape.radius,
            borderWidth: chip.border,
            minHeight: height,
          },
        ]}
      >
        {Glyph && <Glyph size={skin.type.label} color={chip.icon} strokeWidth={1.8} />}
        <ThemedText size={skin.type.caption} color={chip.soft}>
          {label}
        </ThemedText>
      </View>
    </Presence>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    wrap: { alignItems: "flex-start" },
    chip: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
      paddingHorizontal: s.spacing.inline,
    },
  });

export default FeedbackChip;
