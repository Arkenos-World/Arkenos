"use client";

import { motion } from "framer-motion";
import { BarChart3, Scale } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function EconomicsSection() {
  return (
    <section className="py-24 md:py-32 bg-white border-t border-black/5">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight mb-6 text-zinc-900 leading-[1.1]">
            Zero platform fees.<br/>
            <span className="text-zinc-400">Total cost observability.</span>
          </h2>
          <p className="text-lg text-zinc-500 leading-relaxed max-w-2xl">
            You shouldn't pay a premium just to connect an LLM to a phone call. With Nenyax, you pay $0 for the orchestration layer. Your only costs are the raw API calls to the providers you choose, tracked down to the millisecond.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Comparison Table (White/Stone) */}
          <div className="rounded-[2rem] bg-stone-50 border border-black/5 p-8 md:p-12 shadow-sm flex flex-col group transition-all duration-300 hover:shadow-md hover:border-black/10">
            <div className="flex items-center gap-4 mb-12">
               <div className="w-12 h-12 rounded-full bg-white border border-black/5 flex items-center justify-center text-zinc-900 shadow-sm group-hover:scale-105 transition-transform duration-300">
                 <Scale className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-lg font-medium text-zinc-900">Infrastructure Economics</h3>
                 <p className="text-[14px] text-zinc-500">Stop paying marked-up SaaS tolls</p>
               </div>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex items-center justify-between pb-4 mb-2 border-b border-black/5 px-4">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-1/3">Layer</span>
                <span className="text-[11px] font-semibold text-zinc-900 uppercase tracking-wider w-1/3 text-center">Nenyax</span>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-1/3 text-right">Alternatives</span>
              </div>
              
              {/* Rows */}
              {[
                { layer: "Platform Fee", nenyax: "animated-zero" as const, alt: "~$0.05 / min", highlight: true },
                { layer: "Intelligence", nenyax: "Nenyax computer", alt: "Locked Models", highlight: true },
                { layer: "STT / TTS", nenyax: "Direct API Cost", alt: "Marked up" },
                { layer: "Telephony", nenyax: "Your Twilio SIP", alt: "Per-minute toll" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-black/5 hover:shadow-sm">
                  <span className="text-[14px] font-medium text-zinc-600 w-1/3">{row.layer}</span>
                  <span className="w-1/3 text-center">
                    {row.highlight ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[12px] font-semibold text-emerald-600 shadow-sm">
                        {row.nenyax === "animated-zero" ? (
                          <motion.span
                            animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0 0 rgba(16,185,129,0)", "0 0 12px 4px rgba(16,185,129,0.25)", "0 0 0 0 rgba(16,185,129,0)"] }}
                            transition={{ delay: 1.5, duration: 0.6, repeat: 2 }}
                            className="inline-flex"
                          >
                            <AnimatedCounter value={0} prefix="$" decimals={2} className="text-emerald-600 font-semibold" />
                          </motion.span>
                        ) : row.nenyax}
                      </span>
                    ) : (
                      <span className="text-[14px] font-semibold text-zinc-900">{row.nenyax}</span>
                    )}
                  </span>
                  <span className="text-[14px] font-medium text-zinc-500 w-1/3 text-right">{row.alt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Observability (Dark) */}
          <div className="rounded-[2rem] bg-stone-900 p-8 md:p-12 shadow-md flex flex-col relative overflow-hidden group">
            {/* Header */}
            <div className="flex items-center gap-4 mb-12 relative z-10">
               <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/5 group-hover:scale-105 transition-transform duration-300">
                 <BarChart3 className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-lg font-medium text-white">Cost Observability</h3>
                 <p className="text-[14px] text-zinc-400">Per-session telemetry</p>
               </div>
            </div>

            {/* Premium Invoice UI */}
            <div className="mt-auto w-full bg-stone-950 rounded-[1.5rem] border border-white/5 p-8 shadow-2xl flex flex-col gap-6 relative z-10">
              <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="text-[11px] font-mono text-zinc-500 mb-2 uppercase tracking-wider">Session: <span className="text-zinc-300">call_9281x</span></div>
                  <div className="text-4xl md:text-5xl font-medium text-white tracking-tight">
                    <AnimatedCounter value={0.042} prefix="$" decimals={3} />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-emerald-400 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Completed (1m 12s)
                </div>
              </div>

              <div className="flex flex-col gap-6 pt-2">
                {/* Provider 1 */}
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-3">
                  <div className="flex justify-between items-center text-[14px]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-medium text-zinc-300">Nenyax computer</span>
                      <span className="text-zinc-600 font-mono text-[10px] uppercase border border-white/10 px-1.5 rounded">LLM</span>
                    </div>
                    <span className="font-mono text-white"><AnimatedCounter value={0.012} prefix="$" decimals={3} delay={0.1} /></span>
                  </div>
                  <div className="flex justify-between text-[12px] font-mono text-zinc-500 pl-4 border-l border-white/10 ml-1">
                    <span>840 tokens</span>
                    <span>$0.015 / 1K</span>
                  </div>
                </motion.div>

                {/* Provider 2 */}
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="space-y-3">
                  <div className="flex justify-between items-center text-[14px]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-medium text-zinc-300">ElevenLabs</span>
                      <span className="text-zinc-600 font-mono text-[10px] uppercase border border-white/10 px-1.5 rounded">TTS</span>
                    </div>
                    <span className="font-mono text-white"><AnimatedCounter value={0.022} prefix="$" decimals={3} delay={0.2} /></span>
                  </div>
                  <div className="flex justify-between text-[12px] font-mono text-zinc-500 pl-4 border-l border-white/10 ml-1">
                    <span>310 chars</span>
                    <span>$0.07 / 1K</span>
                  </div>
                </motion.div>

                {/* Provider 3 */}
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="space-y-3">
                  <div className="flex justify-between items-center text-[14px]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-medium text-zinc-300">Deepgram</span>
                      <span className="text-zinc-600 font-mono text-[10px] uppercase border border-white/10 px-1.5 rounded">STT</span>
                    </div>
                    <span className="font-mono text-white"><AnimatedCounter value={0.008} prefix="$" decimals={3} delay={0.3} /></span>
                  </div>
                  <div className="flex justify-between text-[12px] font-mono text-zinc-500 pl-4 border-l border-white/10 ml-1">
                    <span>1m 12s</span>
                    <span>$0.005 / min</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Ambient Background */}
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-stone-800 rounded-full blur-[80px] pointer-events-none group-hover:bg-stone-700 transition-colors duration-1000" />
          </div>

        </div>
      </div>
    </section>
  );
}
