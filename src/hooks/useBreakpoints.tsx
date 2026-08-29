import { Breakpoint } from "@/types/Breakpoints";
import { useState, useEffect } from "react";

const useBreakpoints = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      for (const bp of Object.values(Breakpoint)) {
        if (typeof bp === "number" && width < bp) {
          setBreakpoint(bp);
          return;
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sm = breakpoint === Breakpoint.SM;
  const md = breakpoint === Breakpoint.MD || breakpoint === Breakpoint.SM;
  const lg =
    breakpoint === Breakpoint.LG ||
    breakpoint === Breakpoint.MD ||
    breakpoint === Breakpoint.SM;
  const xl =
    breakpoint === Breakpoint.XL ||
    breakpoint === Breakpoint.LG ||
    breakpoint === Breakpoint.MD ||
    breakpoint === Breakpoint.SM;
  const xxl =
    breakpoint === Breakpoint.XXL ||
    breakpoint === Breakpoint.XL ||
    breakpoint === Breakpoint.LG ||
    breakpoint === Breakpoint.MD ||
    breakpoint === Breakpoint.SM;

  return { breakpoint, sm, md, lg, xl, xxl };
};

export default useBreakpoints;
