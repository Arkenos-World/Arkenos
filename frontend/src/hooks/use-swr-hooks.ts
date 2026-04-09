"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { useAuthHeaders } from "@/lib/auth-headers";
import { getApiUrl, type KeyStatusResponse, type Agent } from "@/lib/api";

const apiUrl = getApiUrl();

async function authFetch<T>(path: string, auth: Record<string, string>): Promise<T> {
    const res = await fetch(`${apiUrl}${path}`, { headers: auth });
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json();
}

/**
 * Fetch all agents. Deduped across components via SWR.
 */
export function useAgents(config?: SWRConfiguration<Agent[]>) {
    const auth = useAuthHeaders();
    const orgId = auth["x-org-id"];
    return useSWR<Agent[]>(
        auth.Authorization ? ["/agents/", orgId] : null,
        () => authFetch<Agent[]>("/agents/", auth),
        config,
    );
}

/**
 * Fetch API key configuration status. Deduped across components via SWR.
 */
export function useKeyStatus(config?: SWRConfiguration<KeyStatusResponse>) {
    const auth = useAuthHeaders();
    const orgId = auth["x-org-id"];
    return useSWR<KeyStatusResponse>(
        auth.Authorization ? ["/settings/keys", orgId] : null,
        () => authFetch<KeyStatusResponse>("/settings/keys", auth),
        config,
    );
}

interface VoicesResponse {
    voices: { id: string; name: string; language: string; source?: string; voice_type?: string }[];
}

/**
 * Fetch Resemble AI voices. Deduped across components via SWR.
 */
export function useVoices(config?: SWRConfiguration<VoicesResponse>) {
    const auth = useAuthHeaders();
    const orgId = auth["x-org-id"];
    return useSWR<VoicesResponse>(
        auth.Authorization ? ["/resemble/voices", orgId] : null,
        () => authFetch<VoicesResponse>("/resemble/voices", auth),
        config,
    );
}

interface SessionsParams {
    limit?: number;
    page?: number;
    start_date?: string;
    end_date?: string;
}

interface SessionsPage {
    sessions: import("@/lib/api").VoiceSession[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Fetch sessions with parameters. Deduped via SWR key (path + params).
 */
export function useSessions(params: SessionsParams, config?: SWRConfiguration<SessionsPage>) {
    const auth = useAuthHeaders();
    const orgId = auth["x-org-id"];
    const query = new URLSearchParams();
    if (params.limit != null) query.set("limit", String(params.limit));
    if (params.page != null) query.set("page", String(params.page));
    if (params.start_date) query.set("start_date", params.start_date);
    if (params.end_date) query.set("end_date", params.end_date);
    const path = `/sessions/?${query}`;

    return useSWR<SessionsPage>(
        auth.Authorization ? [path, orgId] : null,
        () => authFetch<SessionsPage>(path, auth),
        config,
    );
}
