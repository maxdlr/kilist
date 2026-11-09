import { ThemedText } from "@/components/themed-text";
import useSyncStatus from "@/offline/useSyncStatus";
import { useSkin } from "@/providers/SkinProvider";

const SyncNote = ({ color }: { color?: string }) => {
  const skin = useSkin();
  const { waiting } = useSyncStatus();

  if (!waiting) return null;

  return (
    <ThemedText
      accessibilityLiveRegion="polite"
      size={skin.type.caption}
      color={color ?? skin.colors.muted}
    >
      {skin.copy.sync.waiting}
    </ThemedText>
  );
};

export default SyncNote;
