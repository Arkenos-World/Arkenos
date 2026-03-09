"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useRoomContext,
    useConnectionState,
    useParticipants,
    useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { ConnectionState, RoomEvent, TranscriptionSegment, Participant, TrackPublication } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AbstractBall from "@/components/ui/abstract-ball";
import {
    MicrophoneIcon,
    MicrophoneOffIcon,
    ArrowLeftIcon,
    PhoneOffIcon,
    SparklesIcon,
    MenuIcon,
    XIcon,
} from "@/components/icons";
import { ArkenosLogo } from "@/components/ui/arkenos-logo";
import { PIPELINE_COLORS } from "@/lib/design-tokens";
import "./preview.css";

// Models configuration
const sttModels = [
    { id: "deepgram", name: "Deepgram Nova-2", provider: "Deepgram" },
    { id: "assemblyai", name: "AssemblyAI", provider: "AssemblyAI" },
    { id: "elevenlabs", name: "ElevenLabs", provider: "ElevenLabs" },
];

const llmModels = [
    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (Preview)", provider: "Google" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
];

const ttsModels = [
    { id: "resemble-custom", name: "Resemble AI", provider: "Resemble" },
];

// Agent interface
interface Agent {
    id: string;
    name: string;
    type: string;
    config?: {
        stt_provider?: string;
    };
}

// Default agent
const defaultAgent: Agent = { id: "default", name: "Default Agent", type: "PIPELINE" };

// iPhone Mockup Component
function IPhoneMockup({
    children,
    time,
    isConnected
}: {
    children: React.ReactNode;
    time: string;
    isConnected: boolean;
}) {
    return (
        <div className="iphone-mockup">
            <div className="iphone-frame">
                {/* Side Buttons */}
                <div className="iphone-button-silent" />
                <div className="iphone-button-volume-up" />
                <div className="iphone-button-volume-down" />
                <div className="iphone-button-power" />

                <div className="iphone-inner">
                    {/* Dynamic Island */}
                    <div className="dynamic-island">
                        <div className="dynamic-island-camera" />
                    </div>

                    {/* Status Bar */}
                    <div className="iphone-status-bar">
                        <span>{time}</span>
                        <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                            </svg>
                            <div className="flex items-center">
                                <div className="w-5 h-2.5 border border-white/70 rounded-sm relative">
                                    <div className="absolute inset-0.5 bg-white rounded-sm" style={{ width: '80%' }} />
                                </div>
                                <div className="w-0.5 h-1 bg-white/70 rounded-r-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Phone Content */}
                    <div className="absolute inset-0 pt-[70px] pb-[25px] px-3 flex flex-col">
                        {children}
                    </div>

                    {/* Home Bar */}
                    <div className="iphone-home-bar" />
                </div>
            </div>
        </div>
    );
}

interface Transcript {
    id: string;
    speaker: "user" | "agent";
    text: string;
    timestamp: string;
}

type ConnectionStateType = "idle" | "connecting" | "connected" | "error";

