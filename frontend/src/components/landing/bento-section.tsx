"use client";

import { motion } from "framer-motion";
import { Shield, Activity, Network, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollingWaveform } from "@/components/ui/waveform";
import { BorderBeam } from "@/components/ui/border-beam";


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function BentoSection() {
  return (
    <section className="bg-[#FAFAFA] dark:bg-[#080808] py-24 md:py-32 w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          className="max-w-3xl mb-16 md:mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-medium text-zinc-900 dark:text-zinc-100 leading-[1.1] tracking-tight mb-6">
            Engineered for production scale.
          </motion.h2>
          <motion.p variants={itemVariants} className="text-[17px] md:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Everything you need to orchestrate voice AI at scale, packed into a single control plane.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >

          {/* ROW 1 ---------------------------------------------------- */}

          {/* Large Main Feature */}
          <motion.div variants={itemVariants} className="md:col-span-2 rounded-[2rem] bg-white dark:bg-[#0C0C0C] border border-black/5 dark:border-white/[0.06] p-8 md:p-12 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10 max-w-md">
              <div className="w-11 h-11 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">Composable AI Infrastructure</h3>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Hot-swap STT, LLM, and TTS models on the fly without changing your core application logic. Future-proof your voice agents as new models drop.
              </p>
            </div>
            
            <div className="mt-10 w-full flex-1 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl border border-black/5 dark:border-white/[0.06] p-6 md:p-10 relative overflow-hidden flex items-center justify-center min-h-[300px]">
              {/* Abstract Pipeline UI Mock */}
              <div className="flex items-center gap-3 md:gap-5 relative z-10 w-full max-w-xl mx-auto">

                {/* Column 1: STT */}
                <div className="relative flex flex-col gap-2 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-semibold mb-2 text-center">STT</div>
                  {[
                    { name: 'Deepgram', active: true },
                    { name: 'AssemblyAI', active: false },
                  ].map((model, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all duration-300",
                      model.active
                        ? "bg-white dark:bg-zinc-800 border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "bg-transparent border-black/[0.03] dark:border-white/[0.04] text-zinc-400 dark:text-zinc-500"
                    )}>
                      <span className="truncate">{model.name}</span>
                      {model.active && (
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className="text-zinc-300 dark:text-zinc-600 shrink-0 mt-6">
                  <svg width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M0 6h16m0 0l-4-4.5M16 6l-4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>

                {/* Column 2: LLM */}
                <div className="relative flex flex-col gap-2 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-semibold mb-2 text-center">LLM</div>
                  {[
                    { name: 'GPT-4o', active: false },
                    { name: 'Gemini Pro', active: true },
                    { name: 'Claude 3.5', active: false },
                  ].map((model, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all duration-300",
                      model.active
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-md"
                        : "bg-transparent border-black/[0.03] dark:border-white/[0.04] text-zinc-400 dark:text-zinc-500"
                    )}>
                      <span className="truncate">{model.name}</span>
                      {model.active && (
                         <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className="text-zinc-300 dark:text-zinc-600 shrink-0 mt-6">
                  <svg width="20" height="12" viewBox="0 0 20 12" fill="none"><path d="M0 6h16m0 0l-4-4.5M16 6l-4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>

                {/* Column 3: TTS */}
                <div className="relative flex flex-col gap-2 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-semibold mb-2 text-center">TTS</div>
                  {[
                    { name: 'ElevenLabs', active: true },
                    { name: 'Cartesia', active: false },
                  ].map((model, i) => (
                    <div key={i} className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-medium transition-all duration-300",
                      model.active
                        ? "bg-white dark:bg-zinc-800 border-black/10 dark:border-white/10 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "bg-transparent border-black/[0.03] dark:border-white/[0.04] text-zinc-400 dark:text-zinc-500"
                    )}>
                      <span className="truncate">{model.name}</span>
                      {model.active && (
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Ambient Background */}
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-zinc-100 dark:bg-zinc-800 rounded-full blur-[80px] pointer-events-none group-hover:bg-zinc-200/50 dark:group-hover:bg-zinc-700/30 transition-colors duration-1000" />
          </motion.div>

          {/* Tall Side Feature */}
          <motion.div variants={itemVariants} className="md:col-span-1 rounded-[2rem] bg-white dark:bg-[#0C0C0C] border border-black/5 dark:border-white/[0.06] p-8 md:p-12 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] flex flex-col relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 mb-6 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">Enterprise Governance</h3>
              <p className="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                RBAC, SSO, and audit logs built-in. Keep your AI deployments compliant and secure by default.
              </p>
            </div>

            {/* Governance feature grid */}
            <div className="mt-auto relative z-10 flex flex-col gap-3">
              {[
                { label: "Role-Based Access", detail: "RBAC" },
                { label: "Single Sign-On", detail: "SSO" },
                { label: "Audit Logging", detail: "Full trail" },
                { label: "Data Residency", detail: "You control" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-black/[0.03] dark:border-white/[0.04]">
                  <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-black/5 dark:border-white/[0.06]">{item.detail}</span>
                </div>
              ))}
            </div>

            {/* Ambient Background */}
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-zinc-100 dark:bg-zinc-800 rounded-full blur-[80px] pointer-events-none group-hover:bg-zinc-200/50 dark:group-hover:bg-zinc-700/30 transition-colors duration-1000" />
          </motion.div>


          {/* ROW 2 ---------------------------------------------------- */}

          {/* Small Feature */}
          <motion.div variants={itemVariants} className="md:col-span-1 rounded-[2rem] bg-white dark:bg-[#0C0C0C] border border-black/5 dark:border-white/[0.06] p-8 md:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] flex flex-col relative overflow-hidden group transition-all duration-300">
            <div className="relative z-10 flex-1">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 mb-6 group-hover:scale-110 transition-transform duration-300">
                 <Terminal className="w-4 h-4" />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">On-Platform Intelligence</h3>
              <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
                Let on-platform coding agents automatically modify agent behavior, tune prompts, and write webhook chains via natural language.
              </p>
            </div>

            {/* Light Terminal UI */}
            <div className="relative z-10 mt-auto w-full bg-[#FAFAFA] dark:bg-zinc-900 rounded-xl border border-black/5 dark:border-white/[0.06] p-5 shadow-inner overflow-hidden font-mono text-[12px] leading-[1.6] flex flex-col min-h-[160px]">
               <div className="flex items-center gap-1.5 mb-4 border-b border-black/5 dark:border-white/[0.06] pb-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-black/10 shadow-sm" />
                 <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-black/10 shadow-sm" />
                 <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-black/10 shadow-sm" />
               </div>
               
               <div className="flex flex-col gap-1 overflow-hidden relative flex-1">
                 <motion.div initial={{ opacity: 0, y: 5 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-zinc-400 dark:text-zinc-500">{"// Generating behavior..."}</motion.div>
                 <motion.div initial={{ opacity: 0, width: 0 }} whileInView={{ opacity: 1, width: "100%" }} viewport={{ once: true }} transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }} className="text-emerald-600 dark:text-emerald-400 whitespace-nowrap overflow-hidden"><span className="text-blue-600 dark:text-blue-400">agent</span><span className="text-zinc-800 dark:text-zinc-200">.add_tool(</span></motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.4 }} className="text-zinc-500 dark:text-zinc-400 pl-4">name: <span className="text-emerald-600 dark:text-emerald-400">"refund_user"</span>,</motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.8 }} className="text-zinc-500 dark:text-zinc-400 pl-4">auth: <span className="text-blue-600 dark:text-blue-400">context</span><span className="text-zinc-800 dark:text-zinc-200">.stripe_key</span></motion.div>
                 <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 2.2 }} className="text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                   )
                   <span className="w-1.5 h-3.5 bg-zinc-400 dark:bg-zinc-500 animate-[cursor-blink_1.2s_step-end_infinite]" />
                 </motion.div>
               </div>
            </div>

            {/* Ambient Background */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-zinc-100 dark:bg-zinc-800 rounded-full blur-[60px] pointer-events-none group-hover:bg-zinc-200/50 dark:group-hover:bg-zinc-700/30 transition-colors duration-1000" />
          </motion.div>

          {/* Wide Feature */}
          <motion.div variants={itemVariants} className="md:col-span-2 relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#0C0C0C] border border-black/5 dark:border-white/[0.06] p-8 md:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] flex flex-col md:flex-row items-center gap-8 group hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
            <BorderBeam size={250} duration={12} delay={9} colorFrom="#10b981" colorTo="#a7f3d0" />
            <div className="flex-1 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">High-Volume Ingestion</h3>
              <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                Stream millions of audio packets and agent events per minute. Built on Rust and optimized for massive concurrency.
              </p>
            </div>
            
            <div className="w-full md:w-[320px] h-32 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5 dark:border-white/[0.06] p-4 relative overflow-hidden flex items-center shadow-inner z-10">
               <ScrollingWaveform 
                 speed={80} 
                 barCount={30} 
                 barWidth={4} 
                 barGap={3} 
                 barRadius={2}
                 height={64}
                 fadeEdges={true}
                 fadeWidth={40}
                 className="w-full text-zinc-300 dark:text-zinc-600"
               />
               {/* Overlay gradient */}
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-50/80 dark:from-zinc-900/80 to-transparent pointer-events-none" />
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
