"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────────

const PROMPT =
  "Create a restaurant receptionist that books tables, checks availability, and sends SMS confirmations";

interface FileEntry {
  name: string;
  indent: number;        // 0 = root, 1 = child, 2 = grandchild
  isDir?: boolean;
  snippet?: string;      // optional code preview
}

const FILES: FileEntry[] = [
  { name: "restaurant-agent/", indent: 0, isDir: true },
  { name: "config.json", indent: 1, snippet: '{ "model": "gemini-3-flash", "voice": "en-US" }' },
  { name: "stt.py", indent: 1, snippet: "class SpeechToText:  # Deepgram nova-2" },
  { name: "llm.py", indent: 1, snippet: "class ReasoningEngine:  # Gemini 3 Flash" },
  { name: "tts.py", indent: 1, snippet: "class TextToSpeech:  # Resemble AI" },
  { name: "tools/", indent: 1, isDir: true },
  { name: "book_table.py", indent: 2, snippet: "async def book_table(date, guests, time):" },
  { name: "check_avail.py", indent: 2, snippet: "async def check_availability(date, time):" },
  { name: "send_sms.py", indent: 2, snippet: "async def send_sms(to, message):" },
  { name: "memory.py", indent: 1, snippet: "class ConversationMemory:  # per-caller" },
  { name: "agent.py", indent: 1, snippet: "app = VoiceAgent(config, tools, memory)" },
];

interface BootStep {
  text: string;
}

const BOOT_STEPS: BootStep[] = [
  { text: "Starting voice pipeline..." },
  { text: "Connecting STT (Deepgram)" },
  { text: "Connecting LLM (Gemini 3 Flash)" },
  { text: "Connecting TTS (Resemble AI)" },
  { text: "Registering 3 tools" },
  { text: "Assigning phone number" },
];

type Phase = "idle" | "typing" | "building" | "booting" | "live";

// ─── Typing Effect ───────────────────────────────────────────────────────────────

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

// ─── Spinner ─────────────────────────────────────────────────────────────────────

