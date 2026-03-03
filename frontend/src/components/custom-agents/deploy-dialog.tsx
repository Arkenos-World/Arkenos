"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Rocket } from "lucide-react";
import { toast } from "sonner";

interface DeployDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agentId: string;
    userId: string;
    currentVersion: number;
    deployedVersion: number | null;
    onDeployed: () => void;
}

export function DeployDialog({
    open,
    onOpenChange,
    agentId,
    userId,
    currentVersion,
    deployedVersion,
    onDeployed,
}: DeployDialogProps) {
    const [isDeploying, setIsDeploying] = useState(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            const res = await fetch(
                `${apiUrl}/agents/${agentId}/containers/deploy`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-user-id": userId },
                }
            );
            if (!res.ok) throw new Error("Deploy failed");

            toast.success("Deployment started!", {
                description: `Version ${currentVersion} is being deployed.`,
            });
            onDeployed();
            onOpenChange(false);
        } catch (error) {
            console.error("Deploy error:", error);
            toast.error("Failed to deploy agent");
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Rocket className="h-5 w-5" />
                        Deploy Agent
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        This will build and deploy the current code as a production container.
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 rounded-lg border bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">
                                Current Version
                            </p>
                            <p className="font-semibold text-lg">
                                v{currentVersion}
                            </p>
                        </div>
                        <div className="p-3 rounded-lg border bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">
                                Deployed Version
                            </p>
                            <p className="font-semibold text-lg">
                                {deployedVersion !== null
                                    ? `v${deployedVersion}`
                                    : "None"}
                            </p>
                        </div>
                    </div>

                    {deployedVersion !== null &&
                        currentVersion > deployedVersion && (
                            <p className="text-xs text-amber-400">
                                You have {currentVersion - deployedVersion}{" "}
                                unpublished version
                                {currentVersion - deployedVersion > 1
                                    ? "s"
                                    : ""}
                                .
                            </p>
                        )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleDeploy} disabled={isDeploying}>
                        {isDeploying ? "Deploying..." : "Deploy"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
