"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AGENT_TEMPLATES, AgentTemplate } from "./agent-templates";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    PlusIcon,
    BotIcon,
    HeartIcon,
    UserIcon,
    CalendarIcon,
    DocumentIcon,
    PhoneIcon,
} from "@/components/icons";
import { Code2 } from "lucide-react";
import { STATUS_BG } from "@/lib/design-tokens";

interface ResembleVoice {
    id: string;
    name: string;
    language: string;
    source?: string;
    voice_type?: string;
}

function getTemplateIcon(icon: AgentTemplate["icon"], className?: string) {
    switch (icon) {
        case "blank":
            return <PlusIcon className={className} />;
        case "support":
            return <HeartIcon className={className} />;
        case "lead":
            return <UserIcon className={className} />;
        case "calendar":
            return <CalendarIcon className={className} />;
        case "form":
            return <DocumentIcon className={className} />;
        default:
            return <BotIcon className={className} />;
    }
}

function getAgentCardIcon(agent: Agent) {
    // Custom/code agents get a code icon with violet theme
    if (agent.agent_mode === "CUSTOM") {
        return {
            icon: <Code2 className="h-5 w-5 text-violet-500" />,
            bg: "bg-violet-500/10",
        };
    }
    // Map template to icon + color
    const template = agent.config?.template;
    switch (template) {
        case "customer-support":
            return {
                icon: <HeartIcon className="h-5 w-5 text-rose-500" />,
                bg: "bg-rose-500/10",
            };
        case "lead-qualification":
            return {
                icon: <UserIcon className="h-5 w-5 text-blue-500" />,
                bg: "bg-blue-500/10",
            };
        case "appointment-scheduler":
            return {
                icon: <CalendarIcon className="h-5 w-5 text-amber-500" />,
                bg: "bg-amber-500/10",
            };
        case "info-collector":
            return {
                icon: <DocumentIcon className="h-5 w-5 text-emerald-500" />,
                bg: "bg-emerald-500/10",
            };
        default:
            return {
                icon: <BotIcon className="h-5 w-5 text-primary" />,
                bg: "bg-primary/10",
            };
    }
}

interface Agent {
    id: string;
    name: string;
    description: string | null;
    type: "STT" | "LLM" | "TTS" | "PIPELINE";
    is_active: boolean;
    phone_number?: string | null;
    agent_mode?: "STANDARD" | "CUSTOM";
    config?: {
        system_prompt?: string;
        first_message?: string;
        llm_model?: string;
        template?: string;
    };
    calls?: number;
    avgDuration?: string;
}

interface AgentListProps {
    initialAgents: Agent[];
    userId: string;
}

