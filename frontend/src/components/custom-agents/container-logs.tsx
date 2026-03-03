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
            <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Container Logs
                </span>
                {containerRunning && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-[#1e1e1e] p-3 font-mono text-xs leading-5 text-[#cccccc]">
                {logs.length === 0 && (
                    <span className="text-[#666666]">
                        {containerRunning
                            ? "Waiting for logs..."
                            : "No container running. Start a preview to see logs."}
                    </span>
                )}
                {logs.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all">
                        {line}
                    </div>
                ))}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
