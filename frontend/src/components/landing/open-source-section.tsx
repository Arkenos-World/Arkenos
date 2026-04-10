"use client";

import { motion } from "framer-motion";
import { Github, Code2, Server, Users } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const sellingPoints = [
  {
    icon: Code2,
    title: "Full source access",
    description:
      "Inspect, modify, and extend every component of the platform.",
  },
  {
    icon: Server,
    title: "Self-host anywhere",
    description:
      "Deploy on any Linux VPS, air-gapped network, or cloud provider.",
  },
  {
    icon: Users,
    title: "Community-driven",
    description:
      "Shape the roadmap. Every PR and issue drives real change.",
  },
];

export function OpenSourceSection() {
  return (
    <section className="py-24 md:py-32 bg-[#FAFAFA] dark:bg-[#080808]">
      {/* Section header */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="max-w-7xl mx-auto px-6 md:px-8 mb-12 md:mb-16"
      >
        <motion.h2
          variants={itemVariants}
          className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1]"
        >
          Built in the open.
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="mt-3 text-zinc-400 dark:text-zinc-500 text-lg"
        >
          Community-driven development.
        </motion.p>
        <motion.p
          variants={itemVariants}
          className="mt-4 text-zinc-500 dark:text-zinc-400 text-base leading-relaxed max-w-2xl"
        >
          Nenyax is open source under the AGPL-3.0 license. Deploy on your own
          infrastructure, audit every line of code, and contribute to the future
          of voice AI.
        </motion.p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="max-w-4xl mx-auto px-6 md:px-8"
      >
        <motion.div variants={itemVariants}>
          <div className="rounded-[2rem] bg-zinc-900 dark:bg-zinc-800 p-10 md:p-16 shadow-[0_8px_40px_rgb(0,0,0,0.15)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.2)] relative overflow-hidden">
            <BorderBeam size={80} duration={8} colorFrom="#34d399" colorTo="#10b981" />

            {/* Subtle texture */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none" />

            {/* GitHub button + license */}
            <div className="flex flex-wrap items-center gap-4 mb-10 relative z-10">
              <a
                href="https://github.com/Nenyax-AI/Nenyax"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white dark:bg-zinc-100 text-zinc-900 rounded-full px-8 py-3 text-base font-medium hover:bg-zinc-100 transition-colors shadow-sm"
              >
                <Github className="w-5 h-5" />
                Star on GitHub
              </a>
              <span className="rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-xs font-medium text-zinc-300">
                AGPL-3.0
              </span>
            </div>

            {/* Selling points */}
            <div className="grid sm:grid-cols-3 gap-8 relative z-10">
              {sellingPoints.map((point) => (
                <motion.div key={point.title} variants={itemVariants}>
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/5 flex items-center justify-center mb-4">
                    <point.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-medium text-white mb-1">
                    {point.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {point.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
