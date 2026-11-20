import { ThemedText } from "@/components/elements/ThemedText";
import { WarningCircleIcon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import Presence from "./Presence";

const FieldMessage = ({
  message,
  color,
  center = false,
  collapse,
}: {
  message?: string | null;
  color?: string;
  center?: boolean;
  collapse?: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const ink = color ?? skin.feedback.field.message;

  return (
    <Presence visible={Boolean(message)} collapse={collapse}>
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.row, center && styles.center]}>
        <WarningCircleIcon size={skin.type.label} color={ink} strokeWidth={2} />
        <ThemedText size={skin.type.caption} color={ink} style={!center && styles.flex}>
          {message}
        </ThemedText>
      </View>
    </Presence>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    row: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight + 2, paddingTop: s.spacing.tight },
    center: { justifyContent: "center" },
    flex: { flex: 1, minWidth: 0 },
  });

export default FieldMessage;
