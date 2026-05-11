"use client";

import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-warning/10 border-warning/30 text-warning border-b px-5 py-2 text-center text-sm"
    >
      <span className="font-medium">You are offline.</span> Screenshot scanning and transaction analysis
      (base64) still work — local AI is fully available. Wallet lookup and on-chain transaction fetch require
      an internet connection.
    </div>
  );
}