// Preview Content Component (Inside LiveKitRoom)
function PreviewContent({
    onDisconnect,
    selectedModel,
    agentName,
}: {
    onDisconnect: () => void;
    selectedModel: string;
    agentName: string;
}) {
    const room = useRoomContext();
    const connectionState = useConnectionState();
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [liveTranscript, setLiveTranscript] = useState<{ speaker: "user" | "agent"; text: string } | null>(null);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [callSeconds, setCallSeconds] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    // Toggle microphone
    const toggleMicrophone = useCallback(async () => {
        if (localParticipant) {
            await localParticipant.setMicrophoneEnabled(isMuted);
            setIsMuted(!isMuted);
        }
    }, [localParticipant, isMuted]);

    const formatTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
    };

    const formatTimestamp = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [transcripts]);

    // Call duration timer
    useEffect(() => {
        const connected = connectionState === ConnectionState.Connected;
        if (connected) {
            const interval = setInterval(() => {
                setCallSeconds(prev => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCallSeconds(0);
        }
    }, [connectionState]);

    // Format call duration
    const formatCallDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Save transcript to backend
    const saveTranscriptToBackend = useCallback(async (text: string, speaker: "user" | "agent") => {
        if (!room?.name) return;
        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/sessions/by-room/${room.name}/transcripts`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: text,
                        speaker: speaker.toUpperCase(),
                    }),
                }
            );
        } catch (error) {
            console.error("Failed to save transcript:", error);
        }
    }, [room?.name]);

    // Listen for transcription events
    useEffect(() => {
        if (!room) return;

        const handleTranscription = (
            segments: TranscriptionSegment[],
            participant?: Participant,
            publication?: TrackPublication
        ) => {
            for (const segment of segments) {
                const isAgent = participant?.identity?.toLowerCase().includes("agent") || participant?.isAgent;
                const speaker = isAgent ? "agent" : "user";

                // Update speaking state
                if (speaker === "user") {
                    setIsUserSpeaking(true);
                } else {
                    setIsAgentSpeaking(true);
                }

                if (!segment.final) {
                    // Show interim transcript (live typing)
                    setLiveTranscript({ speaker, text: segment.text });
                } else {
                    // Final transcript - add to history and clear live
                    setLiveTranscript(null);
                    const transcript: Transcript = {
                        id: segment.id,
                        speaker: speaker,
                        text: segment.text,
                        timestamp: formatTimestamp(),
                    };

                    saveTranscriptToBackend(segment.text, speaker);
                    setTranscripts((prev) => [...prev, transcript]);

                    // Clear speaking state after delay
                    if (speaker === "user") {
                        setTimeout(() => setIsUserSpeaking(false), 500);
                    } else {
                        setTimeout(() => setIsAgentSpeaking(false), 500);
                    }
                }
            }
        };

        const handleData = (payload: Uint8Array) => {
            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);

                if (data.type === "transcription" || data.type === "transcript") {
                    const speaker = data.speaker === "agent" ? "agent" : "user";
                    const transcriptText = data.text || data.content;
                    const transcript: Transcript = {
                        id: crypto.randomUUID(),
                        speaker: speaker,
                        text: transcriptText,
                        timestamp: formatTimestamp(),
                    };

                    saveTranscriptToBackend(transcriptText, speaker);
                    setTranscripts((prev) => [...prev, transcript]);

                    if (speaker === "user") {
                        setIsUserSpeaking(true);
                        setTimeout(() => setIsUserSpeaking(false), 1500);
                    } else {
                        setIsAgentSpeaking(true);
                        setTimeout(() => setIsAgentSpeaking(false), 2000);
                    }
                }
            } catch {
                // Not JSON
            }
        };

        room.on(RoomEvent.TranscriptionReceived, handleTranscription);
        room.on(RoomEvent.DataReceived, handleData);

        return () => {
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
            room.off(RoomEvent.DataReceived, handleData);
        };
    }, [room, saveTranscriptToBackend]);

    const isConnected = connectionState === ConnectionState.Connected;
    const agentConnected = participants.some(p =>
        p.identity.toLowerCase().includes("agent") || p.isAgent
    );

    const currentState = isAgentSpeaking ? "Speaking..." : isUserSpeaking ? "Listening..." : "Ready";

    return (
        <div className="flex-1 relative h-full w-full">
            {/* Background Effects - Full Coverage */}
            <div className="absolute inset-0 preview-bg-pattern" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="radial-glow" />
            </div>

            {/* iPhone Mockup - True Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingRight: '200px' }}>
                <IPhoneMockup time={formatTime()} isConnected={isConnected}>
                    {/* 3D Glob Visualization - Centered */}
                    <div className="h-full flex flex-col items-center justify-center">
                        <div style={{ width: '200px', height: '200px' }}>
                            <AbstractBall
                                key="preview-glob"
                                perlinTime={isAgentSpeaking ? 25.0 : isUserSpeaking ? 18.0 : 40.0}
                                perlinMorph={isAgentSpeaking ? 8.0 : isUserSpeaking ? 6.0 : 3.0}
                                perlinDNoise={1.2}
                                chromaRGBr={8.0}
                                chromaRGBg={8.0}
                                chromaRGBb={8.0}
                                chromaRGBn={isAgentSpeaking || isUserSpeaking ? 0.4 : 0}
                                chromaRGBm={1.0}
                                cameraZoom={140}
                                spherePoints={true}
                                spherePsize={1.0}
                                cameraSpeedY={0.4}
                                cameraSpeedX={0.15}
                            />
                        </div>
                        <p className="text-foreground text-base font-medium mt-4">{agentName}</p>
                        <p className="text-muted-foreground text-sm">AI Voice Agent</p>
                        {isConnected && (
                            <div className="flex items-center gap-2 mt-3">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-foreground font-mono text-sm">{formatCallDuration(callSeconds)}</span>
                            </div>
                        )}
                    </div>
                </IPhoneMockup>

                {/* Control Bar below phone */}
                <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                        variant={isMuted ? "destructive" : "secondary"}
                        size="lg"
                        className="h-14 w-14 rounded-full"
                        onClick={toggleMicrophone}
                    >
                        {isMuted ? (
                            <MicrophoneOffIcon className="h-6 w-6" />
                        ) : (
                            <MicrophoneIcon className="h-6 w-6" />
                        )}
                    </Button>
                    <Button
                        variant="destructive"
                        size="lg"
                        className="h-14 w-14 rounded-full"
                        onClick={onDisconnect}
                    >
                        <PhoneOffIcon className="h-6 w-6" />
                    </Button>
                </div>
            </div>

            {/* Live Transcript Panel */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-[360px] bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 max-h-[70vh] flex flex-col">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-white font-semibold">Live Transcript</h3>
                    <SparklesIcon className="w-4 h-4 text-white/50" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 px-1 pt-1" ref={chatRef}>
                    {transcripts.length === 0 && !liveTranscript ? (
                        <p className="text-white/40 text-sm text-center py-8">
                            Transcripts will appear here...
                        </p>
                    ) : (
                        <>
                            {transcripts.map((t) => (
                                <div key={t.id} className="flex gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.speaker === "agent"
                                        ? "bg-white/10"
                                        : "bg-white/10"
                                        }`}>
                                        {t.speaker === "agent" ? (
                                            <SparklesIcon className="w-4 h-4 text-white" />
                                        ) : (
                                            <span className="text-xs text-white/70">You</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white/80 text-sm font-medium">
                                                {t.speaker === "agent" ? agentName : "User"}
                                            </span>
                                            <span className="text-white/40 text-xs">{t.timestamp}</span>
                                        </div>
                                        <p className="text-white/70 text-sm leading-relaxed">{t.text}</p>
                                    </div>
                                </div>
                            ))}
                            {/* Live typing indicator */}
                            {liveTranscript && (
                                <div className="flex gap-3 animate-pulse">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${liveTranscript.speaker === "agent"
                                        ? "bg-primary/20 ring-2 ring-primary/50"
                                        : "bg-blue-500/20 ring-2 ring-blue-500/50"
                                        }`}>
                                        {liveTranscript.speaker === "agent" ? (
                                            <SparklesIcon className="w-4 h-4 text-primary" />
                                        ) : (
                                            <span className="text-xs text-blue-400">You</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-white text-sm font-medium">
                                                {liveTranscript.speaker === "agent" ? agentName : "User"}
                                            </span>
                                            <span className="text-primary text-xs">speaking...</span>
                                        </div>
                                        <p className="text-white text-sm leading-relaxed">
                                            {liveTranscript.text}
                                            <span className="inline-block w-px h-4 bg-white ml-0.5 animate-pulse" />
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <RoomAudioRenderer />
        </div>
    );
}

// Sidebar content extracted for desktop + mobile reuse
function SidebarContent({
    selectedAgent,
    setSelectedAgent,
    isLoadingAgents,
    agents,
    selectedStt,
    selectedModel,
    setSelectedModel,
    connectionState,
    error,
    startSession,
    handleDisconnect,
}: {
    selectedAgent: string;
    setSelectedAgent: (v: string) => void;
    isLoadingAgents: boolean;
    agents: Agent[];
    selectedStt: string;
    selectedModel: string;
    setSelectedModel: (v: string) => void;
    connectionState: ConnectionStateType;
    error: string | null;
    startSession: () => void;
    handleDisconnect: () => void;
}) {
    return (
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

            {/* Model Selection */}
            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                {/* Agent Selection */}
                <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Select Agent
                    </Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent} disabled={isLoadingAgents}>
                        <SelectTrigger className="w-full">
                            <span className="truncate block text-left">
                                <SelectValue placeholder={isLoadingAgents ? "Loading..." : "Select agent"} />
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            {agents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{agent.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Speech-to-Text
                    </Label>
                    <Select value={selectedStt} disabled>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {sttModels.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Configured in agent settings
                    </p>
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Language Model
                    </Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {llmModels.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Text-to-Speech
                    </Label>
                    <Select defaultValue="resemble-custom" disabled>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ttsModels.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-4">
                    <div className="rounded-lg border bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Current Pipeline</p>
                        <div className="flex items-center gap-1 text-xs">
                            <Badge variant="outline" className={`text-[10px] ${PIPELINE_COLORS.stt}`}>
                                {selectedStt === 'assemblyai' ? 'AssemblyAI' : selectedStt === 'elevenlabs' ? 'ElevenLabs' : 'Deepgram'}
                            </Badge>
                            <span className="text-muted-foreground/30">&rarr;</span>
                            <Badge variant="outline" className={`text-[10px] ${PIPELINE_COLORS.llm}`}>Gemini</Badge>
                            <span className="text-muted-foreground/30">&rarr;</span>
                            <Badge variant="outline" className={`text-[10px] ${PIPELINE_COLORS.tts}`}>Resemble</Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Start/Stop Button */}
            <div className="p-4 border-t">
                {connectionState === "idle" && (
                    <Button className="w-full gap-2" onClick={startSession}>
                        <MicrophoneIcon className="h-4 w-4" />
                        Start Preview
                    </Button>
                )}
                {connectionState === "connecting" && (
                    <Button className="w-full" disabled>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Connecting...
                    </Button>
                )}
                {connectionState === "connected" && (
                    <Button className="w-full gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={handleDisconnect}>
                        <PhoneOffIcon className="h-4 w-4" />
                        Stop Preview
                    </Button>
                )}
                {connectionState === "error" && (
                    <div className="space-y-2">
                        <p className="text-xs text-red-400">{error}</p>
                        <Button className="w-full" variant="outline" onClick={startSession}>
                            Try Again
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

import { Suspense } from "react";

function PreviewPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [connectionState, setConnectionState] = useState<ConnectionStateType>("idle");
    const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");
    const [connectionData, setConnectionData] = useState<{
        token: string;
        wsUrl: string;
        roomName: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Agent selection state — read agentId from URL params if present
    const urlAgentId = searchParams.get("agentId");
    const [selectedAgent, setSelectedAgent] = useState<string>(urlAgentId || "default");
    const [agents, setAgents] = useState<Agent[]>([defaultAgent]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);
    const [selectedStt, setSelectedStt] = useState<string>("assemblyai");
    const [mobileOpen, setMobileOpen] = useState(false);

    const autoStarted = useRef(false);

    // Update STT when agent changes
    useEffect(() => {
        const agent = agents.find(a => a.id === selectedAgent);
        if (agent?.config?.stt_provider) {
            setSelectedStt(agent.config.stt_provider);
        } else {
            setSelectedStt("assemblyai");
        }
    }, [selectedAgent, agents]);

    // Fetch user's agents from API
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
                            "Content-Type": "application/json",
                            "X-User-Id": userId,
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setAgents([defaultAgent, ...data]);
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
            const roomName = `preview-${Date.now()}`;
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
            toast.success("Preview session started");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Connection failed";
            setError(message);
            setConnectionState("error");
            toast.error("Connection failed", { description: message });
        }
    }, [selectedAgent]);

    // Auto-start when agentId is in URL (e.g. from "Test Call" button)
    useEffect(() => {
        if (urlAgentId && userId && !autoStarted.current && connectionState === "idle") {
            autoStarted.current = true;
            startSession();
        }
    }, [urlAgentId, userId, connectionState, startSession]);

    const handleDisconnect = useCallback(async () => {
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

        setConnectionState("idle");
        setConnectionData(null);
        toast.info("Preview session ended");
    }, [connectionData]);

    return (
        <div className="flex h-screen bg-background">
            {/* Mobile hamburger */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-3 left-3 z-50"
                onClick={() => setMobileOpen(true)}
            >
                <MenuIcon className="h-5 w-5" />
            </Button>

            {/* Mobile sidebar overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-card flex flex-col lg:hidden"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3"
                                onClick={() => setMobileOpen(false)}
                            >
                                <XIcon className="h-5 w-5" />
                            </Button>
                            <SidebarContent
                                selectedAgent={selectedAgent}
                                setSelectedAgent={setSelectedAgent}
                                isLoadingAgents={isLoadingAgents}
                                agents={agents}
                                selectedStt={selectedStt}
                                selectedModel={selectedModel}
                                setSelectedModel={setSelectedModel}
                                connectionState={connectionState}
                                error={error}
                                startSession={startSession}
                                handleDisconnect={handleDisconnect}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 border-r bg-card flex-col">
                <SidebarContent
                    selectedAgent={selectedAgent}
                    setSelectedAgent={setSelectedAgent}
                    isLoadingAgents={isLoadingAgents}
                    agents={agents}
                    selectedStt={selectedStt}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    connectionState={connectionState}
                    error={error}
                    startSession={startSession}
                    handleDisconnect={handleDisconnect}
                />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-background">
                {/* Top Bar */}
                <header className="h-14 border-b flex items-center justify-between px-6">
                    <h1 className="font-semibold">Model Testing Preview</h1>
                    <div className="flex items-center gap-2">
                        {connectionState === "connected" && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                ● Live
                            </Badge>
                        )}
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {connectionState === "idle" && (
                        <div className="h-full flex items-center justify-center relative">
                            <div className="preview-bg-pattern" />
                            <div className="radial-glow" />
                            <div className="text-center relative z-10">
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                                    <MicrophoneIcon className="h-12 w-12 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2 text-white">Model Preview</h2>
                                <p className="text-white/50 max-w-md">
                                    Test your voice pipeline in real-time. Select your models and start a preview session.
                                </p>
                            </div>
                        </div>
                    )}

                    {connectionState === "connecting" && (
                        <div className="h-full flex items-center justify-center relative">
                            <div className="preview-bg-pattern" />
                            <div className="radial-glow" />
                            <div className="text-center relative z-10">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                                <p className="text-white/50">Starting preview session...</p>
                            </div>
                        </div>
                    )}

                    {connectionState === "connected" && connectionData && (
                        <LiveKitRoom
                            token={connectionData.token}
                            serverUrl={connectionData.wsUrl}
                            connect={true}
                            audio={true}
                            video={false}
                            onDisconnected={handleDisconnect}
                            className="h-full"
                        >
                            <PreviewContent
                                onDisconnect={handleDisconnect}
                                selectedModel={selectedModel}
                                agentName={agents.find(a => a.id === selectedAgent)?.name || "AI Agent"}
                            />
                        </LiveKitRoom>
                    )}

                    {connectionState === "error" && (
                        <div className="h-full flex items-center justify-center relative">
                            <div className="preview-bg-pattern" />
                            <div className="text-center relative z-10">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <span className="text-3xl">⚠️</span>
                                </div>
                                <p className="text-red-400 font-medium">Connection Failed</p>
                                <p className="text-white/50 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function PreviewPage() {
    return (
        <Suspense>
            <PreviewPageContent />
        </Suspense>
    );
}
