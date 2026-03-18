"use client";

import { useSession } from "@/lib/auth-client";
import { useMemo } from "react";

/**
 * Returns auth headers for backend API calls.
 * Uses the Better Auth session token directly — no extra network call.
 * Backend verifies against the session table.
 */
export function useAuthHeaders(): Record<string, string> {
  const { data } = useSession();
  return useMemo((): Record<string, string> => {
    const token = (data?.session as Record<string, unknown> | undefined)?.token as string | undefined;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, [data?.session]);
}
