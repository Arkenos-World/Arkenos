"use client";

import { SWRConfig } from "swr";

/**
 * Wraps children with SWR fallback data from server components.
 * Keys should match the serialized SWR keys used by hooks in use-swr-hooks.ts.
 */
export function SWRFallback({
    fallback,
    children,
}: {
    fallback: Record<string, unknown>;
    children: React.ReactNode;
}) {
    return <SWRConfig value={{ fallback }}>{children}</SWRConfig>;
}