export function AgentList({ initialAgents, userId }: AgentListProps) {
    const router = useRouter();
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
    const [agentName, setAgentName] = useState("New Assistant");
    const [selectedVoice, setSelectedVoice] = useState("");
    const [resembleVoices, setResembleVoices] = useState<ResembleVoice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);
    const [creationStep, setCreationStep] = useState<"mode" | "template">("mode");
    const [selectedMode, setSelectedMode] = useState<"STANDARD" | "CUSTOM" | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    useEffect(() => {
        const fetchVoices = async () => {
            try {
                const res = await fetch(`${apiUrl}/resemble/voices`);
                if (!res.ok) throw new Error("Failed to fetch voices");
                const data: { voices: ResembleVoice[] } = await res.json();
                const voices = data.voices ?? [];
                setResembleVoices(voices);
                if (voices.length > 0) setSelectedVoice(voices[0].id);
            } catch (e) {
                console.error("Could not load voices:", e);
                setResembleVoices([]);
            } finally {
                setIsLoadingVoices(false);
            }
        };
        fetchVoices();
    }, [apiUrl]);

    const handleSelectTemplate = (template: AgentTemplate) => {
        setSelectedTemplate(template);
    };

    const handleCreate = async () => {
        if (!selectedTemplate || !agentName.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agents/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: agentName,
                        description: selectedTemplate.description,
                        type: "PIPELINE",
                        config: {
                            system_prompt: selectedTemplate.systemPrompt.replaceAll("{{agent_name}}", agentName),
                            first_message: selectedTemplate.firstMessage.replaceAll("{{agent_name}}", agentName),
                            first_message_mode: "assistant_speaks_first",
                            llm_provider: "gemini",
                            llm_model: "gemini-3-flash-preview",
                            template: selectedTemplate.id,
                            voice_provider: "resemble",
                            voice_id: selectedVoice,
                            voice_name: resembleVoices.find(v => v.id === selectedVoice)?.name,
                        },
                        user_id: userId,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to create agent');
            }

            const newAgent = await response.json();
            setAgents([newAgent, ...agents]);
            setIsOpen(false);
            setSelectedTemplate(null);
            setAgentName("New Assistant");
            setSelectedVoice(resembleVoices[0]?.id ?? "");

            toast.success("Assistant created successfully!", {
                description: `${newAgent.name} is now ready to configure.`,
            });

            // Navigate to agent settings page
            router.push(`/dashboard/agents/${newAgent.id}`);
        } catch (error) {
            console.error("Failed to create agent:", error);
            toast.error("Failed to create assistant", {
                description: "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCustom = async () => {
        if (!agentName.trim()) return;
        setIsLoading(true);
        try {
            const response = await fetch(
                `${apiUrl}/agents/`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: agentName,
                        description: "Custom code-driven agent",
                        type: "PIPELINE",
                        agent_mode: "CUSTOM",
                        config: {},
                        user_id: userId,
                    }),
                }
            );
            if (!response.ok) throw new Error('Failed to create agent');
            const newAgent = await response.json();
            setAgents([newAgent, ...agents]);
            setIsOpen(false);
            setSelectedTemplate(null);
            setSelectedMode(null);
            setCreationStep("mode");
            setAgentName("New Assistant");
            toast.success("Custom agent created!", {
                description: `${newAgent.name} is ready for coding.`,
            });
            router.push(`/dashboard/agents/${newAgent.id}/code`);
        } catch (error) {
            console.error("Failed to create custom agent:", error);
            toast.error("Failed to create agent", {
                description: "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAgentClick = (agentId: string) => {
        router.push(`/dashboard/agents/${agentId}`);
    };

    const handleCloseDialog = () => {
        setIsOpen(false);
        setSelectedTemplate(null);
        setSelectedMode(null);
        setCreationStep("mode");
        setAgentName("New Assistant");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Assistants</h1>
                    <p className="text-muted-foreground">Create and manage your voice assistants</p>
                </div>

                <Button className="gap-2" onClick={() => setIsOpen(true)}>
                    <PlusIcon className="h-4 w-4" />
                    Create Assistant
                </Button>
            </div>

            {/* Create Assistant Dialog */}
            <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Create Assistant
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Step 1: Mode Selection */}
                        {creationStep === "mode" && (
                            <div>
                                <h3 className="font-semibold mb-2">Choose agent type</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Select how you want to build your assistant.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${selectedMode === "STANDARD"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                        onClick={() => setSelectedMode("STANDARD")}
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                            <BotIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <h4 className="font-semibold mb-1">Standard Agent</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Config-driven setup. Choose a template, configure your prompts, voice, and tools through the UI.
                                        </p>
                                    </div>
                                    <div
                                        className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${selectedMode === "CUSTOM"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                        onClick={() => setSelectedMode("CUSTOM")}
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                                            </svg>
                                        </div>
                                        <h4 className="font-semibold mb-1">Custom Agent</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Write Python code directly. Full control over agent logic with an in-browser IDE and AI coding assistant.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Template Selection (Standard only) */}
                        {creationStep === "template" && (
                            <div>
                                <h3 className="font-semibold mb-2">Choose a template</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Here&apos;s a few templates to get you started, or you can create your own template and use it to create a new assistant.
                                </p>

                                {/* Assistant Name */}
                                <div className="mb-4">
                                    <Label htmlFor="name" className="text-sm">
                                        Assistant Name <span className="text-muted-foreground text-xs">(This can be adjusted at any time after creation.)</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={agentName}
                                        onChange={(e) => setAgentName(e.target.value)}
                                        placeholder="New Assistant"
                                        className="mt-1"
                                    />
                                </div>

                                {/* Voice Selection */}
                                <div className="mb-4">
                                    <Label className="text-sm">Voice</Label>
                                    <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isLoadingVoices}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder={isLoadingVoices ? "Loading voices..." : "Select a voice"} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60 overflow-y-auto">
                                            {resembleVoices.map((voice) => (
                                                <SelectItem key={voice.id} value={voice.id}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{voice.name}</span>
                                                        <span className="text-xs text-muted-foreground">· {voice.language}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {!isLoadingVoices && resembleVoices.length === 0 && (
                                                <div className="px-2 py-3 text-sm text-muted-foreground">
                                                    No voices found. Check your RESEMBLE_API_KEY.
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Blank Template */}
                                <div
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all mb-4 ${selectedTemplate?.id === "blank"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                    onClick={() => handleSelectTemplate(AGENT_TEMPLATES[0])}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center">
                                            <PlusIcon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Blank Template</h4>
                                            <p className="text-sm text-muted-foreground">
                                                This blank slate template with minimal configurations. It&apos;s a starting point for creating your custom assistant.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quickstart Templates */}
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quickstart</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {AGENT_TEMPLATES.slice(1).map((template) => (
                                        <div
                                            key={template.id}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                                }`}
                                            onClick={() => handleSelectTemplate(template)}
                                        >
                                            <div className="mb-3">
                                                {getTemplateIcon(template.icon, "h-6 w-6 text-muted-foreground")}
                                            </div>
                                            <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {template.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Custom Agent Name (shown in mode step when CUSTOM selected) */}
                        {creationStep === "mode" && selectedMode === "CUSTOM" && (
                            <div>
                                <Label htmlFor="custom-name" className="text-sm">
                                    Agent Name
                                </Label>
                                <Input
                                    id="custom-name"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    placeholder="My Custom Agent"
                                    className="mt-1"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        {creationStep === "template" && (
                            <Button variant="ghost" onClick={() => { setCreationStep("mode"); setSelectedTemplate(null); }}>
                                Back
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleCloseDialog}>
                            Close
                        </Button>
                        {creationStep === "mode" && selectedMode === "STANDARD" && (
                            <Button
                                onClick={() => setCreationStep("template")}
                            >
                                Next
                            </Button>
                        )}
                        {creationStep === "mode" && selectedMode === "CUSTOM" && (
                            <Button
                                onClick={handleCreateCustom}
                                disabled={isLoading || !agentName.trim()}
                            >
                                {isLoading ? "Creating..." : "Create Custom Agent"}
                            </Button>
                        )}
                        {creationStep === "template" && (
                            <Button
                                onClick={handleCreate}
                                disabled={isLoading || !selectedTemplate || !agentName.trim()}
                            >
                                {isLoading ? "Creating..." : "+ Create Assistant"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Agents Grid */}
            {agents.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <BotIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="font-semibold mb-2">No assistants yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first voice assistant to get started</p>
                        <Button className="gap-2" onClick={() => setIsOpen(true)}>
                            <PlusIcon className="h-4 w-4" />
                            Create Assistant
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => {
                        const { icon: agentIcon, bg: agentBg } = getAgentCardIcon(agent);
                        return (
                        <Card
                            key={agent.id}
                            className="hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => handleAgentClick(agent.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-lg ${agentBg} flex items-center justify-center`}>
                                            {agentIcon}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{agent.name}</CardTitle>
                                            <CardDescription>
                                                {agent.config?.template || agent.type}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {agent.agent_mode === "CUSTOM" && (
                                            <Badge variant="outline" className="gap-1 text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/10">
                                                Code
                                            </Badge>
                                        )}
                                        {agent.phone_number && (
                                            <Badge variant="outline" className={`gap-1 ${STATUS_BG.positive}`}>
                                                <PhoneIcon className="h-3 w-3" />
                                                SIP
                                            </Badge>
                                        )}
                                        <Badge variant={agent.is_active ? "default" : "secondary"}>
                                            {agent.is_active ? "active" : "inactive"}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {agent.description && (
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                        {agent.description}
                                    </p>
                                )}
                                <div className="flex gap-6 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Calls</p>
                                        <p className="font-medium">{agent.calls || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Avg Duration</p>
                                        <p className="font-medium">{agent.avgDuration || "0:00"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
