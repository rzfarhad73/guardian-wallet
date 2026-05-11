"use client";

import { type ReactNode } from "react";
import { useAnimatedMount } from "@/lib/hooks/useAnimatedMount";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  maxHeight?: string;
};

export default function Dialog({
  open,
  onClose,
  children,
  maxWidth = "max-w-2xl",
  maxHeight = "max-h-[min(90dvh,780px)]"
}: Props) {
  const { mounted, visible } = useAnimatedMount(open, 250);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`duration-250 fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`border-border bg-surface duration-250 fixed inset-0 z-50 m-auto flex flex-col rounded-2xl border shadow-2xl transition-all ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${maxWidth} ${maxHeight}`}
      >
        {children}
      </div>
    </>
  );
}
