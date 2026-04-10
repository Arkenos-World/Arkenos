"use client";

import { motion } from "framer-motion";
import { Shield, Activity, Network, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollingWaveform } from "@/components/ui/waveform";

export function BentoSection() {
  return (
    <section className="bg-[#FAFAFA] py-24 md:py-32 w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="max-w-3xl mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-zinc-900 leading-[1.1] tracking-tight mb-6">
            Engineered for production scale.
          </h2>
          <p className="text-[17px] md:text-lg text-zinc-500 leading-relaxed max-w-2xl">
            Everything you need to orchestrate voice AI at scale, packed into a single control plane.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          
          {/* ROW 1 ---------------------------------------------------- */}

          {/* Large Main Feature */}
          <div className="md:col-span-2 rounded-[2rem] bg-white border border-black/5 p-8 md:p-12 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10 max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-black/5 flex items-center justify-center text-zinc-900 mb-6 shadow-sm group-hover:scale-105 transition-transform duration-500">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-[22px] font-semibold tracking-tight text-zinc-900 mb-3">Composable AI Infrastructure</h3>
              <p className="text-[15px] text-zinc-500 leading-relaxed">
                Hot-swap STT, LLM, and TTS models on the fly without changing your core application logic. Future-proof your voice agents as new models drop.
              </p>
            </div>
            
            <div className="mt-12 w-full flex-1 bg-zinc-50/50 rounded-2xl border border-black/5 p-8 relative overflow-hidden flex items-center justify-center min-h-[360px]">
              {/* Abstract Pipeline UI Mock */}
              <div className="flex items-center gap-4 md:gap-8 relative z-10 w-full max-w-lg mx-auto">
                {/* Decorative connecting line */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/[0.08] -translate-y-1/2 border-dashed border-t" />
                
                {/* Column 1: STT */}
                <div className="relative flex flex-col gap-3 w-1/3 group/col">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">Listen (STT)</div>
                  {[
                    { name: 'Deepgram', active: true },
                    { name: 'AssemblyAI', active: false },
                  ].map((model, i) => (
                    <div key={i} className={cn(
                      "p-3 rounded-xl border text-[13px] font-medium transition-all duration-300 relative",
                      model.active 
                        ? "bg-white border-black/10 text-zinc-900 shadow-[0_2px_10px_rgb(0,0,0,0.04)] scale-105 z-10" 
                        : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600"
                    )}>
                      {model.name}
                      {model.active && (
                         <div className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Column 2: LLM */}
                <div className="relative flex flex-col gap-3 w-1/3 group/col">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">Think (LLM)</div>
                  {[
                    { name: 'GPT-4o', active: false },
                    { name: 'Gemini 1.5 Pro', active: true },
                    { name: 'Claude 3.5 Sonnet', active: false },
                  ].map((model, i) => (
                    <div key={i} className={cn(
                      "p-3 rounded-xl border text-[13px] font-medium transition-all duration-300 relative",
                      model.active 
                        ? "bg-white border-black/10 text-zinc-900 shadow-[0_2px_10px_rgb(0,0,0,0.04)] scale-105 z-10" 
                        : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600"
                    )}>
                      {model.name}
                      {model.active && (
                         <div className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Column 3: TTS */}
                <div className="relative flex flex-col gap-3 w-1/3 group/col">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">Speak (TTS)</div>
                  {[
                    { name: 'ElevenLabs', active: true },
                    { name: 'Cartesia', active: false },
                  ].map((model, i) => (
                    <div key={i} className={cn(
                      "p-3 rounded-xl border text-[13px] font-medium transition-all duration-300 relative",
                      model.active 
                        ? "bg-white border-black/10 text-zinc-900 shadow-[0_2px_10px_rgb(0,0,0,0.04)] scale-105 z-10" 
                        : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-600"
                    )}>
                      {model.name}
                      {model.active && (
                         <div className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Ambient Background */}
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-zinc-100 rounded-full blur-[80px] pointer-events-none group-hover:bg-zinc-200/50 transition-colors duration-1000" />
          </div>

          {/* Tall Side Feature */}
          <div className="md:col-span-1 rounded-[2rem] bg-white border border-black/5 p-8 md:p-12 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 mb-6 border border-black/5 shadow-sm group-hover:scale-105 transition-transform duration-500">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-[22px] font-semibold tracking-tight text-zinc-900 mb-3">Enterprise Governance</h3>
              <p className="text-[15px] text-zinc-500 leading-relaxed mb-12">
                RBAC, SSO, and audit logs built-in. Keep your AI deployments compliant and secure by default.
              </p>
            </div>
            
            <div className="mt-auto w-full flex flex-col gap-3.5 relative z-10">
              {/* Elevated Compliance UI */}
              {[
                { label: "SOC2 Type II", active: true },
                { label: "HIPAA Compliant", active: true },
                { label: "Data Residency", active: false, text: "EU/US" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[14px] font-medium text-zinc-900">{item.label}</span>
                  {item.active ? (
                    <div className="flex items-center gap-2 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-emerald-600">Verified</span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono font-medium text-zinc-400 bg-black/5 px-2.5 py-1 rounded-md">{item.text}</span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Ambient Background */}
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-zinc-100 rounded-full blur-[80px] pointer-events-none group-hover:bg-zinc-200/50 transition-colors duration-1000" />
          </div>


          {/* ROW 2 ---------------------------------------------------- */}

          {/* Small Feature */}
          <div className="md:col-span-1 rounded-[2rem] bg-white border border-black/5 p-8 md:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col relative overflow-hidden group transition-all duration-300">
            <div className="relative z-10 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 mb-6 border border-black/5 shadow-sm group-hover:scale-105 transition-transform duration-300">
                 <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-zinc-900 mb-2">On-Platform Intelligence</h3>
              <p className="text-[14px] text-zinc-500 leading-relaxed mb-8">
                Let on-platform coding agents automatically modify agent behavior, tune prompts, and write webhook chains via natural language.
              </p>
            </div>

            {/* Light Terminal UI */}
            <div className="relative z-10 mt-auto w-full bg-[#FAFAFA] rounded-xl border border-black/5 p-5 shadow-inner overflow-hidden font-mono text-[12px] leading-[1.6] flex flex-col min-h-[160px]">
               <div className="flex items-center gap-1.5 mb-4 border-b border-black/5 pb-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-black/10 shadow-sm" />
                 <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-black/10 shadow-sm" />
                 <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-black/10 shadow-sm" />
               </div>
               
               <div className="flex flex-col gap-1 overflow-hidden relative flex-1">
                 <motion.div initial={{ opacity: 0, y: 5 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-zinc-400">{"// Generating behavior..."}</motion.div>
                 <motion.div initial={{ opacity: 0, width: 0 }} whileInView={{ opacity: 1, width: "100%" }} viewport={{ once: true }} transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }} className="text-emerald-600 whitespace-nowrap overflow-hidden"><span className="text-blue-600">agent</span><span className="text-zinc-800">.add_tool(</span></motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.4 }} className="text-zinc-500 pl-4">name: <span className="text-emerald-600">"refund_user"</span>,</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.8 }} className="text-zinc-500 pl-4">auth: <span className="text-blue-600">context</span><span className="text-zinc-800">.stripe_key</span></motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2.2 }} className="text-zinc-800 flex items-center gap-1">
                   )
                   <span className="w-1.5 h-3.5 bg-zinc-400 animate-[cursor-blink_1.2s_step-end_infinite]" />
                 </motion.div>
               </div>
            </div>

            {/* Ambient Background */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-zinc-100 rounded-full blur-[60px] pointer-events-none group-hover:bg-zinc-200/50 transition-colors duration-1000" />
          </div>

          {/* Wide Feature */}
          <div className="md:col-span-2 rounded-[2rem] bg-white border border-black/5 p-8 md:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col md:flex-row items-center gap-8 group hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="flex-1">
              <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-black/5 flex items-center justify-center text-zinc-900 mb-6 group-hover:scale-105 transition-transform duration-300 shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-zinc-900 mb-2">High-Volume Ingestion</h3>
              <p className="text-[14px] text-zinc-500 leading-relaxed max-w-sm">
                Stream millions of audio packets and agent events per minute. Built on Rust and optimized for massive concurrency.
              </p>
            </div>
            
            <div className="w-full md:w-[320px] h-32 bg-zinc-50 rounded-2xl border border-black/5 p-4 relative overflow-hidden flex items-center shadow-inner">
               <ScrollingWaveform 
                 speed={80} 
                 barCount={30} 
                 barWidth={4} 
                 barGap={3} 
                 barRadius={2}
                 height={64}
                 fadeEdges={true}
                 fadeWidth={40}
                 className="w-full text-zinc-300"
               />
               {/* Overlay gradient */}
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/80 to-transparent pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
