"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────────

const PROMPT =
    "Build me a receptionist that checks my calendar and routes to sales or support";

interface BuildAction {
    icon: "agent" | "tool" | "route" | "voice" | "phone";
    label: string;
    detail: string;
}

const BUILD_ACTIONS: BuildAction[] = [
    { icon: "agent", label: "Created Receptionist", detail: "Friendly greeter — answers calls, understands intent" },
    { icon: "tool", label: "Connected Google Calendar", detail: "Can check, create, and reschedule appointments" },
    { icon: "agent", label: "Created Sales Agent", detail: "Handles pricing questions, books demos, qualifies leads" },
    { icon: "agent", label: "Created Support Agent", detail: "Resolves issues, looks up orders, escalates to human" },
    { icon: "route", label: "Set Up Routing", detail: "Pricing → Sales · Issues → Support · Default → Receptionist" },
    { icon: "voice", label: "Assigned Voices", detail: "Sarah (receptionist) · James (sales) · Sarah (support)" },
    { icon: "phone", label: "Phone Number Ready", detail: "+1 (555) 012-3456 — inbound & outbound enabled" },
];

type Phase = "idle" | "typing" | "thinking" | "building" | "live";

// ─── Typing Hook ─────────────────────────────────────────────────────────────────

function useTypingEffect(text: string, active: boolean, speed = 22) {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        setDisplayed("");
        if (!active || !text) return;
        let i = 0;
        const iv = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) clearInterval(iv);
        }, speed);
        return () => clearInterval(iv);
    }, [text, active, speed]);
    return displayed;
}

// ─── Icons ───────────────────────────────────────────────────────────────────────

function ActionIcon({ type, className }: { type: BuildAction["icon"]; className?: string }) {
    const base = cn("h-4 w-4", className);
    switch (type) {
        case "agent":
            return (
                <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            );
        case "tool":
            return (
                <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm12-9.75h-2.25a2.25 2.25 0 01-2.25-2.25V6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5z" />
                </svg>
            );
        case "route":
            return (
                <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
            );
        case "voice":
            return (
                <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
            );
        case "phone":
            return (
                <svg className={base} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
            );
    }
}

