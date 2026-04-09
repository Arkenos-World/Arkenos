"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useKeyStatus } from "@/hooks/use-swr-hooks";

export function MissingKeysBanner() {
    const { data: keyStatus } = useKeyStatus();
    const show = keyStatus ? !keyStatus.all_required_set : false;

    if (!show) return null;

    return (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 animate-[slide-down-fade_0.4s_ease-out]">
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
