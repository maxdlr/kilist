import { type RefObject, useEffect } from "react";

const useOnClickInside = <T extends Element | null>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent | KeyboardEvent) => void,
  dependencies: unknown[],
): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focus) return;
      if (!ref.current) return;
      if (document.activeElement === ref.current) return;

      // Ignore modifier-only, shortcuts, special keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return; // filters Enter, Escape, ArrowUp, etc.

      handler(e);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // dependencies is a caller-supplied array spread intentionally; eslint
    // cannot statically verify its contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, ref, handler]);
};

export default useOnClickInside;
