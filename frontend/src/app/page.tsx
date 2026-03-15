"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";

import { HeroDashboardPreview } from "@/components/ui/hero-dashboard-preview";
import { CustomAgentDemo } from "@/components/ui/custom-agent-demo";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

// ─── Icons ──────────────────────────────────────────────────────────────────────

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}


// ─── Animation Variants ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};


// ─── Page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] border-b">
          {/* Subtle grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="container mx-auto px-4 relative flex flex-col justify-center min-h-[calc(100vh-4rem)]">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-10 items-center max-w-[1400px] mx-auto px-2">
              {/* Left: Content */}
              <motion.div initial="hidden" animate="visible" variants={stagger}>
                <motion.h1 variants={fadeUp}
                  className="text-4xl sm:text-5xl lg:text-[3.2rem] xl:text-6xl font-extrabold tracking-[-0.03em] leading-[1.1] mb-6"
                >
                  The open-source <span className="text-muted-foreground">voice AI platform</span>
                </motion.h1>

                <motion.p variants={fadeUp}
                  className="max-w-lg text-lg text-muted-foreground leading-relaxed mb-8"
                >
                  Build, deploy, and manage voice AI agents. Self-host or use our cloud. Zero platform fees. Your infrastructure, your rules.
                </motion.p>

                <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-8">
                  {session ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="gap-2 h-11 px-6">
                        Go to Dashboard <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button size="lg" className="gap-2 h-11 px-6" onClick={() => setAuthOpen(true)}>
                      Get Started Free <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="lg" className="gap-2 h-11 px-6" asChild>
                    <a href="https://github.com/Arkenos-World/Arkenos" target="_blank" rel="noopener noreferrer">
                      <GithubIcon className="h-4 w-4" /> Star on GitHub
                    </a>
                  </Button>
                </motion.div>

                <motion.div variants={fadeUp} className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  {["No credit card required", "Free & open source", "Deploy in 3 minutes"].map((t) => (
                    <span key={t} className="flex items-center gap-2">
                      <CheckIcon className="h-3.5 w-3.5 text-chart-2" />
                      {t}
                    </span>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right: Product Preview */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative lg:order-last"
              >
                <HeroDashboardPreview className="w-full" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Custom Agent IDE ─────────────────────────────────────────── */}
        <section className="border-b">
          <div className="container mx-auto px-4 py-24">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Your Way</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Build custom agents
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Code in Python or design visually — with an AI assistant that builds alongside you.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl mx-auto"
            >
              <CustomAgentDemo />
            </motion.div>
          </div>
        </section>

        {/* ── Cost Comparison ────────────────────────────────────────────── */}
        <section className="border-b">
          <div className="container mx-auto px-4 py-24">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Pricing</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Voice AI without the platform tax
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                You pay $0 to Arkenos. Your only costs are the AI providers you choose.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              {/* Comparison table */}
              <div className="rounded-xl border overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-4 border-b">
                  <div className="p-4 text-sm font-medium text-muted-foreground">10,000 min / month</div>
                  <div className="p-4 text-sm font-bold text-center bg-primary/[0.06] border-x border-primary/10">Arkenos</div>
                  <div className="p-4 text-sm font-medium text-center text-muted-foreground">Vapi</div>
                  <div className="p-4 text-sm font-medium text-center text-muted-foreground">Retell</div>
                </div>
                {/* Rows */}
                {[
                  { label: "Platform fee", arkenos: "$0/min", vapi: "$0.05/min", retell: "$0.055/min", total: false },
                  { label: "STT cost", arkenos: "~$0.01/min", vapi: "~$0.01/min", retell: "Bundled", total: false },
                  { label: "LLM cost", arkenos: "~$0.03/min", vapi: "~$0.03/min", retell: "~$0.03/min", total: false },
                  { label: "TTS cost", arkenos: "~$0.02/min", vapi: "~$0.04/min", retell: "$0.015/min", total: false },
                  { label: "Telephony", arkenos: "~$0.01/min", vapi: "~$0.01/min", retell: "$0.015/min", total: false },
                  { label: "Total per minute", arkenos: "~$0.07", vapi: "~$0.14", retell: "~$0.12", total: true },
                  { label: "Monthly (10K min)", arkenos: "~$700", vapi: "~$1,400", retell: "~$1,200", total: true },
                  { label: "HIPAA compliance", arkenos: "Self-host", vapi: "$1,000/mo add-on", retell: "Enterprise only", total: false },
                  { label: "Self-hostable", arkenos: "Yes", vapi: "No", retell: "No", total: false },
                  { label: "Open source", arkenos: "AGPL-3.0", vapi: "No", retell: "No", total: false },
                ].map((row) => (
                  <div key={row.label} className={`grid grid-cols-4 border-b last:border-0 ${row.total ? "bg-muted/30" : ""}`}>
                    <div className={`p-4 text-sm ${row.total ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{row.label}</div>
                    <div className={`p-4 text-sm text-center bg-primary/[0.04] border-x border-primary/10 font-bold ${row.total ? "text-lg text-foreground" : "text-foreground"}`}>{row.arkenos}</div>
                    <div className={`p-4 text-sm text-center ${row.total ? "font-medium text-muted-foreground" : "text-muted-foreground"}`}>{row.vapi}</div>
                    <div className={`p-4 text-sm text-center ${row.total ? "font-medium text-muted-foreground" : "text-muted-foreground"}`}>{row.retell}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/60 text-center mt-4">
                Based on Deepgram STT + Gemini Flash LLM + Resemble TTS + Twilio telephony. Vapi and Retell prices from their public pricing pages (March 2026). Excludes hidden add-ons like concurrency fees, knowledge base charges, and branded caller ID costs.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section className="border-b">
          <div className="container mx-auto px-4 py-24">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="text-center mb-20">
              <motion.p variants={fadeUp} className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Platform</motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Everything you need
              </motion.h2>
            </motion.div>

            <div className="max-w-5xl mx-auto space-y-24">

              {/* ── Feature 1: Natural Voice */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
                className="grid lg:grid-cols-2 gap-10 items-center"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Voice Pipeline
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">Conversations that feel human</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Sub-500ms end-to-end latency. Your agent knows when to speak, when to listen, and handles interruptions naturally. Callers don&apos;t notice they&apos;re talking to AI.
                  </p>
                  <div className="flex gap-6 text-sm">
                    <div><span className="text-2xl font-bold">&lt;500</span><span className="text-muted-foreground">ms latency</span></div>
                    <div><span className="text-2xl font-bold">VAD</span><span className="text-muted-foreground"> built-in</span></div>
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-6 h-32 flex items-center justify-center">
                  <div className="flex items-center gap-[2.5px] h-20 w-full">
                    {Array.from({ length: 64 }).map((_, i) => {
                      const t = i / 63;
                      const envelope = Math.exp(-Math.pow((t - 0.5) * 2.8, 2));
                      const wave = 0.6 + Math.sin(i * 0.5) * 0.2 + Math.sin(i * 1.2) * 0.15;
                      const scale = envelope * wave;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-full origin-center bg-primary/50"
                          style={{
                            height: "100%",
                            transform: `scaleY(${Math.max(0.02, scale).toFixed(4)})`,
                            animationName: "waveform-bar",
                            animationDuration: `${(0.6 + Math.sin(i * 0.7) * 0.3 + 0.3).toFixed(4)}s`,
                            animationTimingFunction: "ease-in-out",
                            animationIterationCount: "infinite",
                            animationDelay: `${(i * 0.025).toFixed(4)}s`,
                            "--wave-scale": Math.max(0.02, scale).toFixed(4),
                          } as React.CSSProperties}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* ── Feature 2: Any Provider */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
                className="grid lg:grid-cols-2 gap-10 items-center"
              >
                <div className="lg:order-last">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Composable
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">Swap any provider, anytime</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Every piece of the voice pipeline is modular. Switch your STT, LLM, or TTS provider without rewriting your agent. No lock-in, ever.
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                  <div className="space-y-3">
                    {[
                      { label: "Speech-to-Text", providers: ["AssemblyAI", "Deepgram", "ElevenLabs"], color: "bg-blue-500", active: 0 },
                      { label: "LLM", providers: ["Gemini", "GPT-4o", "Claude", "Llama"], color: "bg-violet-500", active: 0 },
                      { label: "Text-to-Speech", providers: ["Resemble AI", "ElevenLabs", "PlayHT"], color: "bg-amber-500", active: 0 },
                      { label: "Telephony", providers: ["Twilio", "Telnyx", "SIP"], color: "bg-rose-500", active: 0 },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${row.color} shrink-0`} />
                        <span className="text-xs font-medium w-24 shrink-0">{row.label}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {row.providers.map((p, i) => (
                            <span key={p} className={`text-[10px] px-2 py-0.5 rounded-full border ${i === row.active ? "bg-primary/10 border-primary/20 text-foreground" : "text-muted-foreground border-border/50"}`}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── Feature 3: Function Calling */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
                className="grid lg:grid-cols-2 gap-10 items-center"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Actions
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">Agents that do things</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Your agent doesn&apos;t just talk — it books appointments, checks order status, sends confirmations, and calls APIs. All mid-call, in real time.
                  </p>
                </div>
                <div className="rounded-xl border bg-[#0a0a0f] overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/[0.06] text-[10px] text-white/30 font-mono">Live call transcript</div>
                  <div className="p-4 space-y-3 font-mono text-[11px]">
                    <div className="flex gap-3">
                      <span className="text-white/30 w-12 shrink-0 text-right">Caller</span>
                      <span className="text-white/60">&quot;Can I book a table for tonight at 7?&quot;</span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="text-amber-400/60 w-12 shrink-0 text-right">fn()</span>
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[9px]">POST</span>
                        <span className="text-white/40 ml-2">check_availability(&quot;2026-03-15&quot;, &quot;19:00&quot;)</span>
                        <div className="text-emerald-400/50 mt-1">→ 3 slots available</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-emerald-400/60 w-12 shrink-0 text-right">Agent</span>
                      <span className="text-white/60">&quot;Done! You&apos;re booked for 7pm tonight, 2 guests. I&apos;ll send a confirmation text.&quot;</span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="text-amber-400/60 w-12 shrink-0 text-right">fn()</span>
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[9px]">POST</span>
                        <span className="text-white/40 ml-2">send_sms(&quot;+1555...&quot;, &quot;Confirmed...&quot;)</span>
                        <div className="text-emerald-400/50 mt-1">→ SMS sent</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Feature 4: Security + Open Source */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
                className="grid lg:grid-cols-2 gap-10 items-center"
              >
                <div className="lg:order-last">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs text-muted-foreground mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-chart-2" />
                    Trust
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">Open source, self-hostable, yours</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    AGPL-3.0 licensed. Self-host for full data control. GDPR and HIPAA ready. Every line of code is auditable. No vendor calls the shots.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Self-Hosted", desc: "Deploy on your own infrastructure", icon: "🏠" },
                    { label: "End-to-End Encrypted", desc: "Data never leaves your servers", icon: "🔒" },
                    { label: "AGPL-3.0", desc: "Fully auditable open source", icon: "📋" },
                    { label: "GDPR & HIPAA", desc: "Compliance ready out of the box", icon: "🛡️" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border bg-card p-4 hover:border-primary/20 transition-colors group">
                      <span className="text-lg mb-2 block">{item.icon}</span>
                      <p className="text-sm font-semibold mb-1">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-32">
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                Start building for free
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Deploy your first voice agent in minutes. No platform fees. No credit card. No vendor lock-in.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                {session ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2 h-12 px-8 text-base">
                      Go to Dashboard <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button size="lg" className="gap-2 h-12 px-8 text-base" onClick={() => setAuthOpen(true)}>
                    Get Started Free <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="lg" className="gap-2 h-12 px-8 text-base" asChild>
                  <a href="https://github.com/Arkenos-World/Arkenos" target="_blank" rel="noopener noreferrer">
                    <GithubIcon className="h-4 w-4" /> Star on GitHub
                  </a>
                </Button>
              </div>

              {/* Key differentiators */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                {[
                  { label: "$0/min platform fee", strong: true },
                  { label: "Open source (AGPL-3.0)", strong: false },
                  { label: "Self-hostable", strong: false },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-chart-2" />
                    {item.strong ? <span className="text-foreground font-medium">{item.label}</span> : item.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode="sign-up" />
    </div>
  );
}
