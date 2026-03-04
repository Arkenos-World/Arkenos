"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Rocket,
    MessageSquare,
    Terminal,
} from "lucide-react";
import { FileTree } from "./file-tree";
import { CodeEditor } from "./code-editor";
import { CodingAgentChat } from "./coding-agent-chat";
import { ContainerLogs } from "./container-logs";
import { BuildStatusBadge } from "./build-status";
import { DeployDialog } from "./deploy-dialog";
import { PreviewPanel } from "./preview-panel";
import type { Agent, AgentFile } from "@/lib/api";

interface CustomAgentEditorProps {
    agent: Agent;
    userId: string;
}

export function CustomAgentEditor({ agent, userId }: CustomAgentEditorProps) {
    const router = useRouter();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    const [files, setFiles] = useState<AgentFile[]>([]);
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string>("");
    const [buildStatus, setBuildStatus] = useState(agent.build_status);
    const [currentVersion, setCurrentVersion] = useState(agent.current_version);
    const [deployedVersion, setDeployedVersion] = useState(agent.deployed_version);
    const [showChat, setShowChat] = useState(true);
    const [showLogs, setShowLogs] = useState(false);
    const [containerRunning, setContainerRunning] = useState(false);
    const [deployOpen, setDeployOpen] = useState(false);

    // Fetch file list
    const fetchFiles = useCallback(async () => {
        try {
            const res = await fetch(
                `${apiUrl}/agents/${agent.id}/files`,
                { headers: { "x-user-id": userId } }
            );
            if (!res.ok) return;
            const data = await res.json();
            const fileList: AgentFile[] = data.files ?? data;
            setFiles(fileList);

            // Auto-open agent.py if no active file
            if (!activeFilePath && fileList.length > 0) {
                const agentPy = fileList.find((f) => f.file_path === "agent.py");
                const first = agentPy ?? fileList[0];
                setActiveFilePath(first.file_path);
            }
        } catch (error) {
            console.error("Failed to fetch files:", error);
        }
    }, [apiUrl, agent.id, userId, activeFilePath]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    // Fetch file content when active file changes
    useEffect(() => {
        if (!activeFilePath) return;

        const fetchContent = async () => {
            try {
                const res = await fetch(
                    `${apiUrl}/agents/${agent.id}/files/${encodeURIComponent(activeFilePath)}`,
                    { headers: { "x-user-id": userId } }
                );
                if (!res.ok) return;
                const data = await res.json();
                setFileContent(data.content ?? "");
            } catch (error) {
                console.error("Failed to fetch file content:", error);
            }
        };

        fetchContent();
    }, [activeFilePath, apiUrl, agent.id, userId]);

    const handleFileSave = useCallback(
        async (content: string) => {
            if (!activeFilePath) return;
            try {
                const res = await fetch(
                    `${apiUrl}/agents/${agent.id}/files/${encodeURIComponent(activeFilePath)}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "x-user-id": userId,
                        },
                        body: JSON.stringify({ content }),
                    }
                );
                if (!res.ok) throw new Error("Save failed");
            } catch (error) {
                console.error("Failed to save file:", error);
            }
        },
        [apiUrl, agent.id, activeFilePath, userId]
    );

    const handleCreateFile = useCallback(
        async (filePath: string) => {
            try {
                const res = await fetch(
                    `${apiUrl}/agents/${agent.id}/files/${encodeURIComponent(filePath)}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "x-user-id": userId,
                        },
                        body: JSON.stringify({ content: "" }),
                    }
                );
                if (!res.ok) throw new Error("Create failed");
                await fetchFiles();
                setActiveFilePath(filePath);
                setFileContent("");
                toast.success(`Created ${filePath}`);
            } catch (error) {
                console.error("Failed to create file:", error);
                toast.error("Failed to create file");
            }
        },
        [apiUrl, agent.id, userId, fetchFiles]
    );

    const handleDeleteFile = useCallback(
        async (filePath: string) => {
            try {
                const res = await fetch(
                    `${apiUrl}/agents/${agent.id}/files/${encodeURIComponent(filePath)}`,
                    {
                        method: "DELETE",
                        headers: { "x-user-id": userId },
                    }
                );
                if (!res.ok) throw new Error("Delete failed");
                if (activeFilePath === filePath) {
                    setActiveFilePath(null);
                    setFileContent("");
                }
                await fetchFiles();
                toast.success(`Deleted ${filePath}`);
            } catch (error) {
                console.error("Failed to delete file:", error);
                toast.error("Failed to delete file");
            }
        },
        [apiUrl, agent.id, userId, activeFilePath, fetchFiles]
    );

    // Called by the AI chat when the backend auto-saves a file change
    const handleFileChanged = useCallback(
        async (filePath: string, action: "create" | "update" | "delete") => {
            // Refresh file tree
            await fetchFiles();

            if (action === "delete" && activeFilePath === filePath) {
                setActiveFilePath(null);
                setFileContent("");
                return;
            }

            // If the changed file is currently open, reload its content
            if (activeFilePath === filePath && action !== "delete") {
                try {
                    const res = await fetch(
                        `${apiUrl}/agents/${agent.id}/files/${encodeURIComponent(filePath)}`,
                        { headers: { "x-user-id": userId } }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        setFileContent(data.content ?? "");
                    }
                } catch {
                    // non-fatal
                }
            }
        },
        [apiUrl, agent.id, userId, activeFilePath, fetchFiles]
    );

    // Called by AI chat to open a file in the editor
    const handleOpenFile = useCallback(
        (filePath: string) => {
            setActiveFilePath(filePath);
        },
        []
    );

    const handleDeployed = () => {
        setBuildStatus("BUILDING");
        // Poll for build status
        const interval = setInterval(async () => {
            try {
                const res = await fetch(
                    `${apiUrl}/agents/${agent.id}`,
                    { headers: { "x-user-id": userId } }
                );
                if (!res.ok) return;
                const data = await res.json();
                setBuildStatus(data.build_status);
                setCurrentVersion(data.current_version);
                setDeployedVersion(data.deployed_version);
                if (data.build_status !== "BUILDING" && data.build_status !== "PENDING") {
                    clearInterval(interval);
                }
            } catch {
                clearInterval(interval);
            }
        }, 3000);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Top bar */}
            <div className="flex items-center justify-between h-11 px-2 border-b bg-muted/20 shrink-0">
                {/* Left: navigation + agent identity */}
                <div className="flex items-center gap-2 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => router.push("/dashboard/agents")}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-4 w-px bg-border" />
                    <span className="font-semibold text-sm truncate">{agent.name}</span>
                    <BuildStatusBadge status={buildStatus} />
                </div>

                {/* Right: panel toggles + actions */}
                <div className="flex items-center gap-1">
                    {/* Panel toggles */}
                    <Button
                        variant={showLogs ? "secondary" : "ghost"}
                        size="sm"
                        className="gap-1.5 h-7 px-2.5 text-xs"
                        onClick={() => setShowLogs(!showLogs)}
                    >
                        <Terminal className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Logs</span>
                    </Button>
                    <Button
                        variant={showChat ? "secondary" : "ghost"}
                        size="sm"
                        className="gap-1.5 h-7 px-2.5 text-xs"
                        onClick={() => setShowChat(!showChat)}
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">AI Chat</span>
                    </Button>

                    <div className="h-4 w-px bg-border mx-1" />

                    {/* Actions */}
                    <PreviewPanel
                        agentId={agent.id}
                        userId={userId}
                        onContainerStatusChange={(running) => {
                            setContainerRunning(running);
                            if (running) setShowLogs(true);
                        }}
                    />

                    <Button
                        size="sm"
                        className="gap-1.5 h-7"
                        onClick={() => setDeployOpen(true)}
                    >
                        <Rocket className="h-3.5 w-3.5" />
                        Deploy
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 min-h-0">
                {/* File tree sidebar */}
                <div className="w-56 border-r shrink-0 bg-muted/10">
                    <FileTree
                        files={files}
                        activeFile={activeFilePath}
                        onFileSelect={(path) => {
                            setActiveFilePath(path);
                        }}
                        onCreateFile={handleCreateFile}
                        onDeleteFile={handleDeleteFile}
                    />
                </div>

                {/* Center area: editor + optional bottom logs */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Editor */}
                    <div className="flex-1 min-h-0">
                        <CodeEditor
                            filePath={activeFilePath}
                            content={fileContent}
                            onChange={setFileContent}
                            onSave={handleFileSave}
                        />
                    </div>

                    {/* Bottom logs panel */}
                    {showLogs && (
                        <div className="h-48 border-t shrink-0">
                            <ContainerLogs
                                agentId={agent.id}
                                userId={userId}
                                containerRunning={containerRunning}
                            />
                        </div>
                    )}
                </div>

                {/* Right sidebar: AI chat */}
                {showChat && (
                    <div className="w-[380px] border-l shrink-0">
                        <CodingAgentChat
                            agentId={agent.id}
                            userId={userId}
                            onFileChanged={handleFileChanged}
                            onOpenFile={handleOpenFile}
                        />
                    </div>
                )}
            </div>

            {/* Deploy dialog */}
            <DeployDialog
                open={deployOpen}
                onOpenChange={setDeployOpen}
                agentId={agent.id}
                userId={userId}
                currentVersion={currentVersion}
                deployedVersion={deployedVersion}
                onDeployed={handleDeployed}
            />
        </div>
    );
}
