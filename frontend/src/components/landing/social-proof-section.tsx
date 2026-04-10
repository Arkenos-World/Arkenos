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
  "$0 Platform Fee",
  "< 50ms Latency",
  "AGPL-3.0 Licensed",
  "99.99% Uptime",
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
    <section className="py-16 md:py-20 bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="flex flex-wrap gap-3 justify-center"
        >
          {stats.map((stat) => (
            <motion.span
              key={stat}
              variants={itemVariants}
              className="rounded-full bg-white border border-black/5 px-5 py-2 text-sm font-medium text-zinc-700 shadow-sm"
            >
              {stat}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="mt-12"
        >
          <motion.p
            variants={itemVariants}
            className="text-sm text-zinc-400 font-medium text-center mb-4"
          >
            Integrates with
          </motion.p>
          <motion.div variants={itemVariants}>
            <Marquee pauseOnHover className="[--duration:30s]">
              {integrations.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-white border border-black/5 px-5 py-2 text-sm font-medium text-zinc-600 shadow-sm whitespace-nowrap"
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
