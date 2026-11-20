import { FeedbackChip } from "@/components/elements/Feedback";
import { CloudXmarkIcon } from "@/components/icons";
import useSyncStatus from "@/offline/useSyncStatus";
import { useSkin } from "@/providers/SkinProvider";

const SyncNote = ({ collapse }: { collapse?: number }) => {
  const skin = useSkin();
  const { waiting, pending } = useSyncStatus();

  return <FeedbackChip label={waiting ? skin.copy.sync.waiting(pending) : null} icon={CloudXmarkIcon} collapse={collapse} />;
};

export default SyncNote;
