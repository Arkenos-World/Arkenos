import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Server-side helper: get auth headers for backend API calls.
 * Reads session token + activeOrganizationId from the request.
 * Use in server components and API routes.
 */
export async function getServerAuthHeaders(): Promise<{
  headers: Record<string, string>;
  userId: string | null;
  user: { id: string; name: string | null; email: string } | null;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  const reqHeaders: Record<string, string> = {};

  if (userId) {
    reqHeaders["x-user-id"] = userId;
  }

  // Read activeOrganizationId from the session
  const activeOrgId = (session?.session as Record<string, unknown> | undefined)?.activeOrganizationId as string | undefined;
  if (activeOrgId) {
    reqHeaders["x-org-id"] = activeOrgId;
  }

  const user = session?.user ? {
    id: session.user.id,
    name: (session.user as Record<string, unknown>).name as string | null,
    email: session.user.email,
  } : null;

  return { headers: reqHeaders, userId: userId || null, user };
}
