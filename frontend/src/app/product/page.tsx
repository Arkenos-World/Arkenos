"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

// ─── Icons ──────────────────────────────────────────────────────────────────────

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

// ─── Animation Variants ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Agent File Tree ────────────────────────────────────────────────────────────

const AGENT_FILES = [
  { name: "restaurant-agent/", isDir: true, indent: 0 },
  { name: "config.json", indent: 1, snippet: "model, voice, language, tools" },
  { name: "stt.py", indent: 1, snippet: "Deepgram nova-2 — speech recognition" },
  { name: "llm.py", indent: 1, snippet: "Gemini 3 Flash — reasoning engine" },
  { name: "tts.py", indent: 1, snippet: "Resemble AI — voice synthesis" },
  { name: "tools/", isDir: true, indent: 1 },
  { name: "book_table.py", indent: 2, snippet: "async def book_table(date, guests, time)" },
  { name: "check_avail.py", indent: 2, snippet: "async def check_availability(date, time)" },
  { name: "send_sms.py", indent: 2, snippet: "async def send_sms(to, message)" },
  { name: "memory.py", indent: 1, snippet: "per-caller conversation history" },
  { name: "agent.py", indent: 1, snippet: "VoiceAgent(config, tools, memory)" },
];

// ─── Use Cases ──────────────────────────────────────────────────────────────────

const USE_CASES = [
  {
    icon: BuildingIcon,
    title: "Restaurant & Hospitality",
    caller: "I'd like to book a table for two tonight at 7pm.",
    actions: ["check_availability(tonight, 7pm, 2)", "book_table(tonight, 7pm, 2, 'Sarah')", "send_sms(+1xxx, 'Confirmed: Table for 2 at 7pm')"],
    result: "Table booked, SMS confirmation sent — caller never waited on hold.",
  },
  {
    icon: HeartIcon,
    title: "Healthcare & Clinics",
    caller: "I need to reschedule my appointment with Dr. Patel.",
    actions: ["get_patient_record(caller_id)", "get_doctor_availability('Dr. Patel', next_7_days)", "reschedule_appointment(apt_id, new_slot)"],
    result: "Appointment moved, EHR updated, reminder sent — no front desk bottleneck.",
  },
  {
    icon: PhoneIcon,
    title: "Sales & Lead Qualification",
    caller: "I saw your ad about the enterprise plan. What's included?",
    actions: ["get_pricing_tier('enterprise')", "qualify_lead(company_size, use_case)", "create_crm_record(lead_data)", "schedule_demo(rep_id, caller)"],
    result: "Lead qualified, CRM updated, demo booked with the right rep — 24/7.",
  },
  {
    icon: ShoppingBagIcon,
    title: "E-commerce & Support",
    caller: "Where's my order? I placed it three days ago.",
    actions: ["lookup_order(caller_phone)", "get_shipping_status(order_id)", "escalate_to_human(if_delayed > 5_days)"],
    result: "Order status provided instantly. Escalated only when necessary.",
  },
];

// ─── Technical Specs ────────────────────────────────────────────────────────────

