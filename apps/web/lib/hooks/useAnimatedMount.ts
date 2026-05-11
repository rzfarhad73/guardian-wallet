"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Manages mount/unmount timing for CSS enter/exit animations.
 *
 * Returns:
 * - `mounted`  — whether the element should exist in the DOM
 * - `visible`  — whether the "open" CSS class should be applied
 *
 * Usage:
 *   const { mounted, visible } = useAnimatedMount(open, 250);
 *   if (!mounted) return null;
 *   <div className={visible ? "opacity-100" : "opacity-0"} />
 */
export function useAnimatedMount(open: boolean, durationMs = 250) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    if (open) {
      setMounted(true);
      // Defer one frame so the browser paints the initial hidden state first
      timer.current = setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
      timer.current = setTimeout(() => setMounted(false), durationMs);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, durationMs]);

  return { mounted, visible };
}
