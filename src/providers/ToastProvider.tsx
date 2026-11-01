import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { setToastTrigger } from "@/services/toastBridge";
import React, { createContext, ReactNode, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";

const DISPLAY_DURATION = 2500;
const ANIM_DURATION = 250;

export type ToastType = "error" | "success" | "info";

type Toast = { id: number; message: string; type: ToastType };

export type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();
  const [toast, setToast] = useState<Toast | null>(null);
  const queueRef = useRef<Toast[]>([]);
  const nextIdRef = useRef(0);
  const translateY = useSharedValue(-100);

  const processQueue = () => {
    const next = queueRef.current.shift();
    if (!next) {
      setToast(null);
      return;
    }

    setToast(next);
    translateY.value = withTiming(0, { duration: ANIM_DURATION });

    setTimeout(() => {
      translateY.value = withTiming(-100, { duration: ANIM_DURATION }, () => {});
      setTimeout(processQueue, ANIM_DURATION);
    }, DISPLAY_DURATION);
  };

  const showToast = (message: string, type: ToastType = "error") => {
    queueRef.current.push({ id: nextIdRef.current++, message, type });
    if (!toast) processQueue();
  };

  useEffect(() => {
    setToastTrigger(showToast);
  }, [toast]);

  const backgroundByType: Record<ToastType, string> = {
    error: theme.cancel[60],
    success: theme.confirm[60],
    info: theme.backgroundElement,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: backgroundByType[toast.type] },
            { transform: [{ translateY }] },
          ]}
        >
          <ThemedText type="small" style={styles.text}>
            {toast.message}
          </ThemedText>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default useToast;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    zIndex: 1000,
  },
  text: {
    textAlign: "center",
  },
});
