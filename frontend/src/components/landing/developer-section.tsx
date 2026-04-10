"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Code2, ArrowRight, Copy, Check, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ShimmeringText } from "@/components/ui/shimmering-text";

type Lang = "curl" | "typescript" | "python";

const langLabels: Record<Lang, string> = {
  curl: "cURL",
  typescript: "TypeScript",
  python: "Python",
};

const langFilenames: Record<Lang, string> = {
  curl: "create_outbound_call.sh",
  typescript: "create_outbound_call.ts",
  python: "create_outbound_call.py",
};

const langRawCode: Record<Lang, string> = {
  curl: `curl -X POST "https://api.nenyax.ai/v1/calls/outbound" \\
  -H "Authorization: Bearer $NENYAX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "agt_992xjf8",
    "to_number": "+14155552671",
    "prompt_overrides": {
      "user_name": "Alex Chen"
    }
  }'`,
  typescript: `const response = await fetch(
  "https://api.nenyax.ai/v1/calls/outbound",
  {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${process.env.NENYAX_API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: "agt_992xjf8",
      to_number: "+14155552671",
      prompt_overrides: {
        user_name: "Alex Chen",
      },
    }),
  }
);

const call = await response.json();`,
  python: `import requests

response = requests.post(
    "https://api.nenyax.ai/v1/calls/outbound",
    headers={
        "Authorization": f"Bearer {NENYAX_API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "agent_id": "agt_992xjf8",
        "to_number": "+14155552671",
        "prompt_overrides": {
            "user_name": "Alex Chen",
        },
    },
)

call = response.json()`,
};

