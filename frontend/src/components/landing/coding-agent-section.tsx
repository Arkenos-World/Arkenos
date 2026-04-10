"use client";

import { motion } from "framer-motion";
import { Terminal, Check, Code2, Sparkles, X } from "lucide-react";
import { ShimmeringText } from "@/components/ui/shimmering-text";

export function CodingAgentSection() {
  return (
    <section className="bg-white py-24 md:py-32 w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Editorial Outer Canvas */}
        <div className="rounded-[2.5rem] md:rounded-[3rem] bg-white border border-black/5 shadow-[0_8px_40px_rgb(0,0,0,0.03)] p-8 md:p-16 lg:p-24 relative overflow-hidden">
          
          {/* Header Content */}
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start mb-16 md:mb-24 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 border border-black/5 shadow-sm text-zinc-600 text-[12px] font-semibold uppercase tracking-widest mb-8">
                <Terminal className="w-3.5 h-3.5 text-zinc-900" />
                On-Platform IDE
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-medium leading-[1.05] text-zinc-900 tracking-tight">
                Ship custom logic<br />
                mid-conversation.
              </h2>
            </div>

            <div className="lg:pt-20">
              <p className="text-[17px] md:text-lg text-zinc-500 leading-relaxed max-w-xl">
                Chat with the Nenyax coding agent to modify your voice pipeline, rewrite system prompts, or integrate custom webhooks. Review accurate code diffs and apply changes directly to your active deployment with one click.
              </p>
            </div>
          </div>

          {/* Main Visual: Cursor-style Inline Edit Demo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl mx-auto bg-[#FAFAFA] rounded-2xl border border-black/5 shadow-[0_20px_60px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col font-mono text-[13px] relative z-10"
          >
            {/* Editor Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-black/5 bg-white overflow-x-auto shadow-sm z-20">
              <div className="flex items-center gap-1.5 mr-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-black/10 shadow-sm" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-black/10 shadow-sm" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-black/10 shadow-sm" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-900 text-[12px] font-semibold tracking-tight border border-black/5 shadow-sm whitespace-nowrap">
                <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                agent_config.py
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-500 text-[12px] font-medium hover:bg-zinc-50 transition-colors whitespace-nowrap cursor-pointer">
                system_prompt.txt
              </div>
            </div>

            {/* Editor Body */}
            <div className="p-6 md:p-8 text-zinc-600 bg-[#FAFAFA] overflow-x-auto relative z-10">
              <div className="min-w-[600px] leading-[1.7]">
                <div className="flex mb-1"><span className="w-12 shrink-0 text-right pr-5 text-zinc-400 select-none">42</span><span className="whitespace-pre">    tools=[</span></div>
                <div className="flex mb-1"><span className="w-12 shrink-0 text-right pr-5 text-zinc-400 select-none">43</span><span className="whitespace-pre">        <span className="text-emerald-600">"fetch_calendar_availability"</span>,</span></div>

                {/* Cursor-like Inline Edit Widget */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="my-5 ml-12 mr-4 bg-white border border-black/10 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden font-sans relative"
                >
                  {/* Status Bar */}
                  <div className="px-5 py-3.5 border-b border-black/5 flex items-center justify-between bg-zinc-50">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <ShimmeringText 
                        text="Generating changes..." 
                        className="text-[13px] font-semibold text-zinc-800 tracking-tight" 
                        color="#27272a" 
                        shimmerColor="#71717a" 
                        duration={2} 
                      />
                    </div>
                    <div className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-widest bg-white border border-black/5 px-2.5 py-1 rounded-full shadow-sm">
                      Nenyax Agent
                    </div>
                  </div>

                  {/* Diff Content */}
                  <div className="font-mono text-[13px] leading-[1.8] py-4 bg-white">
                    {/* Removed Line */}
                    <div className="flex bg-red-50/50 text-red-800 px-5 py-1.5 border-l-2 border-red-400">
                      <span className="w-6 shrink-0 select-none text-red-400 font-medium">-</span>
                      <span className="whitespace-pre">        <span className="text-red-700">"transfer_to_agent"</span></span>
                    </div>
                    
                    {/* Added Lines with Animation */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 }}
                      className="flex bg-emerald-50/80 text-emerald-900 px-5 py-1.5 border-l-2 border-emerald-500 mt-1"
                    >
                      <span className="w-6 shrink-0 select-none text-emerald-500 font-medium">+</span>
                      <span className="whitespace-pre">        <span className="text-emerald-700">"check_crm_status"</span>,</span>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 }}
                      className="flex bg-emerald-50/80 text-emerald-900 px-5 py-1.5 border-l-2 border-emerald-500 relative"
                    >
                      <span className="w-6 shrink-0 select-none text-emerald-500 font-medium">+</span>
                      <span className="whitespace-pre">
                                <span className="text-emerald-700">"transfer_to_agent"</span>
                      </span>
                      {/* Blinking Cursor Block */}
                      <span className="inline-block w-2 h-[15px] ml-1 bg-emerald-600 animate-[pulse_1s_ease-in-out_infinite] align-middle mt-[3px]" />
                    </motion.div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-5 py-3 border-t border-black/5 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 bg-white border border-black/5 px-3.5 py-2.5 rounded-xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex items-center gap-2.5 max-w-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[13px] font-medium text-zinc-600 truncate">
                        Add a tool to check CRM status before transferring...
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="px-5 py-2.5 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition-colors text-[13px] font-semibold tracking-tight flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button className="px-6 py-2.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-md hover:shadow-lg transition-all text-[13px] font-semibold tracking-tight flex items-center gap-1.5 hover:-translate-y-0.5">
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                    </div>
                  </div>
                </motion.div>

                <div className="flex mt-1"><span className="w-12 shrink-0 text-right pr-5 text-zinc-400 select-none">46</span><span className="whitespace-pre">    ],</span></div>
                <div className="flex mt-1"><span className="w-12 shrink-0 text-right pr-5 text-zinc-400 select-none">47</span><span className="whitespace-pre text-zinc-800">{`    temperature=0.2,`}</span></div>
                <div className="flex mt-1"><span className="w-12 shrink-0 text-right pr-5 text-zinc-400 select-none">48</span><span className="whitespace-pre text-zinc-800">{`    max_duration_seconds=600`}</span></div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
