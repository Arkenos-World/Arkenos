"use client";

import React, { useRef, forwardRef } from "react";
import { motion } from "framer-motion";
import { Blocks } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { AnimatedBeam } from "@/components/ui/animated-beam";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const sttRef = useRef<HTMLDivElement>(null);
  const llmRef = useRef<HTMLDivElement>(null);
  const ttsRef = useRef<HTMLDivElement>(null);

  return (
    <section className="bg-gradient-to-b from-[#FAFAFA] dark:from-[#080808] to-white dark:to-[#0C0C0C] py-24 md:py-32 overflow-hidden w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Editorial Header Grid */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start mb-16 md:mb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 text-[12px] font-semibold uppercase tracking-widest shadow-sm mb-8">
              <Blocks className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
              Composable Infrastructure
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-[4rem] font-medium tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.05]">
              <ShimmeringText
                text="Zero vendor lock-in."
                color="var(--foreground)"
                shimmerColor="var(--muted-foreground)"
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
            <p className="text-[17px] md:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
              Connect directly to our open-source orchestration layer. Bring your own LLMs, plug in your preferred STT/TTS providers, or deploy entirely air-gapped on your own infrastructure.
            </p>
          </motion.div>
        </div>

        {/* Large Minimalist Canvas */}
        <div className="relative">
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-[#FAFAFA] dark:bg-[#080808] rounded-[2.5rem] md:rounded-[3rem] border border-black/5 dark:border-white/[0.06] p-8 py-24 md:p-24 relative overflow-hidden flex flex-col justify-center min-h-[500px] shadow-[inset_0_4px_20px_rgb(0,0,0,0.02)] dark:shadow-[inset_0_4px_20px_rgb(0,0,0,0.15)]"
          >
            <div className="flex flex-col md:flex-row items-center justify-between relative z-10 w-full max-w-5xl mx-auto gap-16 md:gap-8 min-h-[300px]">
              
              {/* STT Column */}
              <div className="flex flex-col items-center w-full md:w-64 z-10">
                <h3 className="text-[12px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-10 bg-[#FAFAFA] dark:bg-[#080808] px-2 relative z-10">Speech to Text</h3>
                <div className="relative flex flex-col gap-4 w-full">
                  {/* Glass Pane */}
                  <div className="absolute -inset-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] z-0 hidden md:block" />

                  <InactivePill delay={0.1}>Deepgram</InactivePill>
                  <ActivePill ref={sttRef} delay={0.2}>AssemblyAI</ActivePill>
                  <InactivePill delay={0.3}>Custom</InactivePill>
                </div>
              </div>

              {/* LLM Column */}
              <div className="flex flex-col items-center w-full md:w-64 z-10">
                <h3 className="text-[12px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-10 bg-[#FAFAFA] dark:bg-[#080808] px-2 relative z-10">Intelligence</h3>
                <div className="relative flex flex-col gap-4 w-full">
                  {/* Glass Pane */}
                  <div className="absolute -inset-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] z-0 hidden md:block" />
                  
                  <BlackPill ref={llmRef} delay={0.4}>Google Gemini</BlackPill>
                  <InactivePill delay={0.5}>gpt-4o-mini</InactivePill>
                  <InactivePill delay={0.6}>claude-3-haiku</InactivePill>
                </div>
              </div>

              {/* TTS Column */}
              <div className="flex flex-col items-center w-full md:w-64 z-10">
                <h3 className="text-[12px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-10 bg-[#FAFAFA] dark:bg-[#080808] px-2 relative z-10">Text to Speech</h3>
                <div className="relative flex flex-col gap-4 w-full">
                  {/* Glass Pane */}
                  <div className="absolute -inset-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] z-0 hidden md:block" />

                  <InactivePill delay={0.7}>ElevenLabs</InactivePill>
                  <InactivePill delay={0.8}>PlayHT</InactivePill>
                  <ActivePill ref={ttsRef} delay={0.9}>Resemble AI</ActivePill>
                </div>
              </div>

            </div>

            {/* Animated Beams connecting the pills */}
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={sttRef}
              toRef={llmRef}
              curvature={0}
              pathColor="rgba(0,0,0,0.05)"
              pathWidth={2}
              gradientStartColor="#a7f3d0"
              gradientStopColor="#10b981"
              className="z-0 hidden md:block"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={llmRef}
              toRef={ttsRef}
              curvature={0}
              pathColor="rgba(0,0,0,0.05)"
              pathWidth={2}
              gradientStartColor="#a7f3d0"
              gradientStopColor="#10b981"
              className="z-0 hidden md:block"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}

// --- Subcomponents for Pills ---

const ActivePill = forwardRef<HTMLDivElement, { children: React.ReactNode, delay: number }>(({ children, delay }, ref) => {
  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative z-10 px-6 py-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-[0_4px_20px_rgb(0,0,0,0.06)] text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 w-full text-center flex items-center justify-center gap-2.5 overflow-hidden group"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative z-10" />
      <span className="relative z-10">{children}</span>
    </motion.div>
  );
});
ActivePill.displayName = "ActivePill";

function InactivePill({ children, delay }: { children: React.ReactNode, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="relative z-10 px-6 py-3 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/[0.06] shadow-sm text-[13px] font-medium text-zinc-500 dark:text-zinc-400 w-full text-center opacity-70 hover:opacity-100 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-md transition-all cursor-default"
    >
      {children}
    </motion.div>
  );
}

const BlackPill = forwardRef<HTMLDivElement, { children: React.ReactNode, delay: number }>(({ children, delay }, ref) => {
  return (
    <motion.div 
      ref={ref}
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
});
BlackPill.displayName = "BlackPill";
