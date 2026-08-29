"use client";
import { type RefObject, useRef, useState, useCallback } from "react";
import useOnClickOutside from "../useClickOutside";

const useFocus = <T extends HTMLElement = HTMLElement>(
  externalRef?: RefObject<T | null>,
) => {
  const internalRef = useRef<T>(null);
  const ref = externalRef || internalRef;
  const [isFocused, setIsFocused] = useState(false);

  useOnClickOutside<T>(ref, () => setIsFocused(false));

  const focus = useCallback(() => {
    ref.current?.focus();
    setIsFocused(true);
  }, [ref]);

  const unfocus = useCallback(() => {
    ref.current?.blur();
    setIsFocused(false);
  }, [ref]);

  return { ref, focus, unfocus, isFocused };
};

export default useFocus;
