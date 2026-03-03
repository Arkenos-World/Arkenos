"use client";

import { Badge } from "@/components/ui/badge";

type BuildStatusValue = "NONE" | "PENDING" | "BUILDING" | "READY" | "FAILED";

interface BuildStatusBadgeProps {
    status: BuildStatusValue;
}

const STATUS_CONFIG: Record<
    BuildStatusValue,
    { label: string; className: string }
> = {
    NONE: {
        label: "No Build",
        className: "bg-zinc-500/10 text-zinc-400 border-zinc-400/30",
    },
    PENDING: {
        label: "Pending",
        className: "bg-yellow-500/10 text-yellow-400 border-yellow-400/30",
    },
    BUILDING: {
        label: "Building",
        className: "bg-blue-500/10 text-blue-400 border-blue-400/30",
    },
    READY: {
        label: "Ready",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-400/30",
    },
    FAILED: {
        label: "Failed",
        className: "bg-red-500/10 text-red-400 border-red-400/30",
    },
};

export function BuildStatusBadge({ status }: BuildStatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NONE;

    return (
        <Badge variant="outline" className={config.className}>
            {status === "BUILDING" && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse mr-1" />
            )}
            {config.label}
        </Badge>
    );
}
