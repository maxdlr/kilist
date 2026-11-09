import useToast from "@/providers/ToastProvider";
import { useSkin } from "@/providers/SkinProvider";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { syncNow } from "./engine";
import useSyncStatus from "./useSyncStatus";

const SyncBridge = () => {
  const pathname = usePathname();
  const skin = useSkin();
  const { showToast } = useToast();
  const { waiting, pending } = useSyncStatus();
  const warned = useRef(false);

  useEffect(() => {
    syncNow();
  }, [pathname]);

  useEffect(() => {
    if (!waiting) {
      warned.current = false;
    } else if (pending > 0 && !warned.current) {
      warned.current = true;
      showToast(skin.copy.sync.toast, "info");
    }
  }, [waiting, pending]);

  return null;
};

export default SyncBridge;
