"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeroPipelineAnimation } from "@/components/ui/hero-pipeline-animation";
import { TextRotate } from "@/components/ui/text-rotate";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }
  },
};

export function HeroSection({ setAuthOpen }: { setAuthOpen: (b: boolean) => void }) {
  const { data: session } = useSession();

  return (
    <section className="relative bg-[#FAFAFA] pt-32 pb-16 overflow-hidden w-full">
      {/* Subtle ambient light from top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[300px] bg-white rounded-full blur-[120px] pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        
        {/* Top row: Headline and Description */}
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-start mb-20 mt-10">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
          >
            <motion.h1
              variants={wordVariants}
              className="text-4xl sm:text-5xl lg:text-[4.5rem] font-medium leading-[1.05] tracking-tight text-zinc-900"
            >
              Enterprise-grade<br />
              <TextRotate
                words={["conversational AI", "voice agents", "call automation", "AI pipelines"]}
                className="text-4xl sm:text-5xl lg:text-[4.5rem] font-medium"
              /><br />
              infrastructure.
            </motion.h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="lg:pt-4"
          >
            <p className="text-[17px] sm:text-[18px] text-zinc-500 leading-relaxed max-w-xl mb-10">
              Build and deploy production voice agents with runtime compute, persistent memory, MCP tool integration, and full infrastructure control.
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full bg-zinc-900 text-white px-8 h-12 text-[14px] font-medium hover:bg-zinc-800 transition-colors shadow-[0_4px_14px_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.15)] hover:-translate-y-0.5">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="rounded-full bg-zinc-900 text-white px-8 h-12 text-[14px] font-medium hover:bg-zinc-800 transition-all shadow-[0_4px_14px_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.15)] hover:-translate-y-0.5" onClick={() => setAuthOpen(true)}>
                  Start Building
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* The Massive Playground Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-black/5 shadow-[0_8px_40px_rgb(0,0,0,0.04)]"
        >
          <HeroPipelineAnimation />
        </motion.div>

      </div>
    </section>
  );
}
