import { usePathname } from "expo-router";
import { useEffect } from "react";
import { syncNow } from "./engine";

const SyncBridge = () => {
  const pathname = usePathname();

  useEffect(() => {
    syncNow();
  }, [pathname]);

  return null;
};

export default SyncBridge;
