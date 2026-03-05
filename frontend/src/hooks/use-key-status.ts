"use client";

import { useState, useEffect } from "react";
import { getKeyStatus, type KeyStatusResponse } from "@/lib/api";

export function useKeyStatus() {
    const [keyStatus, setKeyStatus] = useState<KeyStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getKeyStatus()
            .then(setKeyStatus)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return {
        keyStatus,
        loading,
        allConfigured: keyStatus?.all_required_set ?? false,
        isProviderReady: (id: string) =>
            keyStatus?.providers[id]?.configured ?? false,
    };
}
