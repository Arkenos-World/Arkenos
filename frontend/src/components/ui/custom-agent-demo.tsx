"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Typing hook ────────────────────────────────────────────────────────────────

function useTyping(text: string, active: boolean, speed = 30) {
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

// ─── Data ───────────────────────────────────────────────────────────────────────

const PROMPT = "Create a voice agent for booking appointments with calendar integration";

const FILES: { name: string; depth: number; type: "py" | "folder" | "txt" | "yaml"; active: boolean }[] = [
  { name: "agent.py", depth: 0, type: "py", active: true },
  { name: "prompts", depth: 0, type: "folder", active: false },
  { name: "system.txt", depth: 1, type: "txt", active: false },
  { name: "tools", depth: 0, type: "folder", active: false },
  { name: "calendar.py", depth: 1, type: "py", active: false },
  { name: "__init__.py", depth: 1, type: "py", active: false },
  { name: "arkenos.yaml", depth: 0, type: "yaml", active: false },
];

const fileIcon: Record<string, React.ReactNode> = {
  py: <svg className="w-3 h-3 text-blue-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  folder: <svg className="w-3 h-3 text-amber-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>,
  txt: <svg className="w-3 h-3 text-white/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  yaml: <svg className="w-3 h-3 text-emerald-400/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

const CODE_LINES = [
  { text: '"""', color: "text-emerald-400/60" },
  { text: "Appointment Booking Voice Agent", color: "text-emerald-400/60" },
  { text: '"""', color: "text-emerald-400/60" },
  { text: "", color: "" },
  { text: "from livekit.agents import Agent, function_tool", color: "text-white/50" },
  { text: "from tools.calendar import check_slots, book", color: "text-white/50" },
  { text: "", color: "" },
  { text: "class BookingAgent(Agent):", color: "text-blue-400/80" },
  { text: '    """Handles appointment scheduling."""', color: "text-emerald-400/60" },
  { text: "", color: "" },
  { text: "    @function_tool", color: "text-amber-400/70" },
  { text: "    async def check_availability(self, date: str):", color: "text-blue-400/80" },
  { text: '        """Check open slots for a date."""', color: "text-emerald-400/60" },
  { text: "        slots = await check_slots(date)", color: "text-white/50" },
  { text: "        return f\"{len(slots)} slots available\"", color: "text-amber-400/70" },
  { text: "", color: "" },
  { text: "    @function_tool", color: "text-amber-400/70" },
  { text: "    async def book_appointment(self, date, time):", color: "text-blue-400/80" },
  { text: "        result = await book(date, time)", color: "text-white/50" },
  { text: "        return result.confirmation_id", color: "text-amber-400/70" },
];

const AI_RESPONSE = "I'll create a booking agent with calendar integration. Setting up the file structure, system prompt, and two function tools — check_availability and book_appointment.";

type Phase = "idle" | "prompting" | "thinking" | "coding" | "deployed";

// ─── Node-based canvas ──────────────────────────────────────────────────────────

// Center-aligned top-down tree layout
const NW = 140; // node width
// Node types: each has a category tint
const NODES = [
  { id: "start", label: "Call Received", sub: "Trigger", x: 200, y: 15, tint: "#818cf8" },
  { id: "greet", label: "Greet Caller", sub: "LLM", x: 200, y: 105, tint: "#818cf8" },
  { id: "intent", label: "Detect Intent", sub: "Router", x: 200, y: 195, tint: "#c084fc" },
  { id: "book", label: "Book Appointment", sub: "Function", x: 80, y: 300, tint: "#fbbf24" },
  { id: "faq", label: "Answer FAQ", sub: "Knowledge", x: 320, y: 300, tint: "#34d399" },
  { id: "confirm", label: "Send SMS", sub: "Action", x: 80, y: 395, tint: "#fbbf24" },
  { id: "end", label: "End Call", sub: "Finish", x: 320, y: 395, tint: "#f87171" },
];

const EDGES: { from: string; to: string; label?: string }[] = [
  { from: "start", to: "greet" },
  { from: "greet", to: "intent" },
  { from: "intent", to: "book", label: "booking" },
  { from: "intent", to: "faq", label: "question" },
  { from: "book", to: "confirm" },
  { from: "faq", to: "end" },
];

function NodeCanvas({ visibleCount }: { visibleCount: number }) {
  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));
  const visibleIds = new Set(NODES.slice(0, visibleCount).map((n) => n.id));
  const hw = NW / 2; // half node width

  return (
    <div className="relative w-full h-full">
      {/* Dot grid background */}
      <div className="absolute inset-0 opacity-[0.035]" style={{
        backgroundImage: "radial-gradient(circle, currentColor 0.8px, transparent 0.8px)",
        backgroundSize: "16px 16px",
      }} />

      {/* SVG edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {EDGES.map((e, i) => {
          if (!visibleIds.has(e.from) || !visibleIds.has(e.to)) return null;
          const from = nodeMap[e.from];
          const to = nodeMap[e.to];
          if (!from || !to) return null;

          const fx = from.x + hw, fy = from.y + 60; // bottom of from node
          const tx = to.x + hw, ty = to.y; // top of to node
          const sameCol = Math.abs(from.x - to.x) < 30;

          const d = sameCol
            ? `M${fx},${fy} L${tx},${ty}`
            : `M${fx},${fy} L${fx},${fy + 18} Q${fx},${fy + 28} ${fx + (tx > fx ? 10 : -10)},${fy + 28} L${tx + (tx > fx ? -10 : 10)},${fy + 28} Q${tx},${fy + 28} ${tx},${fy + 38} L${tx},${ty}`;

          return (
            <g key={i}>
              <motion.path
                d={d}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              {/* Arrow at end */}
              <motion.circle
                cx={tx} cy={ty - 2} r="2"
                fill="rgba(255,255,255,0.2)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
              {e.label && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <rect
                    x={(fx + tx) / 2 - 22}
                    y={fy + 20}
                    width="44" height="14" rx="4"
                    fill="rgba(0,0,0,0.6)"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="0.5"
                  />
                  <text
                    x={(fx + tx) / 2}
                    y={fy + 30}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.35)"
                    fontSize="8"
                  >
                    {e.label}
                  </text>
                </motion.g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      <AnimatePresence>
        {NODES.slice(0, visibleCount).map((node) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute group"
            style={{ left: node.x, top: node.y, width: NW }}
          >
            <div className="rounded-lg border border-white/[0.1] bg-[#111119] hover:border-white/[0.2] transition-all duration-200 shadow-md shadow-black/20 cursor-default px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.tint }} />
                <p className="text-[10px] text-white/80 font-semibold truncate">{node.label}</p>
              </div>
              <p className="text-[8px] text-white/25 mt-1 pl-4">{node.sub}</p>
            </div>
            {/* Connection port dots */}
            <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-white/[0.06] border border-white/[0.1]" />
            <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-white/[0.06] border border-white/[0.1]" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const NODE_AI_RESPONSE = "I'll set up a visual flow for your booking agent. Creating nodes for call handling, intent detection, appointment booking, FAQ lookup, and SMS confirmation.";

// ─── Component ──────────────────────────────────────────────────────────────────

export function CustomAgentDemo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleFiles, setVisibleFiles] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [visibleNodes, setVisibleNodes] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"code" | "visual">("code");

  const promptText = useTyping(PROMPT, phase === "prompting", 35);
  const currentAiResponse = mode === "code" ? AI_RESPONSE : NODE_AI_RESPONSE;
  const aiText = useTyping(currentAiResponse, phase === "thinking", 20);

  // Start on scroll into view
  useEffect(() => {
    if (!ref.current || started) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  const runSequence = useCallback(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const t = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    const aiResp = mode === "code" ? AI_RESPONSE : NODE_AI_RESPONSE;

    // Phase 1: User types prompt
    setPhase("prompting");
    const promptDone = PROMPT.length * 35 + 600;

    // Phase 2: AI responds
    t(() => setPhase("thinking"), promptDone);
    const thinkDone = promptDone + aiResp.length * 20 + 800;

    // Phase 3: Build
    t(() => setPhase("coding"), thinkDone);

    if (mode === "code") {
      FILES.forEach((_, i) => {
        t(() => setVisibleFiles(i + 1), thinkDone + 300 + i * 250);
      });
      CODE_LINES.forEach((_, i) => {
        t(() => setVisibleLines(i + 1), thinkDone + 800 + i * 120);
      });
    } else {
      // Nodes appear AFTER AI finishes typing, one by one
      NODES.forEach((_, i) => {
        t(() => setVisibleNodes(i + 1), thinkDone + 400 + i * 500);
      });
    }

    const buildTime = mode === "code"
      ? thinkDone + 800 + CODE_LINES.length * 120 + 500
      : thinkDone + 400 + NODES.length * 500 + 600;

    // Phase 4: Deployed
    t(() => setPhase("deployed"), buildTime);

    // Reset
    t(() => {
      setPhase("idle");
      setVisibleFiles(0);
      setVisibleLines(0);
      setVisibleNodes(0);
      setLoopCount((c) => c + 1);
    }, buildTime + 5000);

    return () => timers.forEach(clearTimeout);
  }, [mode]);

  // Reset animation when mode changes
  const cleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (cleanupRef.current) cleanupRef.current();
    setPhase("idle");
    setVisibleFiles(0);
    setVisibleLines(0);
    setVisibleNodes(0);
    // Small delay then restart
    const h = setTimeout(() => setLoopCount((c) => c + 1), 200);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!started) return;
    const h = setTimeout(() => {
      const cleanup = runSequence();
      cleanupRef.current = cleanup;
    }, loopCount === 0 ? 800 : 600);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, loopCount]);

  const isCoding = phase === "coding" || phase === "deployed";
  const isDeployed = phase === "deployed";

  return (
    <div ref={ref} className={className}>
      <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0f] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Mode toggle above IDE */}
        <div className="flex items-center justify-center gap-1 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center rounded-lg bg-white/[0.04] p-0.5">
            <button
              onClick={() => setMode("code")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[9px] font-medium transition-all cursor-pointer ${mode === "code" ? "bg-white/[0.1] text-white/80 shadow-sm" : "text-white/30 hover:text-white/50"}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25" /></svg>
              Developer IDE
            </button>
            <button
              onClick={() => setMode("visual")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[9px] font-medium transition-all cursor-pointer ${mode === "visual" ? "bg-white/[0.1] text-white/80 shadow-sm" : "text-white/30 hover:text-white/50"}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" /></svg>
              Visual Builder
            </button>
          </div>
        </div>

        {/* IDE Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/80" />
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              <span className="text-[10px] text-white/60 font-semibold">Booking Agent</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/25">
                {isDeployed ? "Live" : "No Build"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="px-2 py-0.5 rounded text-[8px] text-white/25 bg-white/[0.04]">Logs</div>
            <div className="px-2 py-0.5 rounded text-[8px] text-white/25 bg-white/[0.04]">Preview</div>
            <div className={`px-2.5 py-0.5 rounded text-[8px] font-medium transition-all duration-500 ${isDeployed ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.04] text-white/25"}`}>
              {isDeployed ? "✓ Deployed" : "Deploy"}
            </div>
          </div>
        </div>

        <div className="flex" style={{ height: 520 }}>
          {/* Left panel — Code or Visual */}
          {mode === "code" ? (
            <>
              {/* File Explorer */}
              <div className="w-[140px] border-r border-white/[0.06] p-2 shrink-0 hidden sm:block overflow-hidden">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Explorer</span>
                  <span className="text-[10px] text-white/20">+</span>
                </div>
                <AnimatePresence>
                  {FILES.slice(0, isCoding ? visibleFiles : 0).map((f) => (
                    <motion.div
                      key={f.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex items-center gap-1.5 py-1 rounded text-[9px] cursor-default ${f.active ? "bg-white/[0.06] text-white/70" : "text-white/30"}`}
                      style={{ paddingLeft: `${8 + f.depth * 12}px`, paddingRight: 6 }}
                    >
                      {fileIcon[f.type]}
                      <span className="truncate">{f.name}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Code Editor */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center border-b border-white/[0.06] px-2 h-7 shrink-0">
                  {isCoding && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] border-b border-indigo-400/40 text-[9px] text-white/60">
                      <span className="text-[8px]">📄</span> agent.py
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3 overflow-hidden font-mono text-[9px] leading-[1.6]">
                  {isCoding ? (
                    CODE_LINES.slice(0, visibleLines).map((line, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }} className="flex">
                        <span className="w-6 text-right text-white/10 mr-3 select-none shrink-0">{i + 1}</span>
                        <span className={line.color || "text-white/30"}>{line.text || "\u00A0"}</span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/10 text-[11px]">
                      {phase === "idle" ? "Waiting for AI assistant..." : "AI is writing code..."}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Node-based visual canvas */
            <div className="flex-1 min-w-0 overflow-hidden relative">
              {visibleNodes > 0 ? (
                <NodeCanvas visibleCount={visibleNodes} />
              ) : (
                <div className="flex items-center justify-center h-full text-white/10 text-[11px]">
                  {phase === "idle" ? "Waiting for AI assistant..." : "AI is designing flow..."}
                </div>
              )}
            </div>
          )}

          {/* AI Chat Panel */}
          <div className="w-[220px] border-l border-white/[0.06] flex flex-col shrink-0 hidden md:flex">
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
              <svg className="w-3 h-3 text-indigo-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-[9px] text-white/40 font-medium">AI Assistant</span>
            </div>

            <div className="flex-1 p-3 overflow-hidden space-y-3">
              {/* User message */}
              {(phase === "prompting" || phase === "thinking" || isCoding) && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-white/[0.08] flex items-center justify-center text-[7px] text-white/40">Y</div>
                    <span className="text-[8px] text-white/30">You</span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg rounded-tl-sm px-2.5 py-2 text-[9px] text-white/50 leading-relaxed">
                    {phase === "prompting" ? promptText : PROMPT}
                    {phase === "prompting" && promptText.length < PROMPT.length && (
                      <span className="inline-block w-[2px] h-3 bg-white/50 ml-0.5 animate-pulse" />
                    )}
                  </div>
                </motion.div>
              )}

              {/* AI response */}
              {(phase === "thinking" || isCoding) && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25" />
                      </svg>
                    </div>
                    <span className="text-[8px] text-indigo-400/50">Assistant</span>
                  </div>
                  <div className="bg-indigo-500/[0.06] border border-indigo-500/10 rounded-lg rounded-tl-sm px-2.5 py-2 text-[9px] text-white/45 leading-relaxed">
                    {phase === "thinking" ? aiText : currentAiResponse}
                    {phase === "thinking" && aiText.length < currentAiResponse.length && (
                      <span className="inline-flex items-center gap-[2px] ml-1">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="w-1 h-1 rounded-full bg-indigo-400/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Changes indicator */}
              {isCoding && mode === "code" && visibleFiles > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                  <p className="text-[8px] text-white/20">Files modified:</p>
                  {FILES.slice(0, visibleFiles).filter(f => f.type !== "folder").map((f) => (
                    <div key={f.name} className="flex items-center gap-1.5 text-[8px] text-emerald-400/50">
                      <span>+</span>
                      <span>{f.name}</span>
                    </div>
                  ))}
                </motion.div>
              )}
              {mode === "visual" && visibleNodes > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                  <p className="text-[8px] text-white/20">Nodes added:</p>
                  {NODES.slice(0, visibleNodes).map((n) => (
                    <div key={n.id} className="flex items-center gap-1.5 text-[8px] text-white/40">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: n.tint }} />
                      <span>{n.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Deploy success */}
              {isDeployed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center"
                >
                  <div className="text-emerald-400 text-[10px] font-medium mb-0.5">Agent Deployed</div>
                  <div className="text-[8px] text-emerald-400/50">+1 (555) 012-3456 · Live</div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-1.5 bg-white/[0.02]">
                <span className="text-[9px] text-white/20 flex-1 truncate">Ask the AI assistant...</span>
                <svg className="w-3 h-3 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
