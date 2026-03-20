"use client";

import { useSession, useActiveOrganization } from "@/lib/auth-client";
import { useMemo } from "react";

/**
 * Returns auth headers for backend API calls.
 * Uses the Better Auth session token directly — no extra network call.
 * Backend verifies against the session table.
 * Includes x-org-id when an active organization is set.
 */
export function useAuthHeaders(): Record<string, string> {
  const { data: sessionData } = useSession();
  const { data: activeOrg } = useActiveOrganization();

  return useMemo((): Record<string, string> => {
    const headers: Record<string, string> = {};
    const token = (sessionData?.session as Record<string, unknown> | undefined)?.token as string | undefined;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // Add org context if active org is set
    const orgId = activeOrg?.id;
    if (orgId) {
      headers["x-org-id"] = orgId;
    }
    return headers;
  }, [sessionData?.session, activeOrg?.id]);
}
