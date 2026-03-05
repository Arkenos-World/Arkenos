"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { getKeyStatus } from "@/lib/api";

export function MissingKeysBanner() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        getKeyStatus()
            .then(data => setShow(!data.all_required_set))
            .catch(() => {}); // Silently fail — banner is non-critical
    }, []);

    if (!show) return null;

    return (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-muted-foreground">
                    Configure your API keys to enable voice features.
                </span>
            </div>
            <Link
                href="/dashboard/keys"
                className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 shrink-0"
            >
                Set up keys
                <ArrowRight className="h-3.5 w-3.5" />
            </Link>
        </div>
    );
}
