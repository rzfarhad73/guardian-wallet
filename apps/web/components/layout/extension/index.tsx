"use client";

import { useState } from "react";
import { PuzzleIcon } from "lucide-react";
import ResponsiveOverlay from "@/components/ui/ResponsiveOverlay";
import Panel from "./Panel";

export default function HeaderExtension() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-violet-600 px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1 dark:bg-violet-700 dark:hover:bg-violet-600"
        aria-label="Get browser extension"
      >
        <PuzzleIcon size={13} />
        <span className="hidden sm:inline">Get extension</span>
      </button>

      <ResponsiveOverlay open={open} onClose={() => setOpen(false)}>
        <Panel onClose={() => setOpen(false)} />
      </ResponsiveOverlay>
    </>
  );
}