function MiniSpinner() {
    return (
        <svg className="h-3.5 w-3.5 animate-spin text-primary/40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
            <path d="M12 2a10 10 0 019.17 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

function MiniCheck() {
    return (
        <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="h-3.5 w-3.5 text-chart-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
        >
            <path d="M5 13l4 4L19 7" />
        </motion.svg>
    );
}

function ThinkingDots() {
    return (
        <span className="inline-flex items-center gap-[3px] ml-1">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    className="h-1 w-1 rounded-full bg-primary/40"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </span>
    );
}

const BUILDER_THINKING =
    "I'll build a 3-agent system — a receptionist to greet callers, a sales agent for pricing, and a support agent for issues. I'll connect your calendar and set up smart routing.";

// ─── Main Component ──────────────────────────────────────────────────────────────

interface AgentBuilderDemoProps {
    className?: string;
}

export function AgentBuilderDemo({ className }: AgentBuilderDemoProps) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: false, amount: 0.3 });

    const [phase, setPhase] = useState<Phase>("idle");
    const [visibleActions, setVisibleActions] = useState(0);
    const [resolvedActions, setResolvedActions] = useState(0);
    const [loopCount, setLoopCount] = useState(0);
    const [started, setStarted] = useState(false);

    const typedText = useTypingEffect(PROMPT, phase === "typing", 22);
    const isTypeDone = typedText.length >= PROMPT.length;

    const thinkingText = useTypingEffect(BUILDER_THINKING, phase === "thinking", 18);

    useEffect(() => {
        if (inView && !started) setStarted(true);
    }, [inView, started]);

    const runSequence = useCallback(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];
        const t = (fn: () => void, ms: number) => {
            timers.push(setTimeout(fn, ms));
        };

        setPhase("typing");

        const typeDone = PROMPT.length * 22 + 500;

        // Thinking — Builder analyzes the request
        t(() => setPhase("thinking"), typeDone);

        const thinkDone = typeDone + BUILDER_THINKING.length * 18 + 800;

        // Building — actions appear one by one
        t(() => setPhase("building"), thinkDone);

        BUILD_ACTIONS.forEach((_, i) => {
            const d = thinkDone + 300 + i * 420;
            t(() => setVisibleActions(i + 1), d);
            t(() => setResolvedActions(i + 1), d + 340);
        });

        const buildDone = thinkDone + 300 + BUILD_ACTIONS.length * 420 + 500;

        // Live
        t(() => setPhase("live"), buildDone);

        // Reset
        t(() => {
            setPhase("idle");
            setVisibleActions(0);
            setResolvedActions(0);
            setLoopCount((c) => c + 1);
        }, buildDone + 5000);

        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        if (!started || !inView) return;
        const h = setTimeout(
            () => runSequence(),
            loopCount === 0 ? 600 : 500
        );
        return () => clearTimeout(h);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [started, inView, loopCount]);

    const isLive = phase === "live";
    const isWorking = phase === "building" || phase === "thinking";

    return (
        <div ref={ref} className={cn("relative", className)}>
            <div
                className={cn(
                    "rounded-2xl border overflow-hidden flex flex-col transition-all duration-700",
                    "bg-gradient-to-b from-card to-card/95 backdrop-blur-sm",
                    "shadow-2xl shadow-black/[0.08] dark:shadow-black/30",
                    isLive
                        ? "border-chart-2/25"
                        : "border-border"
                )}
            >
                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={cn(
                                "h-7 w-7 rounded-lg flex items-center justify-center transition-colors duration-500",
                                isLive ? "bg-chart-2/12" : "bg-primary/8"
                            )}
                        >
                            <svg
                                className={cn(
                                    "h-3.5 w-3.5 transition-colors duration-500",
                                    isLive ? "text-chart-2" : "text-primary"
                                )}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                />
                            </svg>
                        </div>
                        <span
                            className={cn(
                                "text-xs font-semibold transition-colors duration-500",
                                isLive ? "text-chart-2" : "text-foreground"
                            )}
                        >
                            Arkenos
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {isWorking && (
                            <span className="text-[10px] text-muted-foreground/50 animate-pulse">
                                {phase === "thinking" ? "Analyzing..." : "Building..."}
                            </span>
                        )}
                        {isLive && (
                            <span className="text-[10px] text-chart-2/70 font-medium">
                                Ready
                            </span>
                        )}
                        <div
                            className={cn(
                                "h-2 w-2 rounded-full transition-all duration-500",
                                isLive
                                    ? "bg-chart-2"
                                    : isWorking
                                        ? "bg-amber-400 animate-pulse"
                                        : "bg-muted-foreground/25"
                            )}
                        />
                    </div>
                </div>

                {/* ── Content ─────────────────────────────────────────── */}
                <div className="min-h-[380px] sm:min-h-[420px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {/* ── IDLE ────────────────────────────────────────── */}
                        {phase === "idle" && (
                            <motion.div
                                key={`idle-${loopCount}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex flex-col items-center justify-center px-8"
                            >
                                <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-5">
                                    <svg
                                        className="h-7 w-7 text-primary/30"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                        />
                                    </svg>
                                </div>
                                <p className="text-sm text-muted-foreground/30 text-center">
                                    Describe your agent to get started
                                </p>
                            </motion.div>
                        )}

                        {/* ── TYPING ──────────────────────────────────────── */}
                        {phase === "typing" && (
                            <motion.div
                                key={`typing-${loopCount}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -30 }}
                                transition={{ duration: 0.35 }}
                                className="absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-8"
                            >
                                <div className="w-full max-w-sm">
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-primary/60">
                                                You
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-muted/40 rounded-2xl rounded-tl-sm px-4 py-3.5">
                                        <p className="text-[13px] sm:text-sm leading-relaxed">
                                            {typedText}
                                            {!isTypeDone && (
                                                <span
                                                    className="inline-block w-[2px] h-3.5 bg-foreground/50 ml-0.5 align-middle rounded-full"
                                                    style={{
                                                        animation: "core-glow 0.8s ease-in-out infinite",
                                                    }}
                                                />
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── THINKING (Builder explains plan) ─────────── */}
                        {phase === "thinking" && (
                            <motion.div
                                key={`think-${loopCount}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -30 }}
                                transition={{ duration: 0.35 }}
                                className="absolute inset-0 flex flex-col px-6 sm:px-8 pt-6"
                            >
                                <div className="w-full max-w-sm mx-auto">
                                    {/* User prompt recap */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-[10px] font-bold text-primary/60">You</span>
                                            </div>
                                        </div>
                                        <div className="bg-muted/40 rounded-2xl rounded-tl-sm px-4 py-3">
                                            <p className="text-[12px] sm:text-[13px] leading-relaxed text-foreground/60">
                                                {PROMPT}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Builder response */}
                                    <div>
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <svg className="h-3 w-3 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                                </svg>
                                            </div>
                                            <span className="text-[10px] font-medium text-primary/50">Builder</span>
                                        </div>
                                        <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl rounded-tl-sm px-4 py-3.5">
                                            <p className="text-[12px] sm:text-[13px] leading-relaxed text-foreground/70">
                                                {thinkingText}
                                                {thinkingText.length < BUILDER_THINKING.length && <ThinkingDots />}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── BUILDING (action steps) ─────────────────────── */}
                        {phase === "building" && (
                            <motion.div
                                key={`build-${loopCount}`}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.35 }}
                                className="absolute inset-0 overflow-y-auto px-4 sm:px-5 py-4"
                            >
                                {/* Compact prompt recap */}
                                <div className="flex items-start gap-2 mb-4 px-1">
                                    <svg
                                        className="h-3.5 w-3.5 text-primary/40 shrink-0 mt-0.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                                        />
                                    </svg>
                                    <p className="text-[11px] text-muted-foreground/50 leading-relaxed line-clamp-2">
                                        {PROMPT}
                                    </p>
                                </div>

                                {/* Progress header */}
                                <div className="rounded-xl border border-border/60 bg-muted/15 overflow-hidden">
                                    <div className="px-3.5 py-2 border-b border-border/40 flex items-center gap-2">
                                        <svg
                                            className="h-3.5 w-3.5 text-primary/40"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                            />
                                        </svg>
                                        <span className="text-[11px] text-muted-foreground/50 font-medium">
                                            Building your system
                                        </span>
                                        <span className="ml-auto text-[10px] text-muted-foreground/30 font-mono">
                                            {resolvedActions}/{BUILD_ACTIONS.length}
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-[2px] bg-muted/30">
                                        <motion.div
                                            className="h-full bg-primary/40"
                                            initial={{ width: "0%" }}
                                            animate={{
                                                width: `${(resolvedActions / BUILD_ACTIONS.length) * 100}%`,
                                            }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                        />
                                    </div>

                                    {/* Action steps */}
                                    <div className="px-3 py-2 space-y-0.5">
                                        {BUILD_ACTIONS.slice(0, visibleActions).map((action, i) => {
                                            const resolved = i < resolvedActions;
                                            return (
                                                <motion.div
                                                    key={`${loopCount}-a-${i}`}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors duration-300"
                                                >
                                                    {/* Icon */}
                                                    <div
                                                        className={cn(
                                                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                                            resolved
                                                                ? "bg-chart-2/10"
                                                                : "bg-primary/8"
                                                        )}
                                                    >
                                                        <ActionIcon
                                                            type={action.icon}
                                                            className={cn(
                                                                "transition-colors duration-300",
                                                                resolved
                                                                    ? "text-chart-2/70"
                                                                    : "text-primary/40"
                                                            )}
                                                        />
                                                    </div>

                                                    {/* Label + detail */}
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className={cn(
                                                                "text-[12px] font-medium transition-colors duration-300",
                                                                resolved
                                                                    ? "text-foreground/80"
                                                                    : "text-foreground/50"
                                                            )}
                                                        >
                                                            {action.label}
                                                        </p>
                                                        {resolved && (
                                                            <motion.p
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: "auto" }}
                                                                transition={{ duration: 0.15 }}
                                                                className="text-[10px] text-muted-foreground/40 leading-snug"
                                                            >
                                                                {action.detail}
                                                            </motion.p>
                                                        )}
                                                    </div>

                                                    {/* Status */}
                                                    <div className="shrink-0">
                                                        {resolved ? <MiniCheck /> : <MiniSpinner />}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── LIVE ────────────────────────────────────────── */}
                        {isLive && (
                            <motion.div
                                key={`live-${loopCount}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="absolute inset-0 flex flex-col items-center justify-center px-6 sm:px-8"
                            >
                                {/* Success icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        damping: 12,
                                        stiffness: 200,
                                        delay: 0.1,
                                    }}
                                    className="h-16 w-16 rounded-2xl bg-chart-2/10 border-2 border-chart-2/30 flex items-center justify-center mb-5"
                                >
                                    <svg
                                        className="h-8 w-8 text-chart-2"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    >
                                        <path d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>

                                <motion.p
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-lg font-semibold text-chart-2 mb-1"
                                >
                                    Your Team is Live
                                </motion.p>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-sm text-muted-foreground mb-6"
                                >
                                    3 agents · 1 tool · smart routing
                                </motion.p>

                                {/* Summary card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="w-full max-w-xs rounded-xl border border-chart-2/20 bg-chart-2/[0.04] p-4"
                                >
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground/50 block mb-0.5">
                                                Phone
                                            </span>
                                            <span className="text-[12px] font-mono font-medium text-foreground/80">
                                                +1 (555) 012-3456
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground/50 block mb-0.5">
                                                Agents
                                            </span>
                                            <span className="text-[12px] font-medium text-foreground/80">
                                                Receptionist, Sales, Support
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground/50 block mb-0.5">
                                                Routing
                                            </span>
                                            <span className="text-[12px] font-medium text-foreground/80">
                                                Intent-based · 3 paths
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-muted-foreground/50 block mb-0.5">
                                                Status
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-2/50" />
                                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-chart-2" />
                                                </span>
                                                <span className="text-[12px] font-medium text-chart-2">
                                                    Taking calls
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Input bar ───────────────────────────────────────── */}
                <div className="px-4 sm:px-5 py-3 border-t border-border/40">
                    <div
                        className={cn(
                            "flex items-center gap-2 rounded-xl border px-3.5 py-2 transition-colors duration-500",
                            phase === "typing"
                                ? "border-primary/25 bg-primary/[0.03]"
                                : "border-border/50 bg-muted/20"
                        )}
                    >
                        <span className="text-[12px] text-muted-foreground/30 flex-1 truncate">
                            Describe your agent...
                        </span>
                        <div
                            className={cn(
                                "h-6 w-6 rounded-md flex items-center justify-center transition-colors duration-300",
                                phase === "typing"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/60 text-muted-foreground/30"
                            )}
                        >
                            <svg
                                className="h-3 w-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
