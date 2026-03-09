"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { trackCallStarted, trackCallEnded } from "@/lib/tracking";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceRoom } from "@/components/livekit/voice-room";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    MicrophoneIcon,
    ArrowLeftIcon,
    LoadingSpinner,
    BotIcon,
    SettingsIcon,
    MenuIcon,
    XIcon,
} from "@/components/icons";
import { ArkenosLogo } from "@/components/ui/arkenos-logo";
import { PIPELINE_COLORS, STATUS_COLORS } from "@/lib/design-tokens";

type ConnectionState = "idle" | "connecting" | "connected" | "error";

interface Agent {
    id: string;
    name: string;
    type: string;
}

// Default agent that's always available
const defaultAgent: Agent = { id: "default", name: "Arkenos Agent", type: "PIPELINE" };

export default function VoicePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
    const [selectedAgent, setSelectedAgent] = useState("default");
    const [agents, setAgents] = useState<Agent[]>([defaultAgent]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);
    const [connectionData, setConnectionData] = useState<{
        token: string;
        wsUrl: string;
        roomName: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Fetch user's agents from the API
    useEffect(() => {
        async function fetchAgents() {
            if (!userId) {
                setIsLoadingAgents(false);
                return;
            }
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agents/`,
                    {
                        headers: {
                            'x-user-id': userId,
                        },
                    }
                );
                if (response.ok) {
                    const userAgents = await response.json();
                    // Combine default agent with user's agents
                    setAgents([defaultAgent, ...userAgents]);
                }
            } catch (error) {
                console.error("Failed to fetch agents:", error);
            } finally {
                setIsLoadingAgents(false);
            }
        }
        fetchAgents();
    }, [userId]);

    const startSession = useCallback(async () => {
        setConnectionState("connecting");
        setError(null);

        try {
            const roomName = `arkenos-${Date.now()}`;
            const response = await fetch("/api/livekit/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomName, agentId: selectedAgent }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to get token");
            }

            const data = await response.json();
            setConnectionData({
                token: data.token,
                wsUrl: data.wsUrl,
                roomName: data.roomName,
            });
            setConnectionState("connected");
            trackCallStarted(selectedAgent);
            toast.success("Connected to voice session", {
                description: `Room: ${data.roomName}`,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Connection failed";
            setError(message);
            setConnectionState("error");
            toast.error("Connection failed", { description: message });
        }
    }, [selectedAgent]);

    const handleDisconnect = useCallback(async () => {
        // End the session in backend to track duration
        if (connectionData?.roomName) {
            try {
                await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/sessions/by-room/${connectionData.roomName}/end`,
                    { method: "POST" }
                );
            } catch (error) {
                console.error("Failed to end session:", error);
            }
        }

        trackCallEnded(selectedAgent);
        setConnectionState("idle");
        setConnectionData(null);
        toast.info("Disconnected from voice session");
    }, [connectionData, selectedAgent]);

    // Shared sidebar content used by both desktop and mobile sidebars
    const sidebarContent = (
        <>
            {/* Header */}
            <div className="p-4 border-b">
                <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span className="text-sm">Back to Dashboard</span>
                </Link>
            </div>

            {/* Logo */}
            <div className="p-4 border-b">
                <ArkenosLogo className="h-6" />
            </div>

            {/* Agent Selection */}
            <div className="p-4 space-y-4 flex-1">
                <div className="space-y-2">
                    <Label>Select Agent</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={isLoadingAgents}>
                        <SelectTrigger className="w-full">
                            <span className="truncate block w-[220px] text-left">
                                <SelectValue />
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            {isLoadingAgents ? (
                                <SelectItem value="loading" disabled>
                                    Loading agents...
                                </SelectItem>
                            ) : (
                                agents.map((agent) => (
                                    <SelectItem key={agent.id} value={agent.id}>
                                        <div className="flex items-center gap-2">
                                            <BotIcon className="h-4 w-4" />
                                            {agent.name}
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${connectionState === "connected" ? "bg-emerald-500" :
                            connectionState === "connecting" ? "bg-yellow-500 animate-pulse" :
                                "bg-muted-foreground"
                            }`} />
                        <span className="text-sm capitalize">{connectionState}</span>
                    </div>
                </div>
            </div>

            {/* Settings */}
            <div className="p-4 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    Voice Settings
                </Button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar — hidden on mobile */}
            <aside className="hidden lg:flex w-64 border-r bg-card flex-col h-screen">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileSidebarOpen(false)}
                        />
                        {/* Drawer */}
                        <motion.aside
                            className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col lg:hidden"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            {/* Close button */}
                            <div className="absolute top-3 right-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setMobileSidebarOpen(false)}
                                    aria-label="Close sidebar"
                                >
                                    <XIcon className="h-5 w-5" />
                                </Button>
                            </div>
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="h-14 border-b flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger menu */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <MenuIcon className="h-5 w-5" />
                        </Button>
                        <h1 className="font-semibold">Voice Session</h1>
                    </div>
                    <ThemeToggle />
                </header>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center p-6">
                    {connectionState === "idle" && (
                        <Card className="w-full max-w-md">
                            <CardHeader className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <MicrophoneIcon className="h-10 w-10 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Start Voice Session</CardTitle>
                                <CardDescription>
                                    Connect to your AI agent and start a conversation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Model Stack */}
                                <div className="rounded-lg border bg-card">
                                    <div className="p-3 border-b">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voice Pipeline</p>
                                    </div>
                                    <div className="divide-y">
                                        <div className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded flex items-center justify-center ${PIPELINE_COLORS.stt}`}>
                                                    <span className="text-xs font-bold">STT</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Deepgram</p>
                                                    <p className="text-xs text-muted-foreground">Speech to Text</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">nova-2</span>
                                        </div>
                                        <div className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded flex items-center justify-center ${PIPELINE_COLORS.llm}`}>
                                                    <span className="text-xs font-bold">LLM</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Google Gemini</p>
                                                    <p className="text-xs text-muted-foreground">Language Model</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">3.0-flash</span>
                                        </div>
                                        <div className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded flex items-center justify-center ${PIPELINE_COLORS.tts}`}>
                                                    <span className="text-xs font-bold">TTS</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Resemble AI</p>
                                                    <p className="text-xs text-muted-foreground">Text to Speech</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">custom</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="lg" onClick={startSession} className="w-full gap-2">
                                    <MicrophoneIcon className="h-5 w-5" />
                                    Start Session
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {connectionState === "connecting" && (
                        <Card className="w-full max-w-md">
                            <CardContent className="py-16 text-center">
                                <LoadingSpinner className="h-12 w-12 mx-auto mb-4 text-primary" />
                                <h3 className="text-xl font-semibold">Connecting...</h3>
                                <p className="text-muted-foreground mt-2">
                                    Setting up your voice session
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {connectionState === "connected" && connectionData && (
                        <div className="w-full h-full">
                            <VoiceRoom
                                token={connectionData.token}
                                serverUrl={connectionData.wsUrl}
                                roomName={connectionData.roomName}
                                onDisconnect={handleDisconnect}
                                agentName={agents.find(a => a.id === selectedAgent)?.name}
                            />
                        </div>
                    )}

                    {connectionState === "error" && (
                        <Card className="w-full max-w-md border-destructive/50">
                            <CardContent className="py-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <span className="text-3xl">⚠️</span>
                                </div>
                                <h3 className="text-xl font-semibold text-destructive">Connection Failed</h3>
                                <p className="text-muted-foreground mt-2 mb-6">{error}</p>
                                <div className="flex gap-4 justify-center">
                                    <Button variant="outline" onClick={() => setConnectionState("idle")}>
                                        Try Again
                                    </Button>
                                    <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
