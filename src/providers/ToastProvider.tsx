import type { Skin } from "@/skins/types";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { setToastTrigger } from "@/services/toastBridge";
import React, { createContext, ReactNode, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";

const DISPLAY_DURATION = 2500;
const ANIM_DURATION = 250;
const HIDDEN_OFFSET = 400;

export type ToastType = "error" | "success" | "info";

type Toast = { id: number; message: string; type: ToastType };

export type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [toast, setToast] = useState<Toast | null>(null);
  const queueRef = useRef<Toast[]>([]);
  const nextIdRef = useRef(0);
  const translateY = useSharedValue(-HIDDEN_OFFSET);

  const processQueue = () => {
    const next = queueRef.current.shift();
    if (!next) {
      setToast(null);
      return;
    }

    setToast(next);
    translateY.value = withTiming(0, { duration: ANIM_DURATION });

    setTimeout(() => {
      translateY.value = withTiming(-HIDDEN_OFFSET, { duration: ANIM_DURATION }, () => {});
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

  const lookByType: Record<ToastType, { fill: string; ink: string }> = {
    error: { fill: skin.colors.alert, ink: skin.colors.onAlert },
    success: skin.colors.toast ?? { fill: skin.colors.success, ink: skin.colors.onAlert },
    info: skin.colors.toast ?? { fill: skin.colors.paper, ink: skin.colors.onPaper },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: lookByType[toast.type].fill },
            { transform: [{ translateY }] },
          ]}
        >
          <ThemedText
            accessibilityRole="alert"
            size={skin.type.lead}
            color={lookByType[toast.type].ink}
          >
            {caseFor(skin, toast.message)}
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

const createStyles = (s: Skin) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingTop: s.spacing.page,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
      zIndex: 1000,
    },
  });
