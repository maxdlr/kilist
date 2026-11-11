import { useIsPreview } from "@/providers/PreviewProvider";
import { useFocusEffect } from "expo-router";
import { setStatusBarStyle, type StatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";

const useStatusBarStyle = (style: StatusBarStyle) => {
  const isPreview = useIsPreview();

  useFocusEffect(
    useCallback(() => {
      if (!isPreview) setStatusBarStyle(style);
    }, [style, isPreview]),
  );
};

export default useStatusBarStyle;
