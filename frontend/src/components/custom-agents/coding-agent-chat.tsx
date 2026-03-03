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
    Copy,
    CheckCheck,
    FolderOpen,
    Pencil,
    Plus,
    Trash2,
    Loader2,
    Eye,
    AlertCircle,
} from "lucide-react";
import type { CodingAgentMessage } from "@/lib/api";

interface FileChange {
    file_path: string;
    action: "create" | "modify" | "delete" | "update";
    content?: string | null;
}

/** Events streamed from the backend */
type StreamEvent =
    | { type: "status"; message: string }
    | { type: "file_read"; file_path: string; size_bytes: number }
    | { type: "chunk"; content: string }
    | { type: "file_write"; file_path: string; action: string; size_bytes?: number; version?: number }
    | { type: "file_error"; file_path: string; error: string }
    | { type: "file_changes"; file_changes: FileChange[]; auto_applied: boolean }
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
                    className="px-1 py-0.5 rounded bg-white/5 text-[13px] font-mono text-violet-300"
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
        <div className="my-2 rounded-lg border border-white/[0.06] bg-[#0d1117] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/[0.06]">
                <span className="text-[11px] font-mono text-white/40">{language || "code"}</span>
                <button onClick={handleCopy} className="text-white/30 hover:text-white/60 transition-colors">
                    {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
            </div>
            <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed">
                <code className="font-mono text-emerald-300/90">{code}</code>
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
                    <span className="text-white/50 truncate">{step.message}</span>
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
                    <span className="text-white/30">Working...</span>
                </div>
            )}
        </div>
    );
}

function StepIcon({ kind, action }: { kind: string; action?: string }) {
    const cls = "h-3 w-3 shrink-0";
    if (kind === "file_read") return <Eye className={`${cls} text-blue-400/60`} />;
    if (kind === "file_error") return <AlertCircle className={`${cls} text-red-400/60`} />;
    if (kind === "file_write") {
        if (action === "create") return <Plus className={`${cls} text-emerald-400/60`} />;
        if (action === "delete") return <Trash2 className={`${cls} text-red-400/60`} />;
        return <Pencil className={`${cls} text-blue-400/60`} />;
    }
    return <FolderOpen className={`${cls} text-white/30`} />;
}

// ─── File change cards (shown after auto-apply) ──────────────────

function FileChangeCard({
    change,
    onOpen,
}: {
    change: FileChange;
    onOpen?: () => void;
}) {
    const actionColors = {
        create: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        update: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        modify: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        delete: "text-red-400 bg-red-500/10 border-red-500/20",
    };

    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] min-w-0">
                <FileCode className="h-3.5 w-3.5 text-white/30 shrink-0" />
                <span className="font-mono text-white/70 truncate">{change.file_path}</span>
                <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                        actionColors[change.action] || actionColors.modify
                    }`}
                >
                    {change.action}
                </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Saved
                </span>
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
    const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);
    const [streamingFileChanges, setStreamingFileChanges] = useState<FileChange[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent, activitySteps]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    };

    const addActivity = useCallback((step: ActivityStep) => {
        setActivitySteps((prev) => [...prev, step]);
    }, []);

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
        setActivitySteps([]);
        setStreamingFileChanges([]);

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
            let fullContent = "";
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

                            case "chunk":
                                fullContent += event.content;
                                setStreamingContent(fullContent);
                                break;

                            case "file_write":
                                addActivity({
                                    kind: "file_write",
                                    message: `${event.action === "delete" ? "Deleted" : "Saved"} ${event.file_path}`,
                                    filePath: event.file_path,
                                    action: event.action,
                                    timestamp: Date.now(),
                                });
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

                            case "error":
                                fullContent += `\n\nError: ${event.content}`;
                                setStreamingContent(fullContent);
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
                content: fullContent,
                file_changes: fileChanges.length > 0 ? fileChanges : undefined,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingContent("");
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
        } finally {
            setIsStreaming(false);
            setActivitySteps([]);
        }
    }, [input, isStreaming, apiUrl, agentId, userId, addActivity, onFileChanged]);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f]">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="h-6 w-6 rounded-md bg-violet-500/15 flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <span className="text-[13px] font-semibold text-white/80">AI Assistant</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {messages.length === 0 && !isStreaming && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                            <Sparkles className="h-6 w-6 text-violet-400/60" />
                        </div>
                        <p className="text-[13px] text-white/50 leading-relaxed">
                            Ask the AI to help you write agent code.
                        </p>
                        <p className="text-[12px] text-white/30 mt-2">
                            Try: &quot;Add a function to handle customer complaints&quot;
                        </p>
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
                                {streamingContent ? (
                                    <div className="text-[13px] leading-relaxed text-white/80">
                                        {formatMarkdown(streamingContent)}
                                        <span className="inline-block w-1.5 h-4 bg-violet-400/80 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 py-1">
                                        <div className="flex gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:0ms]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:150ms]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:300ms]" />
                                        </div>
                                        <span className="text-[11px] text-white/30 ml-1">
                                            {activitySteps.length > 0
                                                ? activitySteps[activitySteps.length - 1].message
                                                : "Thinking..."}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Streaming file changes (auto-applied) */}
                        {streamingFileChanges.length > 0 && (
                            <div className="ml-8 space-y-1.5">
                                {streamingFileChanges.map((change, idx) => (
                                    <FileChangeCard
                                        key={idx}
                                        change={change}
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
            <div className="px-3 pb-3 pt-2 border-t border-white/[0.06]">
                <div className="relative">
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
                        className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 pr-10 text-[13px] text-white/90 placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                        rows={1}
                        disabled={isStreaming}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isStreaming || !input.trim()}
                        className="absolute right-2 bottom-2 h-7 w-7 rounded-md bg-violet-500/80 hover:bg-violet-500 disabled:bg-white/[0.05] disabled:text-white/20 text-white flex items-center justify-center transition-colors"
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
                        isUser ? "bg-white/[0.08]" : "bg-violet-500/15"
                    }`}
                >
                    {isUser ? (
                        <User className="h-3.5 w-3.5 text-white/50" />
                    ) : (
                        <Bot className="h-3.5 w-3.5 text-violet-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    {isUser ? (
                        <p className="text-[13px] text-white/90 leading-relaxed">{msg.content}</p>
                    ) : (
                        <div className="text-[13px] leading-relaxed text-white/80">
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
