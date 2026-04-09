"use client";

import { motion } from "framer-motion";
import { BarChart3, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function CostObservabilitySection() {
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
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-full bg-white border border-black/5 flex items-center justify-center text-zinc-900 shadow-sm group-hover:scale-105 transition-transform duration-300">
                 <Scale className="w-4 h-4" />
               </div>
               <div>
                 <h3 className="text-[17px] font-medium text-zinc-900">Infrastructure Economics</h3>
                 <p className="text-[13px] text-zinc-500">Stop paying marked-up SaaS tolls</p>
               </div>
            </div>

            <div className="flex flex-col border border-black/5 rounded-2xl overflow-hidden bg-white shadow-sm mt-auto">
              {/* Header */}
              <div className="grid grid-cols-3 border-b border-black/5 bg-stone-50/50">
                <div className="p-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Layer</div>
                <div className="p-4 text-[12px] font-semibold text-zinc-900 uppercase tracking-wider text-center bg-white border-x border-black/5 shadow-sm relative z-10">Nenyax</div>
                <div className="p-4 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider text-center">Alternatives</div>
              </div>
              {/* Rows */}
              {[
                { layer: "Platform Fee", nenyax: "$0.00", alt: "~$0.05 / min" },
                { layer: "Intelligence", nenyax: "Nenyax computer", alt: "Locked / Bundled" },
                { layer: "STT / TTS", nenyax: "Direct API Cost", alt: "Marked up" },
                { layer: "Telephony", nenyax: "Your Twilio SIP", alt: "Per-minute toll" },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 border-b border-black/5 last:border-0 relative">
                  <div className="p-4 flex items-center text-[13px] font-medium text-zinc-600">{row.layer}</div>
                  <div className="p-4 flex items-center justify-center text-[13px] font-semibold text-emerald-600 bg-emerald-50/30 border-x border-black/5 text-center relative z-10">
                    {row.nenyax}
                  </div>
                  <div className="p-4 flex items-center justify-center text-[13px] font-medium text-zinc-500 text-center">
                    {row.alt}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Observability (Dark) */}
          <div className="rounded-[2rem] bg-stone-900 p-8 md:p-12 shadow-md flex flex-col relative overflow-hidden group">
            {/* Header */}
            <div className="flex items-center gap-3 mb-10 relative z-10">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/5 group-hover:scale-105 transition-transform duration-300">
                 <BarChart3 className="w-4 h-4" />
               </div>
               <div>
                 <h3 className="text-[17px] font-medium text-white">Cost Observability</h3>
                 <p className="text-[13px] text-zinc-400">Per-session telemetry</p>
               </div>
            </div>

            {/* Mock UI */}
            <div className="mt-auto w-full bg-stone-950 rounded-2xl border border-white/5 p-6 md:p-8 shadow-inner flex flex-col gap-6 relative z-10">
              <div className="flex items-end justify-between border-b border-white/5 pb-5">
                <div>
                  <div className="text-[11px] font-mono text-zinc-500 mb-1">SESSION: call_9281x</div>
                  <div className="text-3xl md:text-4xl font-medium text-white">$0.042</div>
                </div>
                <div className="text-[11px] md:text-[12px] font-mono text-emerald-400 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Completed (1m 12s)
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {/* Provider 1 */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[13px] font-medium">
                    <span className="text-zinc-300">Nenyax computer (LLM)</span>
                    <span className="text-white">$0.012</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: "35%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-emerald-400 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                    <span>840 tokens</span>
                    <span>$0.015 / 1K</span>
                  </div>
                </div>

                {/* Provider 2 */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[13px] font-medium">
                    <span className="text-zinc-300">ElevenLabs (TTS)</span>
                    <span className="text-white">$0.022</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: "55%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-blue-400 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                    <span>310 chars</span>
                    <span>$0.07 / 1K</span>
                  </div>
                </div>

                {/* Provider 3 */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-[13px] font-medium">
                    <span className="text-zinc-300">Deepgram (STT)</span>
                    <span className="text-white">$0.008</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: "10%" }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6 }} className="h-full bg-amber-400 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                    <span>1m 12s</span>
                    <span>$0.005 / min</span>
                  </div>
                </div>
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