function MiniSpinner() {
  return (
    <svg className="h-3 w-3 animate-spin text-primary/50" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 019.17 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MiniCheck({ className }: { className?: string }) {
  return (
    <svg className={cn("h-3 w-3", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── File Tree Prefix ────────────────────────────────────────────────────────────

function treePrefix(indent: number, isLast: boolean): string {
  if (indent === 0) return "";
  const branch = isLast ? "└── " : "├── ";
  if (indent === 1) return branch;
  // indent 2: parent prefix + branch
  return "│   " + branch;
}

// ─── Main Component ──────────────────────────────────────────────────────────────

interface LiveCallDemoProps {
  className?: string;
}

export function LiveCallDemo({ className }: LiveCallDemoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.3 });

  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleFiles, setVisibleFiles] = useState(0);
  const [resolvedFiles, setResolvedFiles] = useState(0);
  const [visibleBoot, setVisibleBoot] = useState(0);
  const [resolvedBoot, setResolvedBoot] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [started, setStarted] = useState(false);

  const typedText = useTypingEffect(PROMPT, phase === "typing", 20);
  const isTypeDone = typedText.length >= PROMPT.length;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [phase, visibleFiles, resolvedFiles, visibleBoot, resolvedBoot]);

  useEffect(() => {
    if (inView && !started) setStarted(true);
  }, [inView, started]);

  const runSequence = useCallback(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)); };

    setPhase("typing");

    const typeDone = PROMPT.length * 20 + 300;

    // Building phase — files appear one by one
    t(() => setPhase("building"), typeDone);

    FILES.forEach((file, i) => {
      const d = typeDone + 200 + i * 320;
      t(() => setVisibleFiles(i + 1), d);
      // Dirs resolve instantly, files after a beat
      if (file.isDir) {
        t(() => setResolvedFiles(i + 1), d + 50);
      } else {
        t(() => setResolvedFiles(i + 1), d + 250);
      }
    });

    const buildDone = typeDone + 200 + FILES.length * 320 + 300;

    // Booting phase
    t(() => setPhase("booting"), buildDone);

    BOOT_STEPS.forEach((_, i) => {
      const d = buildDone + 200 + i * 400;
      t(() => setVisibleBoot(i + 1), d);
      t(() => setResolvedBoot(i + 1), d + 320);
    });

    const bootDone = buildDone + 200 + BOOT_STEPS.length * 400 + 400;

    // Live
    t(() => setPhase("live"), bootDone);

    // Reset
    t(() => {
      setPhase("idle");
      setVisibleFiles(0);
      setResolvedFiles(0);
      setVisibleBoot(0);
      setResolvedBoot(0);
      setLoopCount((c) => c + 1);
    }, bootDone + 4500);

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!started || !inView) return;
    const h = setTimeout(() => runSequence(), loopCount === 0 ? 500 : 400);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, inView, loopCount]);

  const isLive = phase === "live";
  const showResponse = phase === "building" || phase === "booting" || isLive;

  // Determine if a file is the last at its indent level
  function isLastAtIndent(idx: number): boolean {
    const file = FILES[idx];
    for (let j = idx + 1; j < FILES.length; j++) {
      if (FILES[j].indent === file.indent) return false;
      if (FILES[j].indent < file.indent) break;
    }
    return true;
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div className={cn(
        "rounded-2xl border overflow-hidden flex flex-col transition-all duration-700",
        "bg-gradient-to-b from-card to-card/95 backdrop-blur-sm",
        "shadow-2xl shadow-black/[0.08] dark:shadow-black/30",
        isLive ? "border-chart-2/25" : "border-border",
      )}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center transition-colors duration-500",
              isLive ? "bg-chart-2/12" : "bg-primary/8",
            )}>
              <svg
                className={cn("h-3.5 w-3.5 transition-colors duration-500", isLive ? "text-chart-2" : "text-primary")}
                fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <span className={cn(
              "text-xs font-semibold transition-colors duration-500",
              isLive ? "text-chart-2" : "text-foreground",
            )}>
              Arkenos
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {(phase === "building" || phase === "booting") && (
              <span className="text-[10px] text-muted-foreground/50 animate-pulse">
                {phase === "building" ? "Building..." : "Deploying..."}
              </span>
            )}
            <div className={cn(
              "h-2 w-2 rounded-full transition-all duration-500",
              isLive ? "bg-chart-2" :
              (phase === "building" || phase === "booting") ? "bg-amber-400 animate-pulse" :
              "bg-muted-foreground/25",
            )} />
          </div>
        </div>

        {/* ── Chat Body ───────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 min-h-[360px] sm:min-h-[400px] max-h-[500px]">

          {/* ── User message ──────────────────────────────────── */}
          <AnimatePresence>
            {phase !== "idle" && (
              <motion.div
                key={`user-${loopCount}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-[10px] text-muted-foreground/50 mb-1 block">You</span>
                <div className="bg-muted/50 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[95%]">
                  <p className="text-[13px] leading-relaxed">
                    {phase === "typing" ? (
                      <>
                        {typedText}
                        {!isTypeDone && (
                          <span
                            className="inline-block w-[2px] h-3.5 bg-foreground/50 ml-0.5 align-middle rounded-full"
                            style={{ animation: "core-glow 0.8s ease-in-out infinite" }}
                          />
                        )}
                      </>
                    ) : PROMPT}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Arkenos response ───────────────────────────────── */}
          <AnimatePresence>
            {showResponse && (
              <motion.div
                key={`response-${loopCount}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-[10px] text-muted-foreground/50 mb-1 block">Arkenos</span>

                <div className="space-y-3">
                  {/* ── File Tree ────────────────────────────────── */}
                  <div className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                    <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
                      <svg className="h-3 w-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">Project Files</span>
                    </div>
                    <div className="px-3 py-2 font-mono text-[11px] leading-relaxed space-y-0">
                      {FILES.slice(0, visibleFiles).map((file, i) => {
                        const resolved = i < resolvedFiles;
                        const prefix = treePrefix(file.indent, isLastAtIndent(i));

                        return (
                          <motion.div
                            key={`${loopCount}-file-${i}`}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {/* File row */}
                            <div className="flex items-center gap-1.5 py-[2px]">
                              <span className="text-muted-foreground/30 select-none whitespace-pre">{prefix}</span>
                              {file.isDir ? (
                                <svg className="h-3 w-3 text-primary/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                </svg>
                              ) : (
                                <svg className="h-3 w-3 text-muted-foreground/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                              )}
                              <span className={cn(
                                "transition-colors duration-300 flex-1",
                                file.isDir ? "text-primary/80 font-medium" : "text-foreground/80",
                                isLive && !file.isDir && "text-chart-2/80",
                              )}>
                                {file.name}
                              </span>
                              {!file.isDir && (
                                <span className="shrink-0 ml-auto">
                                  {resolved ? (
                                    <MiniCheck className={cn(isLive ? "text-chart-2" : "text-chart-2/70")} />
                                  ) : (
                                    <MiniSpinner />
                                  )}
                                </span>
                              )}
                            </div>
                            {/* Code snippet */}
                            {file.snippet && resolved && !file.isDir && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.2 }}
                                className="ml-6 sm:ml-7"
                              >
                                <span className={cn(
                                  "text-[10px] transition-colors duration-500",
                                  isLive ? "text-chart-2/40" : "text-muted-foreground/40",
                                )}>
                                  {file.snippet}
                                </span>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Boot Log ─────────────────────────────────── */}
                  <AnimatePresence>
                    {(phase === "booting" || isLive) && (
                      <motion.div
                        key={`boot-${loopCount}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden"
                      >
                        <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
                          <svg className="h-3 w-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                          <span className="text-[10px] text-muted-foreground/60 font-medium font-mono">$ arkenos deploy</span>
                        </div>
                        <div className="px-3 py-2 font-mono text-[11px] space-y-1">
                          {BOOT_STEPS.slice(0, visibleBoot).map((step, i) => {
                            const resolved = i < resolvedBoot;
                            return (
                              <motion.div
                                key={`${loopCount}-boot-${i}`}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className={cn(
                                  "transition-colors duration-300",
                                  resolved
                                    ? isLive ? "text-chart-2/70" : "text-foreground/60"
                                    : "text-muted-foreground/60",
                                )}>
                                  {step.text}
                                </span>
                                <span className="shrink-0">
                                  {resolved ? (
                                    <MiniCheck className={cn(isLive ? "text-chart-2" : "text-chart-2/70")} />
                                  ) : (
                                    <MiniSpinner />
                                  )}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Live Result ───────────────────────────────── */}
                  <AnimatePresence>
                    {isLive && (
                      <motion.div
                        key={`live-${loopCount}`}
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="rounded-xl border border-chart-2/25 bg-chart-2/[0.04] p-3.5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-2/50" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-2" />
                            </span>
                            <span className="text-xs font-semibold text-chart-2">Agent Live</span>
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground">+1 (555) 012-3456</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                          <span>Restaurant Receptionist</span>
                          <span className="h-3 w-px bg-border" />
                          <span>3 tools</span>
                          <span className="h-3 w-px bg-border" />
                          <span className="text-chart-2 font-medium">Ready</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Idle state ────────────────────────────────────── */}
          <AnimatePresence>
            {phase === "idle" && (
              <motion.div
                key={`idle-${loopCount}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground/30">Describe your agent to get started</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Input bar ───────────────────────────────────────── */}
        <div className="px-4 sm:px-5 py-3 border-t border-border/40">
          <div className={cn(
            "flex items-center gap-2 rounded-xl border px-3.5 py-2 transition-colors duration-500",
            phase === "typing" ? "border-primary/25 bg-primary/[0.03]" : "border-border/50 bg-muted/20",
          )}>
            <span className="text-[12px] text-muted-foreground/30 flex-1 truncate">
              Describe your agent...
            </span>
            <div className={cn(
              "h-6 w-6 rounded-md flex items-center justify-center transition-colors duration-300",
              phase === "typing" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground/30",
            )}>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