const SPECS = [
  { category: "Speech-to-Text", items: ["Deepgram (nova-2)", "AssemblyAI", "Bring your own"] },
  { category: "Language Models", items: ["Google Gemini (3.0 Flash)", "Custom endpoints", "Swap anytime"] },
  { category: "Text-to-Speech", items: ["Resemble AI", "Custom voice cloning", "Bring your own"] },
  { category: "Telephony", items: ["Twilio (inbound + outbound)", "SIP trunking", "WebRTC browser calls"] },
  { category: "Infrastructure", items: ["LiveKit (real-time transport)", "Silero VAD", "Docker Compose deploy"] },
  { category: "Data", items: ["PostgreSQL", "Full call transcripts", "Per-caller memory"] },
];

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 pt-20 pb-16 lg:pt-28 lg:pb-24">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">Product</Badge>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                The full picture
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                How Arkenos works, what it costs, how it compares to Vapi and Retell, and what you can build with it.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                {["How it works", "Use cases", "Tech specs", "Pricing", "Comparison"].map((item) => (
                  <span key={item} className="px-3 py-1 border bg-card">{item}</span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── How It Works: Build From Chat ────────────────────────────────── */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">How It Works</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Describe it. We build it.
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Tell Arkenos what your agent should do in plain English. The platform generates the entire agent — config, pipeline, tools, memory — and deploys it.
              </motion.p>
            </motion.div>

            <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">
              {/* Left: The prompt + steps */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="border bg-card p-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Your prompt</p>
                  <p className="text-sm leading-relaxed">
                    &quot;Create a restaurant receptionist that books tables, checks availability, and sends SMS confirmations. Use a warm, professional voice.&quot;
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { step: "1", title: "Describe", desc: "Tell the platform what your agent should do, what tools it needs, and how it should sound." },
                    { step: "2", title: "Build", desc: "Arkenos generates the full agent — config, STT, LLM, TTS, function definitions, and memory layer." },
                    { step: "3", title: "Go Live", desc: "Deploy with one click. Assign a phone number. Your agent starts taking real calls." },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-start gap-4"
                    >
                      <div className="h-8 w-8 border bg-card flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right: The file tree */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="border bg-card overflow-hidden"
              >
                <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
                  <FolderIcon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Generated Agent</span>
                  <span className="ml-auto text-xs text-muted-foreground">{AGENT_FILES.length} files</span>
                </div>
                <div className="p-4 font-mono text-xs space-y-0.5">
                  {AGENT_FILES.map((file, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-start gap-2"
                      style={{ paddingLeft: `${file.indent * 16}px` }}
                    >
                      {file.isDir ? (
                        <FolderIcon className="h-3.5 w-3.5 text-chart-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FileIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span className={file.isDir ? "text-chart-5 font-medium" : "text-foreground"}>
                        {file.name}
                      </span>
                      {file.snippet && (
                        <span className="text-muted-foreground ml-2 truncate hidden sm:inline">
                          — {file.snippet}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t bg-muted/30">
                  <div className="flex items-center gap-2 text-xs text-chart-2">
                    <CheckIcon className="h-3.5 w-3.5" />
                    <span>Agent built and deployed</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Use Cases ───────────────────────────────────────────────────── */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">Use Cases</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                What you can build
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Every agent gets a brain, tools, and memory. Here&apos;s what that looks like in practice.
              </motion.p>
            </motion.div>

            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
              {USE_CASES.map((uc, i) => (
                <motion.div
                  key={uc.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="border bg-card overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-3">
                    <uc.icon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{uc.title}</h3>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Caller says */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Caller</p>
                      <p className="text-sm">&quot;{uc.caller}&quot;</p>
                    </div>

                    {/* Agent executes */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Agent executes</p>
                      <div className="space-y-1 font-mono text-xs">
                        {uc.actions.map((action, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <CheckIcon className="h-3 w-3 text-chart-2 flex-shrink-0" />
                            <span className="text-muted-foreground">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Result */}
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">{uc.result}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Technical Specs ─────────────────────────────────────────────── */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">Technical Specs</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                What&apos;s under the hood
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Every component is swappable. Here&apos;s what ships today and what you can plug in.
              </motion.p>
            </motion.div>

            {/* Specs grid */}
            <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SPECS.map((spec, i) => (
                <motion.div
                  key={spec.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="border bg-card p-6"
                >
                  <h3 className="font-semibold mb-3">{spec.category}</h3>
                  <ul className="space-y-2">
                    {spec.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckIcon className="h-3.5 w-3.5 text-chart-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Key numbers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="max-w-4xl mx-auto mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { value: "<500ms", label: "End-to-end latency" },
                { value: "AGPL-3.0", label: "License" },
                { value: "3 min", label: "First agent deploy" },
                { value: "$0", label: "Platform fee" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="border bg-card p-6 text-center"
                >
                  <p className="text-2xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">Pricing</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                You pay $0 to Arkenos
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Arkenos is free and open source. Your only costs are the APIs you choose — STT, LLM, TTS, and telephony — paid directly to the providers at their rates.
              </motion.p>
            </motion.div>

            {/* Cost breakdown at different volumes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto overflow-x-auto"
            >
              <table className="w-full text-sm border">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold">Monthly Volume</th>
                    <th className="text-center px-4 py-3 font-semibold">1,000 min</th>
                    <th className="text-center px-4 py-3 font-semibold">10,000 min</th>
                    <th className="text-center px-4 py-3 font-semibold">100,000 min</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Arkenos platform fee", "$0", "$0", "$0"],
                    ["STT (Deepgram)", "~$10", "~$100", "~$1,000"],
                    ["LLM (Gemini Flash)", "~$27", "~$270", "~$2,700"],
                    ["TTS (Resemble AI)", "~$15", "~$150", "~$1,500"],
                    ["Telephony (Twilio US)", "~$15", "~$150", "~$1,500"],
                    ["Your total", "~$67", "~$670", "~$6,700"],
                  ].map((row, i) => (
                    <tr key={i} className={`border-b last:border-0 ${i === 5 ? "bg-primary/5 font-semibold" : ""}`}>
                      {row.map((cell, j) => (
                        <td key={j} className={`px-4 py-3 ${j === 0 ? "text-left" : "text-center"} ${j > 0 && i < 5 ? "text-muted-foreground" : ""}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto mt-6 border-l-4 border-primary bg-primary/5 px-6 py-4"
            >
              <p className="text-sm">
                <strong>For comparison:</strong> The same 10,000 minutes costs ~$1,443 on Vapi or ~$700 on Retell — because they add a $0.05–0.06/min platform fee on every minute. That&apos;s $500–600/month you pay just for orchestration that Arkenos gives you for free.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── vs Managed Platforms ─────────────────────────────────────────── */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-20 lg:py-28">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">Comparison</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Arkenos vs Vapi vs Retell
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Managed platforms charge $0.10–0.33/min and lock you in. Here&apos;s what you get with each.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto overflow-x-auto"
            >
              <table className="w-full text-sm border">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold"></th>
                    <th className="text-center px-4 py-3 font-semibold bg-primary/5">Arkenos</th>
                    <th className="text-center px-4 py-3 font-semibold">Vapi</th>
                    <th className="text-center px-4 py-3 font-semibold">Retell</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Platform fee", arkenos: "$0/min", vapi: "$0.05/min", retell: "$0.055/min", win: true },
                    { feature: "Real cost (10K min)", arkenos: "~$670", vapi: "~$1,443", retell: "~$700", win: true },
                    { feature: "Self-hosting", arkenos: true, vapi: false, retell: false, win: true },
                    { feature: "Source code", arkenos: true, vapi: false, retell: false, win: true },
                    { feature: "Choose STT provider", arkenos: true, vapi: true, retell: false, win: true },
                    { feature: "Choose LLM", arkenos: true, vapi: true, retell: true },
                    { feature: "Choose TTS", arkenos: true, vapi: true, retell: true },
                    { feature: "Function calling", arkenos: true, vapi: true, retell: true },
                    { feature: "Persistent memory", arkenos: true, vapi: false, retell: false, win: true },
                    { feature: "Dashboard", arkenos: true, vapi: true, retell: true },
                    { feature: "Visual flow builder", arkenos: "Roadmap", vapi: true, retell: "Basic" },
                    { feature: "Data residency", arkenos: "You control", vapi: "Cloud only", retell: "Cloud only", win: true },
                    { feature: "HIPAA", arkenos: "Self-host = you control", vapi: "+$1K/mo", retell: "Enterprise only", win: true },
                    { feature: "Vendor lock-in", arkenos: "None", vapi: "High", retell: "High", win: true },
                    { feature: "Latency", arkenos: "<500ms", vapi: "~465ms (web)", retell: "~600ms" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{row.feature}</td>
                      <td className={`px-4 py-3 text-center ${row.win ? "bg-primary/5" : ""}`}>
                        {typeof row.arkenos === "boolean" ? (
                          row.arkenos ? <CheckIcon className="h-4 w-4 text-chart-2 mx-auto" /> : <XMarkIcon className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className={row.win ? "font-medium text-foreground" : "text-muted-foreground"}>{row.arkenos}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {typeof row.vapi === "boolean" ? (
                          row.vapi ? <CheckIcon className="h-4 w-4 text-chart-2 mx-auto" /> : <XMarkIcon className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">{row.vapi}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {typeof row.retell === "boolean" ? (
                          row.retell ? <CheckIcon className="h-4 w-4 text-chart-2 mx-auto" /> : <XMarkIcon className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">{row.retell}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            <div className="max-w-4xl mx-auto mt-6 text-center">
              <Link href="/blog/voice-ai-landscape-2026" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
                Read the full comparison with latency benchmarks and detailed pricing breakdowns
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Ready to build?
              </h2>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground mb-8">
                Describe your agent. We build it. You own it. Free forever.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="lg" className="gap-2 h-12 px-8 text-base">
                      Start Building
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2 h-12 px-8 text-base">
                      Go to Dashboard
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
