"use client";

import { motion } from "framer-motion";
import { Shield, Blocks, Activity, Network, Terminal, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollingWaveform } from "@/components/ui/waveform";

export function BentoSection() {
  return (
    <section className="bg-white py-24 md:py-32 border-t border-black/5">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-zinc-900 leading-[1.1] mb-6">
            Engineered for production scale.
          </h2>
          <p className="text-lg text-zinc-500 leading-relaxed max-w-2xl">
            Everything you need to orchestrate voice AI at scale, packed into a single control plane.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* ROW 1 ---------------------------------------------------- */}

          {/* Large Main Feature (White) */}
          <div className="md:col-span-2 rounded-[2rem] bg-white border border-black/5 p-8 md:p-12 shadow-sm flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10 max-w-md">
              <div className="w-12 h-12 rounded-full bg-stone-50 border border-black/5 flex items-center justify-center text-zinc-900 mb-6 shadow-sm">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-medium text-zinc-900 mb-3">Composable AI Infrastructure</h3>
              <p className="text-[15px] text-zinc-500 leading-relaxed">
                Connect directly to our open-source orchestration layer. Bring your own LLMs, plug in your preferred STT/TTS providers, or deploy entirely air-gapped on your own infrastructure.
              </p>
            </div>
            
            <div className="mt-12 w-full flex-1 bg-stone-50/50 rounded-2xl border border-black/5 p-8 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
              {/* Connecting abstract wire */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-black/10 -translate-y-1/2 border-dashed" />
              
              <div className="flex items-center justify-between relative z-10 max-w-lg mx-auto w-full">
                
                {/* STT Stack */}
                <div className="flex flex-col gap-3 relative">
                  <div className="absolute -left-3 -right-3 -top-3 -bottom-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white z-0" />
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="relative z-10 px-4 py-2 rounded-full bg-white border border-black/5 shadow-sm text-[12px] font-medium text-zinc-500 text-center">Deepgram</motion.div>
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="relative z-10 px-4 py-2.5 rounded-full bg-white border border-zinc-200 shadow-sm text-[13px] font-medium text-zinc-900 text-center flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    AssemblyAI
                  </motion.div>
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="relative z-10 px-4 py-2 rounded-full bg-white border border-black/5 shadow-sm text-[12px] font-medium text-zinc-500 text-center opacity-60">Custom</motion.div>
                </div>

                {/* LLM Stack */}
                <div className="flex flex-col gap-3 relative">
                  <div className="absolute -left-4 -right-4 -top-4 -bottom-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white z-0" />
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="relative z-10 px-5 py-3 rounded-full bg-zinc-900 text-white shadow-md text-[14px] font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Nenyax computer
                  </motion.div>
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="relative z-10 px-5 py-2.5 rounded-full bg-white border border-black/5 shadow-sm text-[13px] font-medium text-zinc-500 text-center">gemini-3.0-flash</motion.div>
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="relative z-10 px-5 py-2.5 rounded-full bg-white border border-black/5 shadow-sm text-[13px] font-medium text-zinc-500 text-center opacity-60">gpt-5.4-mini</motion.div>
                </div>

                {/* TTS Stack */}
                <div className="flex flex-col gap-3 relative">
                  <div className="absolute -left-3 -right-3 -top-3 -bottom-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white z-0" />
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }} className="relative z-10 px-4 py-2 rounded-full bg-white border border-black/5 shadow-sm text-[12px] font-medium text-zinc-500 text-center">ElevenLabs</motion.div>
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="relative z-10 px-4 py-2 rounded-full bg-white border border-black/5 shadow-sm text-[12px] font-medium text-zinc-500 text-center opacity-60">PlayHT</motion.div>
                  <motion.div initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.8 }} className="relative z-10 px-4 py-2.5 rounded-full bg-white border border-zinc-200 shadow-sm text-[13px] font-medium text-zinc-900 text-center flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Resemble AI
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Tall Side Feature (Dark) */}
          <div className="md:col-span-1 rounded-[2rem] bg-stone-900 p-8 md:p-12 shadow-md flex flex-col relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white mb-6 backdrop-blur-md border border-white/5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">Enterprise Governance</h3>
              <p className="text-[15px] text-zinc-400 leading-relaxed mb-12">
                RBAC, SSO, and audit logs built-in. Keep your AI deployments compliant and secure by default.
              </p>
            </div>
            
            <div className="mt-auto w-full flex flex-col gap-4 relative z-10">
              {/* Elevated Compliance UI */}
              {[
                { label: "SOC2 Type II", active: true },
                { label: "HIPAA Compliant", active: true },
                { label: "Data Residency", active: false, text: "EU/US" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#1A1A1A] border border-white/5 shadow-inner">
                  <span className="text-[14px] font-medium text-zinc-300">{item.label}</span>
                  {item.active ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                      <span className="text-[12px] font-mono text-emerald-400">Verified</span>
                    </div>
                  ) : (
                    <span className="text-[12px] font-mono text-zinc-500">{item.text}</span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Ambient Background */}
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-zinc-800 rounded-full blur-[80px] pointer-events-none group-hover:bg-zinc-700 transition-colors duration-1000" />
          </div>


          {/* ROW 2 ---------------------------------------------------- */}

          {/* Small Feature (Dark) - Moved to left, changed to Dark mode */}
          <div className="md:col-span-1 rounded-[2rem] bg-stone-900 p-8 md:p-10 shadow-md flex flex-col relative overflow-hidden group transition-all duration-300">
            <div className="relative z-10 flex-1">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white mb-6 backdrop-blur-md border border-white/5 group-hover:scale-105 transition-transform duration-300">
                 <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-[17px] font-medium text-white mb-2">On-Platform Intelligence</h3>
              <p className="text-[14px] text-zinc-400 leading-relaxed mb-8">
                Let on-platform coding agents automatically modify agent behavior, tune prompts, and write webhook chains via natural language.
              </p>
            </div>

            {/* Dark Terminal UI */}
            <div className="relative z-10 mt-auto w-full bg-[#0A0A0A] rounded-xl border border-white/10 p-5 shadow-inner overflow-hidden font-mono text-[12px] leading-relaxed flex flex-col min-h-[160px]">
               <div className="flex items-center gap-1.5 mb-4 border-b border-white/10 pb-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
               </div>
               
               <div className="flex flex-col gap-1 overflow-hidden relative flex-1">
                 <motion.div initial={{ opacity: 0, y: 5 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-zinc-500">{"// Generating behavior..."}</motion.div>
                 <motion.div initial={{ opacity: 0, width: 0 }} whileInView={{ opacity: 1, width: "100%" }} viewport={{ once: true }} transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }} className="text-emerald-400 whitespace-nowrap overflow-hidden"><span className="text-blue-400">agent</span>.add_tool(</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.4 }} className="text-zinc-300 pl-4">name: <span className="text-amber-300">"refund_user"</span>,</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.8 }} className="text-zinc-300 pl-4">auth: <span className="text-blue-400">context</span>.stripe_key</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2.2 }} className="text-emerald-400 flex items-center gap-1">
                   )
                   <span className="w-1.5 h-3.5 bg-white/60 animate-[cursor-blink_1.2s_step-end_infinite]" />
                 </motion.div>
               </div>
            </div>

            {/* Ambient Background */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-stone-800 rounded-full blur-[60px] pointer-events-none group-hover:bg-stone-700 transition-colors duration-1000" />
          </div>

          {/* Wide Feature (White) - Moved to right */}
          <div className="md:col-span-2 rounded-[2rem] bg-white border border-black/5 p-8 md:p-10 shadow-sm flex flex-col md:flex-row items-center gap-8 group hover:border-black/10 transition-all duration-300 hover:shadow-md">
            <div className="flex-1">
              <div className="w-10 h-10 rounded-full bg-stone-50 border border-black/5 flex items-center justify-center text-zinc-900 mb-6 group-hover:scale-105 transition-transform duration-300">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-[17px] font-medium text-zinc-900 mb-2">High-Volume Ingestion</h3>
              <p className="text-[14px] text-zinc-500 leading-relaxed max-w-sm">
                Stream millions of audio packets and agent events per minute. Built on Rust and optimized for massive concurrency.
              </p>
            </div>
            
            <div className="w-full md:w-[320px] h-32 bg-stone-50 rounded-2xl border border-black/5 p-4 relative overflow-hidden flex items-center">
               <ScrollingWaveform 
                 speed={80} 
                 barCount={30} 
                 barWidth={4} 
                 barGap={3} 
                 barRadius={2}
                 height={64}
                 fadeEdges={true}
                 fadeWidth={40}
                 className="w-full text-zinc-400"
               />
               {/* Overlay gradient */}
               <div className="absolute inset-0 bg-gradient-to-t from-stone-50/50 to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
