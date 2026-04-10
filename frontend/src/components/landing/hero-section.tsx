"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HeroPipelineAnimation } from "@/components/ui/hero-pipeline-animation";
import { ShimmeringText } from "@/components/ui/shimmering-text";

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
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }
  },
};

export function HeroSection({ setAuthOpen }: { setAuthOpen: (b: boolean) => void }) {
  const { data: session } = useSession();

  return (
    <section className="relative bg-white pt-32 pb-16 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        
        {/* Top row: Headline and Description */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start mb-16">
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={containerVariants}
          >
            <motion.h1
              variants={wordVariants}
              className="text-4xl sm:text-5xl lg:text-[4.5rem] font-medium leading-[1.05] text-zinc-900"
            >
              Enterprise-grade<br />
              <ShimmeringText
                text="conversational AI"
                color="#18181b"
                shimmerColor="#a1a1aa"
                duration={3}
                delay={0.8}
                spread={1.5}
                className="text-4xl sm:text-5xl lg:text-[4.5rem] font-medium"
              /><br />
              infrastructure.
            </motion.h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:pt-2"
          >
            <p className="text-base sm:text-lg text-zinc-500 leading-relaxed max-w-xl mb-8">
              Build and deploy production voice agents with runtime compute, persistent memory, MCP tool integration, and full infrastructure control.
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-full bg-zinc-900 text-white px-7 h-11 text-[14px] font-medium hover:bg-zinc-800 transition-colors shadow-sm">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="rounded-full bg-zinc-900 text-white px-7 h-11 text-[14px] font-medium hover:bg-zinc-800 transition-colors shadow-sm" onClick={() => setAuthOpen(true)}>
                  Sign up
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
          className="w-full bg-stone-50 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden"
        >
          <HeroPipelineAnimation />
        </motion.div>

      </div>
    </section>
  );
}