"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  // Always start with `true` so the server-rendered HTML matches the initial
  // client render. The real value is synced in useEffect (client-only).
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Sync to the actual browser state after hydration
    setOnline(navigator.onLine);
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
