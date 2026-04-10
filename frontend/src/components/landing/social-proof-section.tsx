"use client";

import { motion } from "framer-motion";
import { Marquee } from "@/components/ui/marquee";

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

const stats = [
  { value: "$0", label: "Platform Fee" },
  { value: "<50ms", label: "Latency" },
  { value: "AGPL-3.0", label: "Licensed" },
  { value: "99.99%", label: "Uptime" },
];

const integrations = [
  "Twilio",
  "LiveKit",
  "Google Gemini",
  "Resemble AI",
  "Deepgram",
  "AssemblyAI",
  "Stripe",
  "Cal.com",
];

export function SocialProofSection() {
  return (
    <section className="py-16 md:py-20 bg-[#FAFAFA] dark:bg-[#080808]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Stats strip */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x md:divide-black/5 dark:md:divide-white/[0.06] bg-white dark:bg-[#0C0C0C] rounded-[1.5rem] border border-black/5 dark:border-white/[0.06] shadow-[0_2px_8px_rgb(0,0,0,0.02)] p-2 md:p-0"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-5 md:py-6"
            >
              <span className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{stat.value}</span>
              <span className="text-[12px] text-zinc-400 dark:text-zinc-500 font-medium mt-1">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Integrations marquee */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="mt-12"
        >
          <motion.p
            variants={itemVariants}
            className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-widest text-center mb-5"
          >
            Integrates with
          </motion.p>
          <motion.div variants={itemVariants} className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <Marquee pauseOnHover className="[--duration:25s]">
              {integrations.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-white dark:bg-[#0C0C0C] border border-black/5 dark:border-white/[0.06] px-5 py-2.5 text-[13px] font-medium text-zinc-600 dark:text-zinc-400 shadow-sm whitespace-nowrap hover:border-black/10 dark:hover:border-white/10 hover:shadow-md transition-all"
                >
                  {name}
                </span>
              ))}
            </Marquee>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
