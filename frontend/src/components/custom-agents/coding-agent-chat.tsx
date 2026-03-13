"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Send,
    Bot,
    User,
    FileCode,
    Check,
    Sparkles,
    Wand2,
    Copy,
    CheckCheck,
    FolderOpen,
    Pencil,
    Plus,
    Trash2,
    Loader2,
    Eye,
    AlertCircle,
    History,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import type { CodingAgentMessage, ConversationListItem } from "@/lib/api";

interface FileChange {
    file_path: string;
    action: "create" | "modify" | "delete" | "update";
    content?: string | null;
}

interface DetectedFileChange {
    file_path: string;
    action: string;
    saved: boolean;
}

/** Events streamed from the backend */
type StreamEvent =
    | { type: "status"; message: string }
    | { type: "file_read"; file_path: string; size_bytes: number }
    | { type: "chunk"; content: string }
    | { type: "file_write"; file_path: string; action: string; size_bytes?: number; version?: number }
    | { type: "file_error"; file_path: string; error: string }
    | { type: "file_changes"; file_changes: FileChange[]; auto_applied: boolean }
    | { type: "conversation"; id: string; title: string }
    | { type: "done" }
    | { type: "error"; content: string };

/** A single visual step shown in the activity feed during streaming */
interface ActivityStep {
    kind: "status" | "file_read" | "file_write" | "file_error";
    message: string;
    filePath?: string;
    action?: string;
    timestamp: number;
}

interface CodingAgentChatProps {
    agentId: string;
    userId: string;
    onFileChanged: (filePath: string, action: "create" | "update" | "delete") => void;
    onOpenFile?: (filePath: string) => void;
}

// ─── Markdown helpers ────────────────────────────────────────────

function formatMarkdown(text: string) {
    // Strip FILE_CHANGE markers AND their associated code blocks
    // Pattern: FILE_CHANGE: action filepath \n ```...```
    let cleaned = text.replace(
        /FILE_CHANGE:\s*(create|update|delete)\s+\S+\s*\n?\s*```[\s\S]*?```/g,
        ""
    );
    // Also strip any standalone FILE_CHANGE markers that didn't have a code block
    cleaned = cleaned.replace(/FILE_CHANGE:\s*(create|update|delete)\s+\S+\n?/g, "");
    // Strip "Here are the file changes:" type headers left behind
    cleaned = cleaned.replace(/\n*Here are the file changes:\s*\n*/gi, "\n");
    // Collapse excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

    if (!cleaned) return null;

    const parts = cleaned.split(/(```[\s\S]*?```)/g);

    return parts.map((part, i) => {
        if (part.startsWith("```")) {
            const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
            const lang = match?.[1] || "";
            const code = match?.[2] || part.slice(3, -3);
            return <CodeBlock key={i} language={lang} code={code.trim()} />;
        }
        return (
            <span key={i}>
                {part.split("\n").map((line, li) => (
                    <span key={li}>
                        {li > 0 && <br />}
                        {formatInline(line)}
                    </span>
                ))}
            </span>
        );
    });
}

function formatInline(text: string) {
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold text-foreground">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
            return (
                <code
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-muted text-[12px] font-mono text-violet-400"
                >
                    {part.slice(1, -1)}
                </code>
            );
        }
        return part;
    });
}

function CodeBlock({ language, code }: { language: string; code: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="my-2 rounded-lg border bg-[#0d1117] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.06]">
                <span className="text-[11px] font-mono text-white/40">{language || "code"}</span>
                <button onClick={handleCopy} className="text-white/30 hover:text-white/60 transition-colors">
                    {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </div>
            <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed">
                <code className="font-mono text-emerald-300">{code}</code>
            </pre>
        </div>
    );
}

// ─── Activity feed (Cursor-like step indicators) ─────────────────

function ActivityFeed({ steps, isActive }: { steps: ActivityStep[]; isActive: boolean }) {
    if (steps.length === 0) return null;
    return (
        <div className="ml-8 mb-2 space-y-0.5">
            {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 text-[12px]">
                    <StepIcon kind={step.kind} action={step.action} />
                    <span className="text-muted-foreground truncate">{step.message}</span>
                    {step.filePath && step.kind === "file_write" && (
                        <span className="ml-auto text-emerald-400/60 text-[10px] font-medium">saved</span>
                    )}
                    {step.kind === "file_error" && (
                        <span className="ml-auto text-red-400/60 text-[10px] font-medium">failed</span>
                    )}
                </div>
            ))}
            {isActive && (
                <div className="flex items-center gap-2 py-0.5 text-[12px]">
                    <Loader2 className="h-3 w-3 text-violet-400/60 animate-spin" />
                    <span className="text-muted-foreground/60">Working...</span>
                </div>
            )}
        </div>
    );
}

