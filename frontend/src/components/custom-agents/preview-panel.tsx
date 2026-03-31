"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Phone } from "lucide-react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { useAuthHeaders } from "@/lib/auth-headers";

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
    const auth = useAuthHeaders();
    const apiUrl = getApiUrl();
    const [deployed, setDeployed] = useState(false);
    const [checking, setChecking] = useState(true);

    // Check if the agent has a deployed worker running
    const checkDeployStatus = useCallback(async () => {
        if (!auth.Authorization && !auth["x-user-id"]) return;
        try {
            const res = await fetch(`${apiUrl}/agents/${agentId}`, {
                headers: auth,
            });
            if (res.ok) {
                const data = await res.json();
                const isDeployed = data.deployed_version != null && data.build_status === "READY";
                setDeployed(isDeployed);
                onContainerStatusChange(isDeployed);
            }
        } catch {
            // ignore
        } finally {
            setChecking(false);
        }
    }, [apiUrl, agentId, auth, onContainerStatusChange]);

    useEffect(() => {
        checkDeployStatus();
    }, [checkDeployStatus]);

    const handleTestCall = () => {
        if (!deployed) {
            toast.error("Deploy the agent first before testing");
            return;
        }
        window.open(`/preview?agentId=${agentId}`, "_blank");
    };

    if (checking) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            {deployed && (
                <Badge
                    variant="outline"
                    className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                >
                    Live
                </Badge>
            )}

            <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleTestCall}
                disabled={!deployed}
                title={!deployed ? "Deploy the agent first" : undefined}
            >
                {deployed ? (
                    <>
                        <Phone className="h-3.5 w-3.5" />
                        Test Call
                    </>
                ) : (
                    <>
                        <Play className="h-3.5 w-3.5" />
                        Preview
                    </>
                )}
            </Button>
        </div>
    );
}
