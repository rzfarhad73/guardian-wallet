"use client";

import { useEffect, type ReactNode } from "react";
import { useResponsive } from "@/lib/hooks/useResponsive";
import BottomSheet from "@/components/ui/BottomSheet";
import Dialog from "@/components/ui/Dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  dialogMaxWidth?: string;
  dialogMaxHeight?: string;
};

export default function ResponsiveOverlay({
  open,
  onClose,
  children,
  dialogMaxWidth,
  dialogMaxHeight
}: Props) {
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={onClose}>
        {children}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth={dialogMaxWidth} maxHeight={dialogMaxHeight}>
      {children}
    </Dialog>
  );
}