function StepIcon({ kind, action }: { kind: string; action?: string }) {
    const cls = "h-3 w-3 shrink-0";
    if (kind === "file_read") return <Eye className={`${cls} text-blue-400`} />;
    if (kind === "file_error") return <AlertCircle className={`${cls} text-destructive`} />;
    if (kind === "file_write") {
        if (action === "create") return <Plus className={`${cls} text-emerald-400`} />;
        if (action === "delete") return <Trash2 className={`${cls} text-destructive`} />;
        return <Pencil className={`${cls} text-blue-400`} />;
    }
    return <FolderOpen className={`${cls} text-muted-foreground`} />;
}

// ─── File change cards (shown after auto-apply) ──────────────────

function FileChangeCard({
    change,
    saved = true,
    onOpen,
}: {
    change: { file_path: string; action: string };
    saved?: boolean;
    onOpen?: () => void;
}) {
    const actionColors: Record<string, string> = {
        create: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        update: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        modify: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        delete: "text-red-400 bg-red-500/10 border-red-500/20",
    };

    return (
        <div className="rounded-lg border bg-muted/30 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] min-w-0">
                <FileCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono text-foreground/70 truncate">{change.file_path}</span>
                <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                        actionColors[change.action] || actionColors.modify
                    }`}
                >
                    {change.action}
                </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {saved ? (
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Saved
                    </span>
                ) : (
                    <span className="text-amber-400 text-[11px] flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Applying...
                    </span>
                )}
                {change.action !== "delete" && onOpen && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                        onClick={onOpen}
                    >
                        Open
                    </Button>
                )}
            </div>
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────

export function CodingAgentChat({
    agentId,
    userId,
    onFileChanged,
    onOpenFile,
}: CodingAgentChatProps) {
    const [messages, setMessages] = useState<CodingAgentMessage[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState("");
    const [displayContent, setDisplayContent] = useState("");
    const [detectedChanges, setDetectedChanges] = useState<DetectedFileChange[]>([]);
    const [writingFile, setWritingFile] = useState<string | null>(null);
    const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);
    const [streamingFileChanges, setStreamingFileChanges] = useState<FileChange[]>([]);

    // Conversation history state
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fullContentRef = useRef("");
    const detectedChangesRef = useRef<DetectedFileChange[]>([]);
    const apiUrl = getApiUrl();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent, displayContent, activitySteps]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    };

    const addActivity = useCallback((step: ActivityStep) => {
        setActivitySteps((prev) => [...prev, step]);
    }, []);

    // ─── Conversation history ─────────────────────────────────────

    const fetchConversations = useCallback(async () => {
        try {
            const res = await fetch(
                `${apiUrl}/agents/${agentId}/coding-agent/conversations`,
                { headers: { "x-user-id": userId } }
            );
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch {
            // non-fatal
        }
    }, [apiUrl, agentId, userId]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const loadConversation = useCallback(async (convId: string) => {
        try {
            const res = await fetch(
                `${apiUrl}/agents/${agentId}/coding-agent/conversations/${convId}`,
                { headers: { "x-user-id": userId } }
            );
            if (!res.ok) return;
            const data = await res.json();
            setActiveConversationId(convId);
            setMessages(
                data.messages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    file_changes: m.file_changes,
                    timestamp: m.created_at,
                }))
            );
            setShowHistory(false);
        } catch {
            // non-fatal
        }
    }, [apiUrl, agentId, userId]);

    const deleteConversation = useCallback(async (convId: string) => {
        try {
            const res = await fetch(
                `${apiUrl}/agents/${agentId}/coding-agent/conversations/${convId}`,
                {
                    method: "DELETE",
                    headers: { "x-user-id": userId },
                }
            );
            if (!res.ok) return;
            if (activeConversationId === convId) {
                setActiveConversationId(null);
                setMessages([]);
            }
            await fetchConversations();
        } catch {
            // non-fatal
        }
    }, [apiUrl, agentId, userId, activeConversationId, fetchConversations]);

    const handleNewChat = useCallback(() => {
        setActiveConversationId(null);
        setMessages([]);
        setShowHistory(false);
    }, []);

    // ─── Real-time FILE_CHANGE detection ──────────────────────────

    const processDisplayContent = useCallback((raw: string): {
        display: string;
        detected: DetectedFileChange[];
        currentlyWriting: string | null;
    } => {
        const fileChangeRegex = /FILE_CHANGE:\s*(create|update|delete)\s+(\S+)\s*\n?\s*```[\s\S]*?```/g;
        let display = raw;
        const detected: DetectedFileChange[] = [];
        let match;

        while ((match = fileChangeRegex.exec(raw)) !== null) {
            const existing = detectedChangesRef.current.find(
                (d) => d.file_path === match![2] && d.action === match![1]
            );
            detected.push({
                file_path: match[2],
                action: match[1],
                saved: existing?.saved ?? false,
            });
            display = display.replace(match[0], "");
        }

        // Handle partial (in-progress) FILE_CHANGE block
        let currentlyWriting: string | null = null;
        const partialMatch = display.match(/FILE_CHANGE:\s*(create|update|delete)\s+(\S+)[\s\S]*$/);
        if (partialMatch) {
            display = display.slice(0, partialMatch.index);
            currentlyWriting = partialMatch[2];
        }

        // Clean up excessive blank lines
        display = display.replace(/\n{3,}/g, "\n\n").trim();

        return { display, detected, currentlyWriting };
    }, []);

    // ─── Send message ─────────────────────────────────────────────

    const handleSend = useCallback(async () => {
        if (!input.trim() || isStreaming) return;

        const userMessage: CodingAgentMessage = {
            role: "user",
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsStreaming(true);
        setStreamingContent("");
        setDisplayContent("");
        setDetectedChanges([]);
        setWritingFile(null);
        setActivitySteps([]);
        setStreamingFileChanges([]);
        fullContentRef.current = "";
        detectedChangesRef.current = [];

        if (inputRef.current) inputRef.current.style.height = "auto";

        try {
            const response = await fetch(
                `${apiUrl}/agents/${agentId}/coding-agent/chat`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-user-id": userId },
                    body: JSON.stringify({
                        agent_id: agentId,
                        prompt: userMessage.content,
                        context_files: [],
                        conversation_id: activeConversationId,
                    }),
                }
            );

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Chat request failed (${response.status}): ${errText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No readable stream");

            const decoder = new TextDecoder();
            let fileChanges: FileChange[] = [];
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const jsonStr = line.slice(6).trim();
                    if (!jsonStr) continue;

                    try {
                        const event: StreamEvent = JSON.parse(jsonStr);

                        switch (event.type) {
                            case "status":
                                addActivity({
                                    kind: "status",
                                    message: event.message,
                                    timestamp: Date.now(),
                                });
                                break;

                            case "file_read":
                                addActivity({
                                    kind: "file_read",
                                    message: `Reading ${event.file_path}`,
                                    filePath: event.file_path,
                                    timestamp: Date.now(),
                                });
                                break;

                            case "chunk": {
                                fullContentRef.current += event.content;
                                setStreamingContent(fullContentRef.current);

                                // Real-time FILE_CHANGE detection
                                const { display, detected, currentlyWriting } =
                                    processDisplayContent(fullContentRef.current);

                                detectedChangesRef.current = detected;
                                setDisplayContent(display);
                                setDetectedChanges(detected);
                                setWritingFile(currentlyWriting);
                                break;
                            }

                            case "file_write":
                                addActivity({
                                    kind: "file_write",
                                    message: `${event.action === "delete" ? "Deleted" : "Saved"} ${event.file_path}`,
                                    filePath: event.file_path,
                                    action: event.action,
                                    timestamp: Date.now(),
                                });
                                // Mark the corresponding detected change as saved
                                detectedChangesRef.current = detectedChangesRef.current.map((d) =>
                                    d.file_path === event.file_path ? { ...d, saved: true } : d
                                );
                                setDetectedChanges([...detectedChangesRef.current]);
                                // Notify parent to refresh file tree & editor
                                onFileChanged(
                                    event.file_path,
                                    event.action as "create" | "update" | "delete"
                                );
                                break;

                            case "file_error":
                                addActivity({
                                    kind: "file_error",
                                    message: `Failed: ${event.file_path} — ${event.error}`,
                                    filePath: event.file_path,
                                    timestamp: Date.now(),
                                });
                                break;

                            case "file_changes":
                                fileChanges = event.file_changes || [];
                                setStreamingFileChanges(fileChanges);
                                break;

                            case "conversation":
                                setActiveConversationId(event.id);
                                fetchConversations();
                                break;

                            case "error":
                                fullContentRef.current += `\n\nError: ${event.content}`;
                                setStreamingContent(fullContentRef.current);
                                setDisplayContent(fullContentRef.current);
                                break;

                            case "done":
                                break;
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }
            }

            const assistantMessage: CodingAgentMessage = {
                role: "assistant",
                content: fullContentRef.current,
                file_changes: fileChanges.length > 0
                    ? fileChanges.map((fc) => ({
                          file_path: fc.file_path,
                          action: (fc.action === "update" ? "modify" : fc.action) as "create" | "modify" | "delete",
                          content: fc.content ?? undefined,
                      }))
                    : undefined,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent("");
            setDisplayContent("");
            setDetectedChanges([]);
            setWritingFile(null);
            setStreamingFileChanges([]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: CodingAgentMessage = {
                role: "assistant",
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please check that the backend is running and try again.`,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setStreamingContent("");
            setDisplayContent("");
            setDetectedChanges([]);
            setWritingFile(null);
        } finally {
            setIsStreaming(false);
            setActivitySteps([]);
            fullContentRef.current = "";
            detectedChangesRef.current = [];
        }
    }, [input, isStreaming, apiUrl, agentId, userId, activeConversationId, addActivity, onFileChanged, processDisplayContent, fetchConversations]);

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="flex items-center justify-between px-3 h-9 border-b bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                    <Wand2 className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">AI Assistant</span>
                </div>
                <div className="flex items-center gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setShowHistory(!showHistory)}
                        title="Chat history"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                        <History className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleNewChat}
                        title="New chat"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Conversation history overlay */}
            {showHistory && (
                <div className="absolute inset-x-0 top-[41px] bottom-0 z-10 bg-background/95 backdrop-blur-sm overflow-y-auto">
                    <div className="p-3 space-y-1">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[13px] font-medium hover:bg-violet-500/15 transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            New conversation
                        </button>
                        {conversations.length === 0 ? (
                            <p className="text-[12px] text-muted-foreground text-center py-4">No conversations yet</p>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => loadConversation(conv.id)}
                                    className={`group w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between ${
                                        activeConversationId === conv.id ? "bg-muted" : ""
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[12px] text-foreground/70 truncate">{conv.title}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {conv.message_count} messages · {new Date(conv.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConversation(conv.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {messages.length === 0 && !isStreaming && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
                            <Wand2 className="h-4.5 w-4.5 text-violet-400/60" />
                        </div>
                        <p className="text-sm font-medium text-foreground/70 mb-1">
                            AI Coding Assistant
                        </p>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-[240px]">
                            Describe what you want to build and the AI will write the code for you.
                        </p>
                        <div className="mt-5 space-y-1.5 w-full max-w-[260px]">
                            {[
                                "Create a voice agent for booking",
                                "Add a function to check order status",
                                "Handle customer complaints",
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setInput(suggestion);
                                        inputRef.current?.focus();
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg border border-border/50 bg-muted/20 text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:border-border transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, msgIdx) => (
                    <MessageBubble
                        key={msgIdx}
                        msg={msg}
                        onOpenFile={onOpenFile}
                    />
                ))}

                {/* Streaming message */}
                {isStreaming && (
                    <div className="space-y-2">
                        {/* Activity feed — shows file reads, writes, status */}
                        <ActivityFeed steps={activitySteps} isActive={!streamingContent} />

                        {/* Streaming text content */}
                        <div className="flex items-start gap-2.5">
                            <div className="h-6 w-6 rounded-md bg-violet-500/15 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot className="h-3.5 w-3.5 text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {displayContent ? (
                                    <div className="text-[13px] leading-relaxed text-foreground/80">
                                        {formatMarkdown(displayContent)}
                                        <span className="inline-block w-1.5 h-4 bg-violet-400/80 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
                                    </div>
                                ) : streamingContent ? (
                                    /* We have streaming content but displayContent is empty (all content is FILE_CHANGE blocks) */
                                    <div className="text-[13px] leading-relaxed text-foreground/80">
                                        <span className="inline-block w-1.5 h-4 bg-violet-400/80 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 py-1">
                                        <div className="flex gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:0ms]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:150ms]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:300ms]" />
                                        </div>
                                        <span className="text-[11px] text-muted-foreground/60 ml-1">
                                            {activitySteps.length > 0
                                                ? activitySteps[activitySteps.length - 1].message
                                                : "Thinking..."}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Writing file indicator */}
                        {writingFile && (
                            <div className="ml-8 flex items-center gap-2 py-1 text-[12px]">
                                <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                                <span className="text-amber-400 font-mono">Writing {writingFile}...</span>
                            </div>
                        )}

                        {/* Detected file changes during streaming */}
                        {detectedChanges.length > 0 && (
                            <div className="ml-8 space-y-1.5">
                                {detectedChanges.map((change, idx) => (
                                    <FileChangeCard
                                        key={`${change.file_path}-${idx}`}
                                        change={change}
                                        saved={change.saved}
                                        onOpen={
                                            onOpenFile && change.action !== "delete"
                                                ? () => onOpenFile(change.file_path)
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )}

                        {/* Streaming file changes from file_changes SSE event */}
                        {streamingFileChanges.length > 0 && (
                            <div className="ml-8 space-y-1.5">
                                {streamingFileChanges.map((change, idx) => (
                                    <FileChangeCard
                                        key={idx}
                                        change={change}
                                        saved={true}
                                        onOpen={
                                            onOpenFile && change.action !== "delete"
                                                ? () => onOpenFile(change.file_path)
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask the AI assistant..."
                        className="flex-1 min-w-0 resize-none rounded-lg border bg-muted/30 px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                        rows={1}
                        disabled={isStreaming}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isStreaming || !input.trim()}
                        className="h-[36px] w-[36px] shrink-0 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:bg-muted disabled:text-muted-foreground text-white flex items-center justify-center transition-colors"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Message bubble ──────────────────────────────────────────────

function MessageBubble({
    msg,
    onOpenFile,
}: {
    msg: CodingAgentMessage;
    onOpenFile?: (filePath: string) => void;
}) {
    const isUser = msg.role === "user";

    return (
        <div className="space-y-2">
            <div className="flex items-start gap-2.5">
                <div
                    className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                        isUser ? "bg-muted" : "bg-violet-500/15"
                    }`}
                >
                    {isUser ? (
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <Bot className="h-3.5 w-3.5 text-violet-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    {isUser ? (
                        <p className="text-[13px] text-foreground leading-relaxed">{msg.content}</p>
                    ) : (
                        <div className="text-[13px] leading-relaxed text-foreground/80">
                            {formatMarkdown(msg.content)}
                        </div>
                    )}
                </div>
            </div>

            {/* File changes (already auto-applied) */}
            {msg.file_changes && msg.file_changes.length > 0 && (
                <div className="ml-8 space-y-1.5">
                    {msg.file_changes.map((change: FileChange, idx: number) => (
                        <FileChangeCard
                            key={idx}
                            change={change}
                            saved={true}
                            onOpen={
                                onOpenFile && change.action !== "delete"
                                    ? () => onOpenFile(change.file_path)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
