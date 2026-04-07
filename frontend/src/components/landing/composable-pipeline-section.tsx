"use client";

import { motion } from "framer-motion";
import { Blocks, Mic, BrainCircuit, Volume2, ArrowRight, Zap, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } 
  },
};

export function ComposablePipelineSection() {
  return (
    <section className="bg-white py-24 md:py-32 border-t border-black/5 overflow-hidden">
      <div className="container mx-auto px-6">
        
        {/* Editorial Header Grid */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start mb-16 md:mb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 border border-black/5 text-zinc-600 text-[13px] font-medium shadow-sm mb-8">
              <Blocks className="w-4 h-4 text-zinc-400" />
              Composable Infrastructure
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-[4rem] font-medium tracking-tight text-zinc-900 leading-[1.05]">
              Zero vendor lock-in.<br/>Swap stack instantly.
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:pt-24"
          >
            <p className="text-lg text-zinc-500 leading-relaxed max-w-xl">
              Swap any part of your stack (STT, LLM, TTS) without rewriting a single line of code. Connect directly to our orchestration layer and let us handle the low-latency transport.
            </p>
          </motion.div>
        </div>

        {/* Large Product Canvas */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-full bg-stone-50 rounded-[2.5rem] md:rounded-[3rem] border border-black/5 p-8 md:p-16 lg:p-24 relative overflow-hidden"
          >
            {/* Ambient Background Accents */}
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] -translate-y-1/2 translate-x-1/3 bg-white/60 rounded-full blur-[100px] pointer-events-none" />
            
            {/* The Pipeline Visualization */}
            <div className="relative z-10 max-w-5xl mx-auto">
              
              {/* Flow Indicators */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-200/50 -translate-y-1/2 hidden lg:block" />
              
              <div className="grid lg:grid-cols-3 gap-8 lg:gap-16 relative">
                
                {/* 1. INPUT: Speech-to-Text */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-sm">
                      <Mic className="w-4 h-4 text-zinc-400" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">01 / STT</span>
                  </div>

                  <div className="space-y-4">
                    <ProviderCard name="Deepgram" active={true} delay={0.1} />
                    <ProviderCard name="AssemblyAI" active={false} delay={0.2} />
                    <ProviderCard name="OpenAI Whisper" active={false} delay={0.3} />
                  </div>
                </div>

                {/* 2. CORE: Orchestration & Intelligence */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-900 flex items-center justify-center shadow-md">
                      <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-900 font-bold uppercase tracking-widest">02 / LLM</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-1 rounded-[1.5rem] bg-white border border-black/5 shadow-xl shadow-stone-200/50">
                      <div className="px-6 py-6 rounded-[1.25rem] bg-zinc-900 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[13px] font-medium text-zinc-400">Nenyax Core</span>
                            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                          </div>
                          <div className="text-lg font-medium mb-1">gemini-2.0-flash</div>
                          <div className="text-[12px] text-zinc-500 font-mono">LATENCY: 140ms</div>
                        </div>
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </div>
                    </div>
                    
                    <ProviderCard name="Claude 3.5 Sonnet" active={false} delay={0.4} />
                    <ProviderCard name="GPT-4o Mini" active={false} delay={0.5} />
                  </div>
                </div>

                {/* 3. OUTPUT: Text-to-Speech */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-sm">
                      <Volume2 className="w-4 h-4 text-zinc-400" />
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">03 / TTS</span>
                  </div>

                  <div className="space-y-4">
                    <ProviderCard name="ElevenLabs" active={true} delay={0.6} />
                    <ProviderCard name="Resemble AI" active={false} delay={0.7} />
                    <ProviderCard name="Cartesia" active={false} delay={0.8} />
                  </div>
                </div>

              </div>
              
              {/* Call to Action Badge inside canvas */}
              <div className="mt-16 md:mt-24 flex justify-center">
                <div className="px-6 py-3 rounded-full bg-white border border-black/5 shadow-sm flex items-center gap-4 hover:border-black/10 transition-colors cursor-pointer group">
                  <RefreshCw className="w-4 h-4 text-zinc-400 group-hover:rotate-180 transition-transform duration-700" />
                  <span className="text-[14px] font-medium text-zinc-900">Configure your stack in seconds</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function ProviderCard({ name, active, delay }: { name: string, active: boolean, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={cn(
        "px-6 py-4 rounded-2xl border transition-all duration-300 flex items-center justify-between",
        active 
          ? "bg-white border-zinc-200 shadow-sm" 
          : "bg-white/40 border-black/[0.03] opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:bg-white hover:border-zinc-200"
      )}
    >
      <span className={cn("text-[15px] font-medium", active ? "text-zinc-900" : "text-zinc-500")}>
        {name}
      </span>
      {active && (
        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
          <Check className="w-3 h-3 text-emerald-600" />
        </div>
      )}
    </motion.div>
  );
}
