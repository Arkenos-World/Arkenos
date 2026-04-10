"use client";

import { motion } from "framer-motion";
import { Blocks } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShimmeringText } from "@/components/ui/shimmering-text";

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
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
  },
};

export function ComposablePipelineSection() {
  return (
    <section className="bg-[#FAFAFA] py-24 md:py-32 overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Editorial Header Grid */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start mb-16 md:mb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-black/5 text-zinc-600 text-[12px] font-semibold uppercase tracking-widest shadow-sm mb-8">
              <Blocks className="w-3.5 h-3.5 text-zinc-400" />
              Composable Infrastructure
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-[4rem] font-medium tracking-tight text-zinc-900 leading-[1.05]">
              <ShimmeringText 
                text="Zero vendor lock-in." 
                color="#18181b" 
                shimmerColor="#a1a1aa"
                duration={4}
                delay={0}
                repeatDelay={2}
              /><br/>
              Swap stack instantly.
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:pt-24"
          >
            <p className="text-[17px] md:text-lg text-zinc-500 leading-relaxed max-w-xl">
              Connect directly to our open-source orchestration layer. Bring your own LLMs, plug in your preferred STT/TTS providers, or deploy entirely air-gapped on your own infrastructure.
            </p>
          </motion.div>
        </div>

        {/* Large Minimalist Canvas */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-[#FAFAFA] rounded-[2.5rem] md:rounded-[3rem] border border-black/5 p-8 py-24 md:p-24 relative overflow-hidden flex flex-col justify-center min-h-[500px] shadow-[inset_0_4px_20px_rgb(0,0,0,0.02)]"
          >
            <div className="flex flex-col md:flex-row items-center justify-between relative z-10 w-full max-w-5xl mx-auto gap-16 md:gap-8 min-h-[300px]">
              
              {/* The Connecting Wire with Flowing Packets */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-black/[0.06] -translate-y-1/2 border-dashed hidden md:block z-0">
                <motion.div 
                  initial={{ left: "-10%" }}
                  animate={{ left: "110%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/2 -translate-y-1/2 w-32 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                />
                <motion.div 
                  initial={{ left: "-10%" }}
                  animate={{ left: "110%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
                  className="absolute top-1/2 -translate-y-1/2 w-32 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                />
              </div>
              
              {/* STT Column */}
              <div className="flex flex-col items-center w-full md:w-64">
                <h3 className="text-[12px] font-semibold text-zinc-400 uppercase tracking-widest mb-10 bg-[#FAFAFA] px-2">Speech to Text</h3>
                <div className="relative flex flex-col gap-4 w-full">
                  {/* Glass Pane */}
                  <div className="absolute -inset-6 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-0 hidden md:block" />
                  
                  <InactivePill delay={0.1}>Deepgram</InactivePill>
                  <ActivePill delay={0.2}>AssemblyAI</ActivePill>
                  <InactivePill delay={0.3}>Custom</InactivePill>
                </div>
              </div>

              {/* LLM Column */}
              <div className="flex flex-col items-center w-full md:w-64">
                <h3 className="text-[12px] font-semibold text-zinc-400 uppercase tracking-widest mb-10 bg-[#FAFAFA] px-2">Intelligence</h3>
                <div className="relative flex flex-col gap-4 w-full">
                  {/* Glass Pane */}
                  <div className="absolute -inset-8 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-0 hidden md:block" />
                  
                  <BlackPill delay={0.4}>Google Gemini</BlackPill>
                  <InactivePill delay={0.5}>gpt-4o-mini</InactivePill>
                  <InactivePill delay={0.6}>claude-3-haiku</InactivePill>
                </div>
              </div>

              {/* TTS Column */}
              <div className="flex flex-col items-center w-full md:w-64">
                <h3 className="text-[12px] font-semibold text-zinc-400 uppercase tracking-widest mb-10 bg-[#FAFAFA] px-2">Text to Speech</h3>
                <div className="relative flex flex-col gap-4 w-full">
                  {/* Glass Pane */}
                  <div className="absolute -inset-6 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] z-0 hidden md:block" />
                  
                  <InactivePill delay={0.7}>ElevenLabs</InactivePill>
                  <InactivePill delay={0.8}>PlayHT</InactivePill>
                  <ActivePill delay={0.9}>Resemble AI</ActivePill>
                </div>
              </div>

            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

// --- Subcomponents for Pills ---

function ActivePill({ children, delay }: { children: React.ReactNode, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative z-10 px-6 py-3.5 rounded-2xl bg-white border border-black/10 shadow-[0_4px_20px_rgb(0,0,0,0.06)] text-[14px] font-semibold tracking-tight text-zinc-900 w-full text-center flex items-center justify-center gap-2.5 overflow-hidden group"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative z-10" />
      <span className="relative z-10">{children}</span>
    </motion.div>
  );
}

function InactivePill({ children, delay }: { children: React.ReactNode, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative z-10 px-6 py-3 rounded-2xl bg-white/50 border border-black/5 shadow-sm text-[13px] font-medium text-zinc-500 w-full text-center opacity-70 hover:opacity-100 hover:bg-white hover:shadow-md transition-all cursor-default"
    >
      {children}
    </motion.div>
  );
}

function BlackPill({ children, delay }: { children: React.ReactNode, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="relative z-10 px-6 py-4 rounded-2xl bg-zinc-900 text-white shadow-[0_8px_30px_rgb(0,0,0,0.15)] text-[14px] font-semibold tracking-tight w-full text-center flex items-center justify-center gap-2.5 overflow-hidden group"
    >
      {/* Dark Shimmer Sweep (Monochrome) */}
      <motion.div 
        initial={{ left: "-100%" }}
        animate={{ left: "200%" }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 }}
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 opacity-50 group-hover:opacity-100 transition-opacity"
      />
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse relative z-10" />
      <span className="relative z-10">{children}</span>
    </motion.div>
  );
}
