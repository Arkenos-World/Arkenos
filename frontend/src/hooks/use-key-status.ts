"use client";

import { useKeyStatus as useKeyStatusSWR } from "@/hooks/use-swr-hooks";

export function useKeyStatus() {
    const { data: keyStatus, isLoading: loading } = useKeyStatusSWR();

    return {
        keyStatus: keyStatus ?? null,
        loading,
        allConfigured: keyStatus?.all_required_set ?? false,
        isProviderReady: (id: string) =>
            keyStatus?.providers[id]?.configured ?? false,
    };
}