function CurlLines() {
  return (
    <>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 font-medium">curl</span> <span className="text-zinc-400 dark:text-zinc-500">-X</span> POST <span className="text-zinc-500 dark:text-zinc-400">&quot;https://api.nenyax.ai/v1/calls/outbound&quot;</span> \
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500">  -H</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;Authorization: Bearer $NENYAX_API_KEY&quot;</span> \
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500">  -H</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;Content-Type: application/json&quot;</span> \
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500">  -d</span> <span className="text-zinc-900 dark:text-zinc-100">&apos;{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-4">&quot;agent_id&quot;</span>: <span className="text-zinc-500 dark:text-zinc-400">&quot;agt_992xjf8&quot;</span>,
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-4">&quot;to_number&quot;</span>: <span className="text-zinc-500 dark:text-zinc-400">&quot;+14155552671&quot;</span>,
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-4">&quot;prompt_overrides&quot;</span>: <span className="text-zinc-400 dark:text-zinc-500">{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-8">&quot;user_name&quot;</span>: <span className="text-zinc-500 dark:text-zinc-400">&quot;Alex Chen&quot;</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500 ml-4">{'}'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100">  {'}'}&apos;</span>
      </motion.div>
    </>
  );
}

function TypeScriptLines() {
  return (
    <>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 font-medium">const</span> response = <span className="text-zinc-900 dark:text-zinc-100 font-medium">await</span> <span className="text-zinc-900 dark:text-zinc-100">fetch</span><span className="text-zinc-400 dark:text-zinc-500">(</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-500 dark:text-zinc-400 ml-4">&quot;https://api.nenyax.ai/v1/calls/outbound&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="ml-4 text-zinc-400 dark:text-zinc-500">{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-8">method</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;POST&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-8">headers</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-400 dark:text-zinc-500">{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-12">&quot;Authorization&quot;</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">{"`"}Bearer {'$'}{'{'}process.env.NENYAX_API_KEY{'}'}{"`"}</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-12">&quot;Content-Type&quot;</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;application/json&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500 ml-8">{'}'}</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-8">body</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-900 dark:text-zinc-100">JSON</span><span className="text-zinc-400 dark:text-zinc-500">.</span><span className="text-zinc-900 dark:text-zinc-100">stringify</span><span className="text-zinc-400 dark:text-zinc-500">(</span><span className="text-zinc-400 dark:text-zinc-500">{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-12">agent_id</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;agt_992xjf8&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-12">to_number</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;+14155552671&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-12">prompt_overrides</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-400 dark:text-zinc-500">{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-16">user_name</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;Alex Chen&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500 ml-12">{'}'}</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500 ml-8">{'}'}</span><span className="text-zinc-400 dark:text-zinc-500">)</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500 ml-4">{'}'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500">)</span><span className="text-zinc-400 dark:text-zinc-500">;</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">&nbsp;</motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 font-medium">const</span> call = <span className="text-zinc-900 dark:text-zinc-100 font-medium">await</span> <span className="text-zinc-900 dark:text-zinc-100">response</span><span className="text-zinc-400 dark:text-zinc-500">.</span><span className="text-zinc-900 dark:text-zinc-100">json</span><span className="text-zinc-400 dark:text-zinc-500">()</span><span className="text-zinc-400 dark:text-zinc-500">;</span>
      </motion.div>
    </>
  );
}

function PythonLines() {
  return (
    <>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 font-medium">import</span> <span className="text-zinc-900 dark:text-zinc-100">requests</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">&nbsp;</motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100">response</span> = <span className="text-zinc-900 dark:text-zinc-100">requests</span><span className="text-zinc-400 dark:text-zinc-500">.</span><span className="text-zinc-900 dark:text-zinc-100">post</span><span className="text-zinc-400 dark:text-zinc-500">(</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-500 dark:text-zinc-400 ml-4">&quot;https://api.nenyax.ai/v1/calls/outbound&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-4">headers</span><span className="text-zinc-400 dark:text-zinc-500">=</span><span className="text-zinc-400 dark:text-zinc-500">{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-500 dark:text-zinc-400 ml-8">&quot;Authorization&quot;</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">f&quot;Bearer {'{'}NENYAX_API_KEY{'}'}&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-500 dark:text-zinc-400 ml-8">&quot;Content-Type&quot;</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;application/json&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500 ml-4">{'}'}</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100 ml-4">json</span><span className="text-zinc-400 dark:text-zinc-500">=</span><span className="text-zinc-400 dark:text-zinc-500">{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-500 dark:text-zinc-400 ml-8">&quot;agent_id&quot;</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;agt_992xjf8&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-500 dark:text-zinc-400 ml-8">&quot;to_number&quot;</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;+14155552671&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-500 dark:text-zinc-400 ml-8">&quot;prompt_overrides&quot;</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-400 dark:text-zinc-500">{'{'}</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-500 dark:text-zinc-400 ml-12">&quot;user_name&quot;</span><span className="text-zinc-400 dark:text-zinc-500">:</span> <span className="text-zinc-500 dark:text-zinc-400">&quot;Alex Chen&quot;</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500 ml-8">{'}'}</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500 ml-4">{'}'}</span><span className="text-zinc-400 dark:text-zinc-500">,</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-400 dark:text-zinc-500">)</span>
      </motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">&nbsp;</motion.div>
      <motion.div variants={codeLineVariants} className="whitespace-nowrap">
        <span className="text-zinc-900 dark:text-zinc-100">call</span> = <span className="text-zinc-900 dark:text-zinc-100">response</span><span className="text-zinc-400 dark:text-zinc-500">.</span><span className="text-zinc-900 dark:text-zinc-100">json</span><span className="text-zinc-400 dark:text-zinc-500">()</span>
      </motion.div>
    </>
  );
}

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
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const langs: Lang[] = ["curl", "typescript", "python"];

export function DeveloperSection() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Lang>("curl");

  const handleCopy = () => {
    navigator.clipboard.writeText(langRawCode[activeTab]).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-white dark:bg-[#0C0C0C] py-24 md:py-32 overflow-hidden w-full">
      <div className="container mx-auto px-6">

        {/* Editorial Header Grid */}        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start mb-16 md:mb-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-50 dark:bg-zinc-900 border border-black/5 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 text-[13px] font-medium shadow-sm mb-8">
              <Terminal className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              Developer API
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-[4rem] font-medium tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.05]">
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
            <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-xl">
              Nenyax exposes a clean, deterministic REST API for all infrastructure primitives. Provision numbers, dispatch outbound calls, and manage agent configurations programmatically.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Button size="lg" className="rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-7 h-12 text-[14px] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm" asChild>
                <a href="https://nenyax.mintlify.app" target="_blank" rel="noopener noreferrer">
                  Read the Docs
                </a>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full bg-white dark:bg-[#0C0C0C] text-zinc-900 dark:text-zinc-100 border-black/5 dark:border-white/[0.06] px-7 h-12 text-[14px] font-medium hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors shadow-sm group" asChild>
                <a href="https://nenyax.mintlify.app/api-reference" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  API Reference
                  <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Large Product Canvas */}
        <div className="w-full bg-stone-50 dark:bg-zinc-900 rounded-[2.5rem] md:rounded-[3rem] border border-black/5 dark:border-white/[0.06] p-6 md:p-16 lg:p-24 relative overflow-hidden">
          
          {/* Ambient Background Accents */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] -translate-y-1/2 translate-x-1/3 bg-white/60 dark:bg-zinc-900/40 rounded-full blur-[100px] pointer-events-none" />

          {/* Focal Demo: Unified Light-Mode API Document */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-4xl mx-auto bg-white dark:bg-[#0C0C0C] rounded-[2rem] border border-black/5 dark:border-white/[0.06] shadow-sm overflow-hidden relative z-10"
          >
            
            {/* Header / Endpoint Bar */}
            <div className="px-6 md:px-8 py-5 border-b border-black/5 dark:border-white/[0.06] flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-[#0C0C0C]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 mr-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-black/10 shadow-sm" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-black/10 shadow-sm" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-black/10 shadow-sm" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-stone-50 dark:bg-zinc-900 rounded-full border border-black/5 dark:border-white/[0.06]">
                  <span className="text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase">POST</span>
                </div>
                <div className="text-[13px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center">
                  <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">https://api.nenyax.ai</span>
                  <ShimmeringText
                    text="/v1/calls/outbound"
                    color="var(--muted-foreground)"
                    shimmerColor="var(--foreground)"
                    duration={3}
                    delay={1.5}
                    repeatDelay={5}
                  />
                </div>
              </div>
              <button 
                onClick={handleCopy}
                className="w-8 h-8 rounded-full border border-black/5 dark:border-white/[0.06] bg-stone-50 dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
              >
                {copied ? <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Language Tab Bar */}
            <div className="px-6 md:px-8 py-3 border-b border-black/5 dark:border-white/[0.06] flex items-center gap-2">
              {langs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[12px] font-medium transition-colors",
                    activeTab === lang
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-stone-50 dark:hover:bg-zinc-800"
                  )}
                >
                  {langLabels[lang]}
                </button>
              ))}
            </div>

            {/* Editor Body */}
            <div className="p-8 md:p-12 bg-white dark:bg-[#0C0C0C]">

              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-stone-50 dark:bg-zinc-900 border border-black/5 dark:border-white/[0.06] flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                </div>
                <span className="text-[12px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  {langFilenames[activeTab]}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={codeContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="font-mono text-[13px] md:text-[14px] leading-[2] text-zinc-600 dark:text-zinc-400 overflow-x-auto pb-4"
                >
                  {activeTab === "curl" && <CurlLines />}
                  {activeTab === "typescript" && <TypeScriptLines />}
                  {activeTab === "python" && <PythonLines />}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Status Footer */}
            <div className="bg-stone-50/50 dark:bg-zinc-900/50 border-t border-black/5 dark:border-white/[0.06] px-8 md:px-12 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">API Status: Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <motion.span 
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inline-flex h-full w-full rounded-full bg-zinc-400"
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900 dark:bg-white" />
                </span>
                <span className="text-[11px] font-mono text-zinc-900 dark:text-zinc-100">99.99% Uptime</span>
              </div>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
