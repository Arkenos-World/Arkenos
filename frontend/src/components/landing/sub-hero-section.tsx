"use client";

import { motion } from "framer-motion";
import { Cpu, Zap, Lock, Globe } from "lucide-react";

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
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const FEATURES = [
  {
    icon: <Cpu className="w-5 h-5" />,
    title: "Runtime Agent Computer",
    description: "Every agent gets an isolated execution environment to run code, hit APIs, and execute complex workflows instantly."
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Deploy Anywhere",
    description: "Self-host on any Linux VPS or deploy air-gapped. Maintain full ownership of your data and compliance."
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Composable Pipeline",
    description: "Swap any STT, LLM, or TTS provider seamlessly without rewriting your core infrastructure stack."
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Enterprise Telephony",
    description: "Inbound routing, outbound dialing, and seamless transfers via Twilio SIP trunks out of the box."
  }
];

export function SubHeroSection() {
  return (
    <section className="bg-white dark:bg-[#0C0C0C] py-24 md:py-32 w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          className="max-w-3xl mb-16 md:mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-medium text-zinc-900 dark:text-zinc-100 leading-[1.1] tracking-tight mb-6">
            The infrastructure to build, scale, and secure voice applications.
          </motion.h2>
          <motion.p variants={itemVariants} className="text-[17px] md:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            Nenyax is an open-source orchestration layer that gives every voice agent a personal runtime computer. Build complex, stateful workflows that run mid-conversation.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {FEATURES.map((feature, idx) => (
            <motion.div key={idx} variants={itemVariants} className="flex flex-col group bg-white dark:bg-[#0C0C0C] rounded-[1.5rem] border border-black/[0.04] dark:border-white/[0.06] p-7 shadow-[0_1px_3px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 mb-5 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
              {/* Subtle accent glow on hover */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-100 dark:bg-emerald-900 rounded-full blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
