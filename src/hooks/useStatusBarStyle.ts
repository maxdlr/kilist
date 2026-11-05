import { useFocusEffect } from "expo-router";
import { setStatusBarStyle, type StatusBarStyle } from "expo-status-bar";
import { useCallback } from "react";

const useStatusBarStyle = (style: StatusBarStyle) => {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style]),
  );
};

export default useStatusBarStyle;
