import { ThemedText } from "@/components/themed-text";
import useSyncStatus from "@/offline/useSyncStatus";
import { useSkin } from "@/providers/SkinProvider";
import type { StyleProp, TextStyle } from "react-native";

const SyncNote = ({ color, style }: { color?: string; style?: StyleProp<TextStyle> }) => {
  const skin = useSkin();
  const { waiting } = useSyncStatus();

  if (!waiting) return null;

  return (
    <ThemedText
      accessibilityLiveRegion="polite"
      size={skin.type.caption}
      color={color ?? skin.colors.muted}
      style={style}
    >
      {skin.copy.sync.waiting}
    </ThemedText>
  );
};

export default SyncNote;
