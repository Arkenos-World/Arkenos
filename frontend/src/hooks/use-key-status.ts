"use client";

import { useState, useEffect } from "react";
import { useAuthHeaders } from "@/lib/auth-headers";
import { getKeyStatus, type KeyStatusResponse } from "@/lib/api";

export function useKeyStatus() {
    const auth = useAuthHeaders();
    const [keyStatus, setKeyStatus] = useState<KeyStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.Authorization) return;
        getKeyStatus(auth)
            .then(setKeyStatus)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [auth]);

    return {
        keyStatus,
        loading,
        allConfigured: keyStatus?.all_required_set ?? false,
        isProviderReady: (id: string) =>
            keyStatus?.providers[id]?.configured ?? false,
    };
}
