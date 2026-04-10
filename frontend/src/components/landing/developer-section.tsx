"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Code2, ArrowRight, Copy, Check, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const codeLineVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
};

const codeContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.6 },
  },
};

export function DeveloperSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <Terminal className="w-4 h-4 text-zinc-400" />
              Developer API
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-[4rem] font-medium tracking-tight text-zinc-900 leading-[1.05]">
              Built by engineers,<br />for engineers.
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:pt-24"
          >
            <p className="text-lg text-zinc-500 leading-relaxed mb-8 max-w-xl">
              Nenyax exposes a clean, deterministic REST API for all infrastructure primitives. Provision numbers, dispatch outbound calls, and manage agent configurations programmatically.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" className="rounded-full bg-zinc-900 text-white px-7 h-12 text-[14px] font-medium hover:bg-zinc-800 transition-colors shadow-sm" asChild>
                <a href="https://nenyax.mintlify.app" target="_blank" rel="noopener noreferrer">
                  Read the Docs
                </a>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full bg-white text-zinc-900 border-black/5 px-7 h-12 text-[14px] font-medium hover:bg-stone-50 transition-colors shadow-sm group" asChild>
                <a href="https://nenyax.mintlify.app/api-reference" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  API Reference
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Large Product Canvas */}
        <div className="w-full bg-stone-50 rounded-[2.5rem] md:rounded-[3rem] border border-black/5 p-6 md:p-16 lg:p-24 relative overflow-hidden">
          
          {/* Ambient Background Accents */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] -translate-y-1/2 translate-x-1/3 bg-white/60 rounded-full blur-[100px] pointer-events-none" />

          {/* Focal Demo: Unified Light-Mode API Document */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden relative z-10"
          >
            
            {/* Header / Endpoint Bar */}
            <div className="px-6 md:px-8 py-5 border-b border-black/5 flex flex-wrap gap-4 justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 mr-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-stone-50 rounded-full border border-black/5">
                  <span className="text-[11px] font-mono font-bold text-zinc-900 uppercase">POST</span>
                </div>
                <div className="text-[13px] font-mono text-zinc-600 flex items-center">
                  <span className="text-zinc-400 hidden sm:inline">https://api.nenyax.ai</span>
                  <ShimmeringText 
                    text="/v1/calls/outbound" 
                    color="#52525b" 
                    shimmerColor="#18181b"
                    duration={3}
                    delay={1.5}
                    repeatDelay={5}
                  />
                </div>
              </div>
              <button 
                onClick={handleCopy}
                className="w-8 h-8 rounded-full border border-black/5 bg-stone-50 flex items-center justify-center hover:bg-zinc-100 transition-colors text-zinc-500"
              >
                {copied ? <Check className="w-4 h-4 text-zinc-900" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Editor Body */}
            <div className="p-8 md:p-12 bg-white">
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-stone-50 border border-black/5 flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-zinc-400" />
                </div>
                <span className="text-[12px] font-mono text-zinc-400 uppercase tracking-widest">create_outbound_call.sh</span>
              </div>

              <motion.div 
                variants={codeContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-mono text-[13px] md:text-[14px] leading-[2] text-zinc-600 overflow-x-auto pb-4"
              >
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-900 font-medium">curl</span> <span className="text-zinc-400">-X</span> POST <span className="text-zinc-500">"https://api.nenyax.ai/v1/calls/outbound"</span> \
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-400">  -H</span> <span className="text-zinc-500">"Authorization: Bearer $NENYAX_API_KEY"</span> \
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-400">  -H</span> <span className="text-zinc-500">"Content-Type: application/json"</span> \
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-400">  -d</span> <span className="text-zinc-900">'{'{'}</span>
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-900 ml-4">"agent_id"</span>: <span className="text-zinc-500">"agt_992xjf8"</span>,
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-900 ml-4">"to_number"</span>: <span className="text-zinc-500">"+14155552671"</span>,
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-900 ml-4">"prompt_overrides"</span>: <span className="text-zinc-400">{'{'}</span>
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-900 ml-8">"user_name"</span>: <span className="text-zinc-500">"Alex Chen"</span>
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-400 ml-4">{'}'}</span>
                </motion.div>
                <motion.div variants={codeLineVariants} className="whitespace-nowrap">
                  <span className="text-zinc-900">  {'}'}'</span>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Status Footer */}
            <div className="bg-stone-50/50 border-t border-black/5 px-8 md:px-12 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-400" />
                <span className="text-[12px] font-medium text-zinc-500">API Status: Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <motion.span 
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inline-flex h-full w-full rounded-full bg-zinc-400"
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900" />
                </span>
                <span className="text-[11px] font-mono text-zinc-900">99.99% Uptime</span>
              </div>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
