"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Silently refreshes server data every 30 seconds so the dashboard
 * picks up new trades pushed by the MT5 EA without a manual reload.
 */
export function DashboardAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
