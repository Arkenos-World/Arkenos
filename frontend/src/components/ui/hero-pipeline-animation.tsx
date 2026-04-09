"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Play, BrainCircuit, Mic2, Settings2, Github, Slack, FileText, User, Webhook, CheckCircle2, Database, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Orb } from "@/components/ui/orb";
import { BarVisualizer } from "@/components/ui/bar-visualizer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { id: "voice", label: "Nenyax Voice", color: "from-[#FF9D66] to-[#FF5E62]" },
  { id: "functions", label: "Function Calling", color: "from-[#00D2ff] to-[#3a7bd5]" },
  { id: "memory", label: "Memory Nodes", color: "from-[#A8BFFF] to-[#884D80]" },
];

const VOICE_TEXT = "I’d like to reschedule my flight to Austin for tomorrow afternoon, ideally around 3 PM.";
const VOICE_WORDS = VOICE_TEXT.split(" ");

export function HeroPipelineAnimation() {
  const [activeTab, setActiveTab] = useState("voice");
  const [mounted, setMounted] = useState(false);

  // Animation Sequence States
  const [funcStep, setFuncStep] = useState(0); 
  const [memStep, setMemStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sequence effects for functional storytelling
  useEffect(() => {
    if (activeTab === "functions") {
      setFuncStep(0);
      const t1 = setTimeout(() => setFuncStep(1), 1000); // 1s: Start executing
      const t2 = setTimeout(() => setFuncStep(2), 3500); // 3.5s: Success
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    if (activeTab === "memory") {
      setMemStep(0);
      const t1 = setTimeout(() => setMemStep(1), 1500); // 1.5s: highlight & extract
      const t2 = setTimeout(() => setMemStep(2), 3500); // 3.5s: saved to DB
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [activeTab]);

  if (!mounted) return <div className="w-full min-h-[600px]" />;

  return (
    <div className="w-full min-h-[600px] p-4 md:p-8 lg:p-12 flex flex-col relative bg-transparent">

      {/* Top Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-black/5 shadow-sm rounded-full p-1.5 h-auto">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-full px-5 py-2.5 text-[14px] data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 text-zinc-500 gap-2.5 border-none shadow-none data-[state=active]:shadow-sm transition-all"
              >
                <div className={cn("w-2.5 h-2.5 rounded-full bg-gradient-to-br opacity-80", tab.color)} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col items-end hidden md:flex text-right">
          <span className="text-[14px] font-medium text-zinc-900">Infrastructure Control</span>
          <span className="text-[12px] text-zinc-400">Total pipeline sovereignty</span>
        </div>
      </div>

      {/* Main Interactive Card - Full Width */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-black/5 flex flex-col relative flex-1 min-h-[380px] overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "voice" && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="p-8 md:p-12 lg:p-16 h-full flex flex-col justify-between flex-1"
            >
              <div className="space-y-6 max-w-3xl">
                <div className="flex items-center gap-2 text-zinc-400 text-[12px] font-mono uppercase tracking-wider">
                  <Mic2 className="w-4 h-4" />
                  Live Audio Stream
                </div>
                
                {/* Streaming ASR Effect */}
                <p className="text-2xl md:text-3xl lg:text-4xl font-normal text-zinc-900 leading-[1.3] flex flex-wrap gap-x-2.5 gap-y-1">
                  {VOICE_WORDS.map((word, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, filter: "blur(4px)", y: 5 }}
                      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-black/5 pt-8 mt-12">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-black/5 shadow-inner shrink-0">
                    <Orb
                      colors={["#FF9D66", "#FF5E62"]}
                      agentState="talking"
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="text-[15px] font-medium text-zinc-900">Nova-1-Turbo</div>
                    <BarVisualizer
                      state="speaking"
                      barCount={14}
                      demo={true}
                      minHeight={15}
                      maxHeight={90}
                      className="h-6 w-28 bg-transparent rounded-none p-0"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[13px] text-zinc-400 font-mono uppercase tracking-wider">420ms</div>
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer shrink-0">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "functions" && (
            <motion.div 
              key="functions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="p-8 md:p-12 lg:p-16 h-full flex flex-col flex-1"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-zinc-400 text-[12px] font-mono uppercase tracking-wider">
                  <Webhook className="w-4 h-4" />
                  Real-time Execution
                </div>
                
                {/* Dynamic Status Pill */}
                {funcStep === 0 && (
                  <div className="px-3 py-1.5 rounded-full bg-zinc-50 border border-black/5 text-zinc-500 text-[11px] font-mono font-medium flex items-center gap-2 shadow-sm">
                    Awaiting trigger...
                  </div>
                )}
                {funcStep === 1 && (
                  <div className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-mono font-medium flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Executing tool...
                  </div>
                )}
                {funcStep === 2 && (
                  <div className="px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100 text-emerald-600 text-[11px] font-mono font-medium flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    200 OK
                  </div>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row gap-12 h-full">
                {/* Left: Tool trigger */}
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-8 border-b md:border-b-0 md:border-r border-black/5 pb-8 md:pb-0 md:pr-12">
                  <p className="text-xl md:text-2xl lg:text-3xl font-normal text-zinc-900 leading-[1.3]">
                    &ldquo;Can you alert the engineering team? The payment gateway is down.&rdquo;
                  </p>
                  
                  <div className="flex flex-col gap-3 pt-2">
                    {/* Active Target Tool */}
                    <div className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition-all duration-500",
                      funcStep === 0 ? "bg-white border-black/5" : 
                      funcStep === 1 ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/20" :
                      "bg-white border-emerald-200 ring-1 ring-emerald-500/20"
                    )}>
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-500",
                        funcStep > 0 ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-zinc-50 text-zinc-600 border-zinc-200"
                      )}>
                        <Slack className="w-4 h-4"/>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-zinc-900">slack.send_message</span>
                        <span className="text-[13px] text-zinc-500">MCP Tool</span>
                      </div>
                      {funcStep === 1 && (
                        <div className="ml-auto text-blue-500">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                      {funcStep === 2 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto text-emerald-500">
                          <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Inactive Secondary Tool */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50/50 border border-transparent opacity-50 grayscale">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 border border-zinc-200">
                        <Github className="w-4 h-4"/>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-zinc-900">github.create_issue</span>
                        <span className="text-[13px] text-zinc-500">MCP Tool</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Dynamic JSON Payload */}
                <div className="flex-1 flex flex-col relative min-h-[220px] bg-[#0A0A0A] rounded-2xl p-6 md:p-8 shadow-sm overflow-hidden border border-black/10">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <span className="text-[12px] font-mono text-zinc-400">Request Payload</span>
                    {funcStep === 2 && (
                      <motion.span initial={{opacity: 0}} animate={{opacity: 1}} className="text-[12px] font-mono text-emerald-400">
                        22ms
                      </motion.span>
                    )}
                  </div>
                  <pre className="text-[13px] md:text-[14px] font-mono text-zinc-300 leading-loose overflow-x-auto">
                    {funcStep === 0 ? (
                      <span className="text-zinc-600 animate-pulse">Awaiting tool trigger...</span>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
<span className="text-pink-400">{"{"}</span>
{"\n  "}<span className="text-blue-300">"channel"</span>: <span className="text-emerald-300">"#engineering-alerts"</span>,
{"\n  "}<span className="text-blue-300">"text"</span>: <span className="text-emerald-300">"🚨 Payment Gateway is down! User reported failures."</span>,
{"\n  "}<span className="text-blue-300">"blocks"</span>: <span className="text-zinc-500">[</span>
{"\n    "}<span className="text-pink-400">{"{"}</span>
{"\n      "}<span className="text-blue-300">"type"</span>: <span className="text-emerald-300">"section"</span>,
{"\n      "}<span className="text-blue-300">"text"</span>: <span className="text-emerald-300">"Priority: HIGH"</span>
{"\n    "}<span className="text-pink-400">{"}"}</span>
{"\n  "}<span className="text-zinc-500">]</span>
{"\n"}<span className="text-pink-400">{"}"}</span>
                      </motion.div>
                    )}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "memory" && (
            <motion.div 
              key="memory"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="p-8 md:p-12 lg:p-16 h-full flex flex-col flex-1"
            >
              <div className="flex items-center gap-2 text-zinc-400 text-[12px] font-mono uppercase tracking-wider mb-8">
                <Database className="w-4 h-4" />
                Cross-Session Memory
              </div>

              <div className="flex flex-col md:flex-row gap-12 h-full">
                {/* Left: Current transcript extracting data */}
                <div className="w-full md:w-1/2 flex flex-col space-y-8 border-b md:border-b-0 md:border-r border-black/5 pb-8 md:pb-0 md:pr-12">
                  <p className="text-xl md:text-2xl lg:text-3xl font-normal text-zinc-900 leading-[1.3]">
                    &ldquo;Actually, send the invoice to my personal email,{" "}
                    <span className={cn(
                      "px-1.5 rounded-md transition-colors duration-500",
                      memStep > 0 ? "bg-amber-100 text-amber-900" : "bg-transparent text-zinc-900"
                    )}>
                      alex.chen@example.com
                    </span>
                    .&rdquo;
                  </p>
                  
                  {/* Extraction Module */}
                  <div className={cn(
                    "mt-auto flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden",
                    memStep === 1 ? "bg-blue-50/50 border-blue-200 shadow-sm" : "bg-stone-50 border-black/5"
                  )}>
                    {memStep === 1 && (
                      <motion.div 
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent skew-x-12"
                      />
                    )}
                    <div className="w-12 h-12 rounded-full bg-white border border-black/5 flex items-center justify-center shrink-0 shadow-sm relative z-10">
                      <BrainCircuit className={cn("w-5 h-5 transition-colors", memStep === 1 ? "text-blue-500" : "text-zinc-600")} />
                    </div>
                    <div className="relative z-10">
                      <div className="text-[14px] font-medium text-zinc-900">Entity Extraction</div>
                      <div className="text-[13px] text-zinc-500 transition-colors">
                        {memStep === 0 && "Listening to audio stream..."}
                        {memStep === 1 && <span className="text-blue-600">Extracting context...</span>}
                        {memStep === 2 && "Knowledge graph updated."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Knowledge Graph / KV Store */}
                <div className="flex-1 flex flex-col gap-4 relative min-h-[220px]">
                  <div className="text-[13px] font-mono text-zinc-500 mb-2">Persistent Profile (user_id: 882)</div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-black/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-zinc-400" />
                        <span className="text-[14px] font-medium text-zinc-700">Name</span>
                      </div>
                      <span className="text-[14px] font-mono text-zinc-900">Alex Chen</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-black/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Settings2 className="w-4 h-4 text-zinc-400" />
                        <span className="text-[14px] font-medium text-zinc-700">Language</span>
                      </div>
                      <span className="text-[14px] font-mono text-zinc-900">English (US)</span>
                    </div>

                    <AnimatePresence>
                      {memStep === 2 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, scale: 0.95 }}
                          animate={{ opacity: 1, height: "auto", scale: 1 }}
                          className="flex items-center justify-between p-4 bg-white rounded-xl border border-emerald-200 shadow-sm ring-1 ring-emerald-500/10 relative overflow-hidden"
                        >
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="absolute inset-0 bg-emerald-50/50" 
                          />
                          <div className="flex items-center gap-3 relative z-10">
                            <FileText className="w-4 h-4 text-emerald-500" />
                            <span className="text-[14px] font-medium text-zinc-900">Billing Email</span>
                          </div>
                          <span className="text-[14px] font-mono text-emerald-600 font-medium relative z-10">
                            alex.chen@example.com
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Row */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
        {["Infrastructure", "Monitoring", "Security"].map((label) => (
          <span key={label} className="text-[14px] font-medium text-zinc-400 hover:text-zinc-900 cursor-pointer transition-colors">
            {label}
          </span>
        ))}
        <div className="h-5 w-px bg-zinc-200 mx-2" />
        <button className="rounded-full bg-zinc-900 text-white px-7 py-2.5 text-[14px] font-medium hover:bg-zinc-800 transition-colors shadow-sm">
          View Documentation
        </button>
      </div>
    </div>
  );
}
