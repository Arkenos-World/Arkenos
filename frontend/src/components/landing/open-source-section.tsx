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
    <section className="py-24 md:py-32 bg-[#FAFAFA]">
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
          className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-zinc-900 leading-[1.1]"
        >
          Built in the open.
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="mt-3 text-zinc-400 text-lg"
        >
          Community-driven development.
        </motion.p>
        <motion.p
          variants={itemVariants}
          className="mt-4 text-zinc-500 text-base leading-relaxed max-w-2xl"
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
          <div className="rounded-[2rem] bg-stone-50 border border-black/5 p-10 md:p-16 shadow-sm relative overflow-hidden">
            <BorderBeam size={80} duration={8} />

            {/* GitHub button + license */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <a
                href="https://github.com/Nenyax-World/Nenyax"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-zinc-900 text-white rounded-full px-8 py-3 text-base font-medium hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <Github className="w-5 h-5" />
                Star on GitHub
              </a>
              <span className="rounded-full bg-white border border-black/5 px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
                AGPL-3.0
              </span>
            </div>

            {/* Selling points */}
            <div className="grid sm:grid-cols-3 gap-8">
              {sellingPoints.map((point) => (
                <motion.div key={point.title} variants={itemVariants}>
                  <div className="w-9 h-9 rounded-full bg-white border border-black/5 flex items-center justify-center mb-4 shadow-sm">
                    <point.icon className="w-4 h-4 text-zinc-500" />
                  </div>
                  <h3 className="text-sm font-medium text-zinc-900 mb-1">
                    {point.title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
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
