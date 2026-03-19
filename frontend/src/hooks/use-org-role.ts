"use client";

import { useActiveOrganization, useSession } from "@/lib/auth-client";

export function useOrgRole() {
  const { data: activeOrg } = useActiveOrganization();
  const { data: session } = useSession();

  // The active org data from Better Auth includes the member's role
  const role = (activeOrg as any)?.activeMember?.role as string | undefined;

  return {
    role: role || null,
    isOwner: role === "owner",
    isAdmin: role === "admin" || role === "owner",
    isMember: role === "member" || role === "admin" || role === "owner",
    orgName: (activeOrg as any)?.name as string | undefined,
    orgId: (activeOrg as any)?.id as string | undefined,
  };
}
