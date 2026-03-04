"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

interface ContainerLogsProps {
    agentId: string;
    userId: string;
    containerRunning: boolean;
}

export function ContainerLogs({ agentId, userId, containerRunning }: ContainerLogsProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    useEffect(() => {
        if (!containerRunning) return;

        const fetchLogs = async () => {
            try {
                const res = await fetch(
                    `${apiUrl}/agents/${agentId}/containers/logs`,
                    { headers: { "x-user-id": userId } }
                );
                if (!res.ok) return;
                const data = await res.json();
                const rawLogs = data.logs ?? "";
                const lines = typeof rawLogs === "string"
                    ? rawLogs.split("\n").filter(Boolean)
                    : rawLogs;
                setLogs(lines);
            } catch {
                // Silently fail for log polling
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 2000);
        return () => clearInterval(interval);
    }, [agentId, userId, containerRunning, apiUrl]);

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 h-8 border-b bg-muted/20 shrink-0">
                <Terminal className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Terminal
                </span>
                {containerRunning && (
                    <span className="flex items-center gap-1.5 ml-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400/70 font-medium">Running</span>
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-3 font-mono text-xs leading-5 text-[#d4d4d4]">
                {logs.length === 0 && (
                    <div className="flex items-center gap-2 text-[#555]">
                        <Terminal className="h-3.5 w-3.5" />
                        <span>
                            {containerRunning
                                ? "Waiting for output..."
                                : "No container running. Click Preview to start."}
                        </span>
                    </div>
                )}
                {logs.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all hover:bg-white/[0.02]">
                        {line}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
