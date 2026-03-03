"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Phone } from "lucide-react";
import { toast } from "sonner";
import type { ContainerInfo } from "@/lib/api";

interface PreviewPanelProps {
    agentId: string;
    userId: string;
    onContainerStatusChange: (running: boolean) => void;
}

export function PreviewPanel({
    agentId,
    userId,
    onContainerStatusChange,
}: PreviewPanelProps) {
    const [container, setContainer] = useState<ContainerInfo | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    const handleStart = async () => {
        setIsStarting(true);
        try {
            const res = await fetch(
                `${apiUrl}/agents/${agentId}/containers/preview`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-user-id": userId },
                }
            );
            if (!res.ok) throw new Error("Failed to start container");
            const data: ContainerInfo = await res.json();
            setContainer(data);
            onContainerStatusChange(true);
            toast.success("Preview container started");
        } catch (error) {
            console.error("Preview start error:", error);
            toast.error("Failed to start preview container");
        } finally {
            setIsStarting(false);
        }
    };

    const handleStop = async () => {
        setIsStopping(true);
        try {
            const res = await fetch(
                `${apiUrl}/agents/${agentId}/containers/stop`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-user-id": userId },
                }
            );
            if (!res.ok) throw new Error("Failed to stop container");
            setContainer(null);
            onContainerStatusChange(false);
            toast.success("Preview container stopped");
        } catch (error) {
            console.error("Preview stop error:", error);
            toast.error("Failed to stop container");
        } finally {
            setIsStopping(false);
        }
    };

    const handleTestCall = () => {
        window.open(`/preview?agentId=${agentId}`, "_blank");
    };

    const isRunning = container?.status === "RUNNING" || container?.status === "PENDING";

    return (
        <div className="flex items-center gap-2">
            {container && (
                <Badge
                    variant="outline"
                    className={
                        isRunning
                            ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                            : "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
                    }
                >
                    {container.status}
                </Badge>
            )}

            {!isRunning ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleStart}
                    disabled={isStarting}
                >
                    <Play className="h-3.5 w-3.5" />
                    {isStarting ? "Starting..." : "Preview"}
                </Button>
            ) : (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleTestCall}
                    >
                        <Phone className="h-3.5 w-3.5" />
                        Test Call
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        onClick={handleStop}
                        disabled={isStopping}
                    >
                        <Square className="h-3.5 w-3.5" />
                        Stop
                    </Button>
                </>
            )}
        </div>
    );
}
