"use client";

import { motion } from "framer-motion";
import { FileText, Check, Sparkles, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StaticWaveform } from "@/components/ui/waveform";
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

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.8 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.5, ease: "easeOut" as const }
  },
};

const pillVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.4, ease: "backOut" as const }
  },
};

export function PostCallIntelligenceSection() {
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
              <Sparkles className="w-4 h-4 text-zinc-400" />
              Post-Call Intelligence
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-[4rem] font-medium tracking-tight text-zinc-900 leading-[1.05]">
              Turn conversations<br/>into structured data.
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
              Every call is automatically processed the moment the user hangs up. Nenyax extracts actionable insights, generates accurate summaries, and analyzes caller sentiment without any extra pipeline configuration.
            </p>
          </motion.div>
        </div>

        {/* Large Product Canvas */}
        <div className="w-full bg-stone-50 rounded-[2.5rem] md:rounded-[3rem] border border-black/5 p-6 md:p-16 lg:p-24 relative overflow-hidden">
          
          {/* Focal Demo: Single Unified Document Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden relative z-10"
          >
            
            {/* Document Meta Header */}
            <div className="px-8 md:px-12 py-6 border-b border-black/5 flex flex-wrap gap-4 justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-50 border border-black/5 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-zinc-500" />
                </div>
                <div>
                  <div className="text-[15px] font-medium text-zinc-900">
                    <ShimmeringText 
                      text="Analysis_Report_cx8829" 
                      color="#18181b" 
                      shimmerColor="#a1a1aa"
                      duration={3}
                      delay={1}
                      repeatDelay={4}
                    />
                  </div>
                  <div className="text-[12px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3" />
                    Sep 14, 2:30 PM
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-full border border-black/5 text-[12px] font-medium text-zinc-600 bg-stone-50">
                  Duration: 4m 12s
                </span>
                <span className="px-4 py-1.5 rounded-full border border-black/5 text-[12px] font-medium text-zinc-600 bg-stone-50 flex items-center gap-2">
                  <motion.span 
                    initial={{ scale: 0 }} 
                    whileInView={{ scale: 1 }} 
                    viewport={{ once: true }}
                    transition={{ delay: 1.5, type: "spring", stiffness: 300, damping: 20 }}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-900" 
                  />
                  Resolved
                </span>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 md:p-12 space-y-12">
              
              {/* Subtle Monochrome Waveform Texture */}
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.4 }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.5 }}
                className="h-16 w-full"
              >
                <StaticWaveform 
                  bars={100} 
                  barWidth={2} 
                  barGap={2} 
                  barRadius={1}
                  height={48}
                  fadeEdges={true}
                  fadeWidth={40}
                  className="w-full text-zinc-300"
                />
              </motion.div>

              {/* Executive Summary */}
              <motion.div
                initial={{ opacity: 0, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-6">Executive Summary</div>
                <p className="text-xl md:text-2xl text-zinc-800 leading-relaxed font-medium">
                  "Caller requested a flight cancellation for TX-102. The agent successfully processed a full refund to the original payment method and verified the user's Enterprise tier status. The interaction concluded with high user satisfaction."
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-black/5">
                
                {/* Action Items Column */}
                <motion.div
                  variants={listContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-6">Action Items</div>
                  <div className="space-y-4">
                    <motion.div variants={listItemVariants} className="flex items-start gap-4">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                        <motion.div
                           initial={{ scale: 0, opacity: 0 }}
                           whileInView={{ scale: 1, opacity: 1 }}
                           viewport={{ once: true }}
                           transition={{ delay: 1.2, type: "spring" }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      </div>
                      <span className="text-[15px] text-zinc-500 line-through">Process refund for TX-102</span>
                    </motion.div>
                    <motion.div variants={listItemVariants} className="flex items-start gap-4">
                      <div className="mt-0.5 w-5 h-5 rounded-full border border-black/10 flex items-center justify-center shrink-0 bg-stone-50" />
                      <span className="text-[15px] text-zinc-900 font-medium">Send confirmation email to user</span>
                    </motion.div>
                    <motion.div variants={listItemVariants} className="flex items-start gap-4">
                      <div className="mt-0.5 w-5 h-5 rounded-full border border-black/10 flex items-center justify-center shrink-0 bg-stone-50" />
                      <span className="text-[15px] text-zinc-900 font-medium">Update CRM with resolution notes</span>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Entities Column */}
                <motion.div
                  variants={listContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-6">Extracted Entities</div>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      "Flight: TX-102",
                      "Intent: Cancellation",
                      "Tier: Enterprise",
                      "Sentiment: Positive"
                    ].map((entity, i) => (
                      <motion.span 
                        key={i}
                        variants={pillVariants}
                        className="px-4 py-2 rounded-full text-[13px] font-medium border border-black/5 bg-stone-50 text-zinc-600"
                      >
                        {entity}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

              </div>
            </div>
            
            {/* View Full Transcript Footer */}
            <div className="bg-stone-50/50 border-t border-black/5 px-8 md:px-12 py-5">
              <button className="w-full flex items-center justify-between text-[14px] font-medium text-zinc-900 group">
                View full transcript
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}

