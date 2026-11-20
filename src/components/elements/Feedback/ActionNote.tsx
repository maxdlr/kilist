import { ThemedText } from "@/components/elements/ThemedText";
import { ClockIcon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import Presence from "./Presence";

const ActionNote = ({ reason, collapse }: { reason?: string | null; collapse?: number }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const ink = skin.feedback.held.reason;

  return (
    <Presence visible={Boolean(reason)} collapse={collapse}>
      <View accessibilityLiveRegion="polite" style={styles.row}>
        <ClockIcon size={skin.type.label} color={ink} strokeWidth={1.8} />
        <ThemedText size={skin.type.caption} color={ink}>
          {reason}
        </ThemedText>
      </View>
    </Presence>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    row: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight + 2, justifyContent: "center" },
  });

export default ActionNote;
