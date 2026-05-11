"use client";

import { useEffect, useState } from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

export function useResponsive() {
  const [width, setWidth] = useState<number>(() => (typeof window !== "undefined" ? window.innerWidth : 0));

  useEffect(() => {
    function onResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const is = (bp: Breakpoint) => width >= BREAKPOINTS[bp];

  return {
    width,
    isMobile: width < BREAKPOINTS.md,
    isDesktop: width >= BREAKPOINTS.md,
    is
  };
}
