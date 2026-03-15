"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function Counter({ to, duration = 2000 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <span>{val.toLocaleString()}</span>;
}

function MiniWave({ bars = 12 }: { bars?: number }) {
  return (
    <div className="flex items-end gap-[1.5px] h-full">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-[2.5px] rounded-full bg-emerald-400/70 origin-bottom"
          style={{
            height: "100%",
            animation: `waveform-bar ${0.8 + (Math.sin(i * 1.3) * 0.3 + 0.3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.05}s`,
            "--wave-scale": (0.2 + Math.sin(i * 0.6) * 0.3 + 0.3).toFixed(3),
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function SmoothAreaChart({ pts, color, id }: { pts: number[]; color: string; id: string }) {
  const max = Math.max(...pts) * 1.1;
  const w = 300, h = 60;
  const coords = pts.map((v, i) => ({ x: (i / (pts.length - 1)) * w, y: h - (v / max) * (h - 4) }));
  let d = `M${coords[0].x},${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const c = coords[i], n = coords[i + 1];
    const cpx = (c.x + n.x) / 2;
    d += ` C${cpx},${c.y} ${cpx},${n.y} ${n.x},${n.y}`;
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function ChartBars({ heights }: { heights: number[] }) {
  return (
    <div className="flex items-end gap-[3px] h-full">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 rounded-t-sm bg-gradient-to-t from-indigo-500/60 to-indigo-400/40 origin-bottom"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ─── Page Contents ──────────────────────────────────────────────────────────────

function DashboardPage() {
  return (
    <>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Total Calls", value: 847, color: "text-white/90" },
          { label: "Avg Duration", text: "2:31", color: "text-white/90" },
          { label: "Success Rate", value: 94, suffix: "%", color: "text-emerald-400" },
          { label: "Active Agents", value: 3, color: "text-indigo-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5">
            <p className="text-[9px] text-white/30 mb-1 truncate">{s.label}</p>
            <p className={`text-sm font-bold ${s.color}`}>
              {s.text ?? <Counter to={s.value!} />}{s.suffix ?? ""}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-white/40 font-medium">Call Volume</p>
          <div className="flex gap-1">
            {["7d", "30d", "90d"].map((p, i) => (
              <div key={p} className={`px-2 py-0.5 rounded text-[9px] ${i === 1 ? "bg-white/10 text-white/70" : "text-white/20"}`}>{p}</div>
            ))}
          </div>
        </div>
        <div className="h-[80px]">
          <SmoothAreaChart pts={[15,20,18,30,28,35,40,32,38,45,40,50,44,35,48,55,47,35,42,32]} color="#6366f1" id="dashArea" />
        </div>
      </div>
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-white/40 font-medium">Active Calls</p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] text-emerald-400/70">3 live</span>
          </div>
        </div>
        {[
          { agent: "Sales Agent", type: "Inbound", number: "+1 (555) 012-3456", dur: "2:14" },
          { agent: "Support Agent", type: "Outbound", number: "+1 (555) 789-0123", dur: "0:47" },
          { agent: "Receptionist", type: "Inbound", number: "+1 (555) 456-7890", dur: "1:03" },
        ].map((c, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-t border-white/[0.04] first:border-0">
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-indigo-400/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/60 font-medium truncate">
                {c.agent} <span className="text-white/20">— {c.type} {c.number}</span>
              </p>
            </div>
            <div className="w-[50px] h-3 shrink-0 hidden sm:block"><MiniWave bars={10} /></div>
            <span className="text-[9px] text-white/30 font-mono w-8 text-right">{c.dur}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function AgentsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [agentTab, setAgentTab] = useState("model");

  const agents = [
    { name: "Sales Agent", template: "Lead Qualification", status: "active", calls: 312, color: "bg-blue-500/20 text-blue-400", voice: "James", model: "Gemini 2.5 Flash" },
    { name: "Support Agent", template: "Customer Service", status: "active", calls: 458, color: "bg-emerald-500/20 text-emerald-400", voice: "Sarah", model: "Gemini 2.5 Flash" },
    { name: "Receptionist", template: "Inbound Router", status: "active", calls: 77, color: "bg-violet-500/20 text-violet-400", voice: "Emily", model: "Gemini 1.5 Flash" },
    { name: "Survey Bot", template: "Post-Call Survey", status: "inactive", calls: 0, color: "bg-amber-500/20 text-amber-400", voice: "Alex", model: "Gemini 1.5 Pro" },
  ];

  const agent = agents.find((a) => a.name === selected);

  // Agent detail view
  if (agent) {
    const tabs = [
      { id: "model", label: "Model" },
      { id: "voice", label: "Voice" },
      { id: "functions", label: "Functions" },
      { id: "phone", label: "Phone" },
    ];
    return (
      <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => { setSelected(null); setAgentTab("model"); }} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${agent.color}`}>{agent.name[0]}</div>
          <span className="text-[11px] text-white/80 font-semibold">{agent.name}</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/25">{agent.template}</span>
          <div className="ml-auto flex gap-1">
            <div className="px-2 py-0.5 rounded bg-white/[0.05] text-white/30 text-[8px]">Test</div>
            <div className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[8px]">Save</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-white/[0.06] pb-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setAgentTab(t.id)}
              className={`px-2.5 py-1 rounded text-[9px] transition-all cursor-pointer ${agentTab === t.id ? "bg-white/[0.08] text-white/80" : "text-white/25 hover:text-white/50"}`}
            >{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div key={agentTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {agentTab === "model" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-white/30 mb-1">Provider</p>
                  <div className="rounded bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-white/50 flex items-center justify-between">
                    Gemini <svg className="w-2.5 h-2.5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 mb-1">Model</p>
                  <div className="rounded bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-white/50 flex items-center justify-between">
                    {agent.model} <svg className="w-2.5 h-2.5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 mb-1">First Message</p>
                  <div className="rounded bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-white/40 italic">
                    &quot;Hi! Thanks for calling. How can I help you today?&quot;
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] text-white/30">System Prompt</p>
                    <div className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 text-[7px]">Generate</div>
                  </div>
                  <div className="rounded bg-white/[0.04] border border-white/[0.06] px-2.5 py-2 text-[9px] text-white/35 leading-relaxed min-h-[80px] font-mono">
                    You are a {agent.template.toLowerCase()} agent for a company. Be professional, helpful, and concise. Always confirm details before taking action...
                  </div>
                </div>
              </div>
            )}
            {agentTab === "voice" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-white/30 mb-1">TTS Provider</p>
                  <div className="rounded bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-white/50">Resemble AI</div>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 mb-2">Selected Voice</p>
                  <div className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-2 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51" /></svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-300 font-medium">{agent.voice}</p>
                      <p className="text-[8px] text-indigo-400/50">English · Female</p>
                    </div>
                    <span className="ml-auto text-[7px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">Active</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 mb-2">Available Voices</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Sarah", "James", "Emily", "Alex", "Maria", "David"].map((v) => (
                      <div key={v} className={`rounded px-2 py-1.5 border text-[9px] flex items-center gap-1.5 cursor-pointer transition-colors ${v === agent.voice ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300" : "border-white/[0.06] text-white/30 hover:border-white/[0.12]"}`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424" /></svg>
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {agentTab === "functions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] text-white/30">Configured Functions</p>
                  <div className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 text-[8px]">+ Add</div>
                </div>
                {[
                  { name: "check_availability", method: "GET", params: 2, desc: "Check calendar for open slots" },
                  { name: "book_appointment", method: "POST", params: 4, desc: "Book a confirmed appointment" },
                  { name: "send_sms", method: "POST", params: 2, desc: "Send confirmation SMS to caller" },
                ].map((fn, i) => (
                  <motion.div key={fn.name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="rounded bg-white/[0.03] border border-white/[0.06] px-2.5 py-2 hover:border-white/[0.1] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-white/60 font-mono font-medium">{fn.name}</span>
                      <span className={`text-[7px] px-1 py-0.5 rounded font-mono ${fn.method === "GET" ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"}`}>{fn.method}</span>
                      <span className="text-[7px] text-white/15">{fn.params} params</span>
                    </div>
                    <p className="text-[8px] text-white/25">{fn.desc}</p>
                  </motion.div>
                ))}
              </div>
            )}
            {agentTab === "phone" && (
              <div className="space-y-3">
                <div>
                  <p className="text-[9px] text-white/30 mb-1">Telephony Provider</p>
                  <div className="rounded bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-white/50">Twilio</div>
                </div>
                <div>
                  <p className="text-[9px] text-white/30 mb-1">Assigned Number</p>
                  <div className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-2 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300 font-mono font-medium">+1 (555) 012-3456</span>
                    <span className="text-[7px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 cursor-pointer hover:bg-red-500/25 transition-colors">Release</span>
                  </div>
                </div>
                <div className="rounded bg-white/[0.03] border border-white/[0.06] p-2.5">
                  <p className="text-[9px] text-white/40 font-medium mb-2">SIP Pipeline Status</p>
                  {[
                    { step: "LiveKit Room", ok: true },
                    { step: "SIP Trunk", ok: true },
                    { step: "Dispatch Rule", ok: true },
                    { step: "Inbound Routing", ok: true },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-2 py-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                      <span className="text-[8px] text-white/40">{s.step}</span>
                      <span className="text-[7px] text-emerald-400/60 ml-auto">ok</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  // Agent list view
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-white/60 font-semibold">Agents</p>
        <div className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-400 text-[9px] font-medium cursor-pointer hover:bg-indigo-500/30 transition-colors">+ Create Agent</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {agents.map((a, i) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            onClick={() => setSelected(a.name)}
            className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 hover:border-white/[0.15] hover:bg-white/[0.04] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${a.color}`}>
                {a.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/70 font-medium truncate">{a.name}</p>
                <p className="text-[8px] text-white/25">{a.template}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${a.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.04] text-white/20"}`}>
                {a.status}
              </span>
              <span className="text-[8px] text-white/20">{a.calls} calls</span>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function CallLogsPage() {
  const logs = [
    { agent: "Sales Agent", number: "+1 (555) 012-3456", dur: "3:42", status: "COMPLETED", time: "2 min ago" },
    { agent: "Support Agent", number: "+1 (555) 789-0123", dur: "1:18", status: "COMPLETED", time: "5 min ago" },
    { agent: "Receptionist", number: "+1 (555) 456-7890", dur: "0:34", status: "TRANSFERRED", time: "8 min ago" },
    { agent: "Sales Agent", number: "+1 (555) 321-6540", dur: "5:07", status: "COMPLETED", time: "12 min ago" },
    { agent: "Support Agent", number: "+1 (555) 654-3210", dur: "2:55", status: "FAILED", time: "15 min ago" },
    { agent: "Receptionist", number: "+1 (555) 111-2222", dur: "1:02", status: "COMPLETED", time: "20 min ago" },
  ];
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-white/60 font-semibold">Call Logs</p>
        <div className="flex gap-1">
          <div className="px-2 py-0.5 rounded text-[8px] bg-white/10 text-white/50">All</div>
          <div className="px-2 py-0.5 rounded text-[8px] text-white/20">Inbound</div>
          <div className="px-2 py-0.5 rounded text-[8px] text-white/20">Outbound</div>
        </div>
      </div>
      {/* Table header */}
      <div className="grid grid-cols-[1fr_0.6fr_0.4fr_0.5fr] gap-2 px-2 py-1 text-[8px] text-white/20 uppercase tracking-wider border-b border-white/[0.04]">
        <span>Agent</span><span>Duration</span><span>Status</span><span className="text-right">Time</span>
      </div>
      {logs.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className="grid grid-cols-[1fr_0.6fr_0.4fr_0.5fr] gap-2 px-2 py-2 text-[9px] border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
        >
          <div className="min-w-0">
            <p className="text-white/60 font-medium truncate">{l.agent}</p>
            <p className="text-white/20 text-[8px] truncate">{l.number}</p>
          </div>
          <span className="text-white/40 font-mono self-center">{l.dur}</span>
          <span className={`self-center text-[8px] px-1.5 py-0.5 rounded-full w-fit ${
            l.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" :
            l.status === "TRANSFERRED" ? "bg-amber-500/15 text-amber-400" :
            "bg-red-500/15 text-red-400"
          }`}>{l.status}</span>
          <span className="text-white/20 text-right self-center">{l.time}</span>
        </motion.div>
      ))}
    </>
  );
}

function AnalyticsPage() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] text-white/60 font-semibold">Analytics</p>
          <p className="text-[8px] text-white/25">Track your voice agent performance</p>
        </div>
        <div className="flex gap-1">
          {["7d", "30d", "90d"].map((p, i) => (
            <div key={p} className={`px-2 py-0.5 rounded text-[9px] ${i === 1 ? "bg-white/10 text-white/70" : "text-white/20"}`}>{p}</div>
          ))}
        </div>
      </div>

      {/* 4 KPI cards with sparklines */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "Total Calls", value: "847", delta: "+23%", up: true, spark: [1,1,1,2,2,2,2,3,3,3,4,5,5,6,8,9], color: "#6366f1" },
          { label: "Avg Duration", value: "2:31", delta: "+12%", up: true, spark: [3,3,3,3,3,4,4,4,4,5,5,5,6,6,7,8], color: "#14b8a6" },
          { label: "Success Rate", value: "94%", delta: "+3pp", up: true, spark: [7,7,7,7,8,8,8,8,8,8,9,9,9,9,9,9], color: "#10b981" },
          { label: "Active Agents", value: "3", delta: "of 4", up: true, spark: [2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3], color: "#6366f1" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
            <p className="text-[8px] text-white/30 mb-0.5 truncate">{s.label}</p>
            <p className="text-[13px] font-bold text-white/90 mb-0.5">{s.value}</p>
            <p className={`text-[7px] mb-1.5 ${s.up ? "text-emerald-400" : "text-red-400"}`}>{s.delta}</p>
            {/* SVG sparkline */}
            <svg viewBox="0 0 100 20" className="w-full h-3" preserveAspectRatio="none">
              <path
                fill="none"
                stroke={s.color}
                strokeWidth="1.5"
                d={(() => {
                  const coords = s.spark.map((v, i) => ({ x: (i / (s.spark.length - 1)) * 100, y: 20 - (v / 10) * 18 }));
                  let d = `M${coords[0].x},${coords[0].y}`;
                  for (let j = 0; j < coords.length - 1; j++) {
                    const c = coords[j], n = coords[j + 1], cpx = (c.x + n.x) / 2;
                    d += ` C${cpx},${c.y} ${cpx},${n.y} ${n.x},${n.y}`;
                  }
                  return d;
                })()}
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Calls Over Time + Call Status */}
      <div className="grid grid-cols-[1fr_0.4fr] gap-2 mb-4">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] text-white/40 font-medium">Calls Over Time</p>
              <p className="text-[7px] text-white/15">Daily call volume for the last 30 days</p>
            </div>
          </div>
          <div className="h-[65px]">
            <SmoothAreaChart pts={[2,2,2,3,3,3,2,3,4,3,4,5,4,5,6,5,6,7,6,7,8,7,5,6,8,10,15,35,55,50]} color="#6366f1" id="analyticsArea" />
          </div>
        </div>
        {/* Donut chart placeholder */}
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col items-center justify-center">
          <p className="text-[9px] text-white/40 font-medium mb-2">Call Status</p>
          <div className="relative w-12 h-12 mb-2">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="83 100" strokeLinecap="round" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="5 100" strokeDashoffset="-83" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-[7px]">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Completed</span>
            <span className="text-white/20">847</span>
          </div>
        </div>
      </div>

      {/* Top Performing Agents — table style like actual platform */}
      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-white/40 font-medium">Top Performing Agents</p>
          <span className="text-[8px] text-white/20">3 agents</span>
        </div>
        {/* Table header */}
        <div className="grid grid-cols-[1fr_0.5fr_0.5fr_0.6fr] gap-2 px-1 py-1 text-[7px] text-white/20 uppercase tracking-wider border-b border-white/[0.06]">
          <span>Agent</span><span className="text-right">Calls</span><span className="text-right">Avg</span><span className="text-right">Success</span>
        </div>
        {[
          { name: "Support Agent", calls: 458, avg: "1:52", rate: "96%", dot: "bg-indigo-400" },
          { name: "Sales Agent", calls: 312, avg: "3:14", rate: "91%", dot: "bg-emerald-400" },
          { name: "Receptionist", calls: 77, avg: "0:42", rate: "88%", dot: "bg-amber-400" },
        ].map((a, i) => (
          <motion.div
            key={a.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="grid grid-cols-[1fr_0.5fr_0.5fr_0.6fr] gap-2 px-1 py-2 text-[9px] border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
              <span className="text-white/60">{a.name}</span>
            </div>
            <span className="text-white/40 text-right font-mono">{a.calls}</span>
            <span className="text-white/30 text-right font-mono">{a.avg}</span>
            <div className="flex justify-end">
              <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">{a.rate}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function ApiKeysPage() {
  const keys = [
    { name: "Gemini", provider: "LLM", status: "configured", icon: "G" },
    { name: "AssemblyAI", provider: "STT", status: "configured", icon: "A" },
    { name: "Resemble", provider: "TTS", status: "configured", icon: "R" },
    { name: "Twilio", provider: "Telephony", status: "configured", icon: "T" },
    { name: "ElevenLabs", provider: "TTS", status: "not set", icon: "E" },
  ];
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-white/60 font-semibold">API Keys</p>
        <div className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[8px]">All keys configured</div>
      </div>
      {keys.map((k, i) => (
        <motion.div
          key={k.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
        >
          <div className="w-7 h-7 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/40">
            {k.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/60 font-medium">{k.name}</p>
            <p className="text-[8px] text-white/25">{k.provider}</p>
          </div>
          <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
            k.status === "configured" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.04] text-white/20"
          }`}>{k.status}</span>
          <div className="text-[9px] text-white/15 font-mono">sk-•••••••</div>
        </motion.div>
      ))}
    </>
  );
}

// ─── Sidebar nav items ──────────────────────────────────────────────────────────

type Page = "dashboard" | "agents" | "logs" | "analytics" | "keys";

const NAV: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard", label: "Dashboard",
    icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  },
  {
    id: "agents", label: "Agents",
    icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>,
  },
  {
    id: "logs", label: "Call Logs",
    icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>,
  },
  {
    id: "analytics", label: "Analytics",
    icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  },
  {
    id: "keys", label: "API Keys",
    icon: <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
  },
];

const PAGES: Record<Page, React.ReactNode> = {
  dashboard: <DashboardPage />,
  agents: <AgentsPage />,
  logs: <CallLogsPage />,
  analytics: <AnalyticsPage />,
  keys: <ApiKeysPage />,
};

const URL_MAP: Record<Page, string> = {
  dashboard: "app.arkenos.ai/dashboard",
  agents: "app.arkenos.ai/dashboard/agents",
  logs: "app.arkenos.ai/dashboard/logs",
  analytics: "app.arkenos.ai/dashboard/analytics",
  keys: "app.arkenos.ai/dashboard/keys",
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export function HeroDashboardPreview({ className }: { className?: string }) {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className={className}>
      <div className="rounded-xl border border-white/[0.08] bg-[#0a0a0f] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-white/30 font-mono transition-all duration-300">
              {URL_MAP[page]}
            </div>
          </div>
          <div className="w-12" />
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-[130px] border-r border-white/[0.06] p-2.5 shrink-0 hidden sm:flex flex-col">
            <div className="flex items-center gap-2 mb-4 px-1.5">
              <svg viewBox="0 0 36 37" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-white/70">
                <path d="M17.0019 0.177314C16.168 0.457512 9.77492 4.28688 9.10318 4.91733C8.73257 5.22088 8.68624 5.78127 8.68624 9.96089C8.68624 12.5527 8.59359 14.771 8.50093 14.8877C8.40828 15.0278 6.71736 16.1019 4.72532 17.2927C2.73327 18.4836 0.857042 19.7211 0.555919 20.048C0 20.6318 0 20.6785 0 25.8855V31.1158L0.694899 31.8163C1.66776 32.797 8.17665 36.7198 9.10318 36.8833C9.75175 37 10.3772 36.6965 13.759 34.6417C15.9132 33.3574 17.8357 32.2833 18.0211 32.2833C18.2064 32.2833 20.1058 33.3574 22.2368 34.6417C24.3446 35.9493 26.3367 37 26.6378 37C27.3327 37 34.467 32.6569 35.2082 31.7696C35.9495 30.8823 36.0653 29.855 35.9726 24.9048C35.9031 21.1688 35.8568 20.6084 35.463 20.1881C35.2314 19.9079 33.4247 18.7404 31.4558 17.5496C29.4637 16.3587 27.7033 15.238 27.5412 15.0512C27.2864 14.8177 27.2169 13.7202 27.2169 10.0076C27.2169 5.78127 27.1706 5.22088 26.8231 4.91733C25.9892 4.19348 19.3414 0.317413 18.577 0.107264C18.0442 -0.0561846 17.5346 -0.0328347 17.0019 0.177314ZM25.6881 7.43911C25.7576 7.64926 25.8271 9.51725 25.8271 11.5954C25.8271 15.238 25.8039 15.4014 25.3175 15.8684C24.3678 16.7323 19.295 19.6978 18.9244 19.6277C18.577 19.5577 18.5306 19.0673 18.4843 15.4715C18.438 13.2299 18.4843 11.2685 18.6001 11.105C18.8318 10.7314 24.8774 7.06551 25.248 7.06551C25.4102 7.06551 25.6186 7.22896 25.6881 7.43911ZM17.025 22.6866C17.303 23.2469 17.3262 29.7149 17.0482 30.462C16.9092 30.8356 15.7742 31.6762 13.6664 32.9371C11.9291 33.9879 10.4003 34.8518 10.3077 34.8518C9.77492 34.8518 9.61277 33.7077 9.61277 30.3453C9.61277 27.2398 9.6591 26.656 10.0297 26.2357C10.5393 25.6053 15.8437 22.2896 16.3765 22.2663C16.6081 22.2429 16.8861 22.4531 17.025 22.6866ZM34.328 26.4459C34.3744 28.6875 34.328 30.6488 34.2122 30.7889C34.0732 31.0224 29.5101 33.9178 28.1897 34.595C27.1242 35.1787 26.9853 34.7117 26.9853 30.4153C26.9853 26.7728 27.0084 26.4926 27.4717 26.0723C28.3982 25.2083 33.3552 22.2663 33.8184 22.313C34.2585 22.3597 34.2817 22.5465 34.328 26.4459Z" fill="currentColor"/>
              </svg>
              <span className="text-[10px] text-white/70 font-semibold">arkenos</span>
            </div>

            <div className="space-y-0.5 flex-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] w-full text-left transition-all duration-200 cursor-pointer ${
                    page === item.id
                      ? "bg-white/[0.08] text-white/90"
                      : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            {/* User */}
            <div className="border-t border-white/[0.06] pt-2.5 mt-2">
              <div className="flex items-center gap-2 px-1.5">
                <div className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center text-[8px] text-white/40 font-bold">D</div>
                <span className="text-[9px] text-white/30 truncate">demo@arkenos.ai</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 h-[420px] sm:h-[560px] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {PAGES[page]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
