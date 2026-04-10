"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How is Nenyax different from Vapi or Retell?",
    answer:
      "Nenyax is a fully open-source orchestration layer, not a closed SaaS platform. You self-host on your own infrastructure, pay zero platform fees, and only pay for the raw API costs of the providers you choose. Unlike managed platforms, you own your data, your deployment, and your entire voice pipeline.",
  },
  {
    question: "Is Nenyax really free?",
    answer:
      "Yes. Nenyax itself is free and open source under the AGPL-3.0 license. There are no platform fees, per-minute charges, or seat-based pricing. Your only costs are the API calls to third-party providers like Deepgram for speech-to-text, Google Gemini for LLM, and Resemble AI for text-to-speech \u2014 and you pay those providers directly at their published rates.",
  },
  {
    question: "What does AGPL-3.0 mean for my business?",
    answer:
      "The AGPL-3.0 license means you can freely use, modify, and deploy Nenyax. If you modify the source code and offer it as a service to others, you must make your modifications available under the same license. For most businesses using Nenyax internally or as part of their product, this has no practical impact. Enterprise licenses are available for organizations that need different terms.",
  },
  {
    question: "Can I self-host Nenyax?",
    answer:
      "Absolutely. Self-hosting is the recommended deployment method. Nenyax includes a single-command installer that sets up everything on any Linux VPS \u2014 DigitalOcean, Hetzner, AWS, Google Cloud, or even air-gapped environments. Minimum requirements are 4GB RAM and 2 vCPUs, which runs about $7-25/month on most cloud providers.",
  },
  {
    question: "What LLMs and voice providers are supported?",
    answer:
      "Nenyax currently supports Deepgram and AssemblyAI for speech-to-text, Google Gemini for the LLM backbone, and Resemble AI for text-to-speech. The composable architecture is designed for easy provider swapping, and support for additional providers including OpenAI, Anthropic Claude, ElevenLabs, and PlayHT is on the roadmap.",
  },
  {
    question: "How does the runtime agent computer work?",
    answer:
      "Each voice agent runs in an isolated execution environment that can process speech, reason with an LLM, execute function calls to external APIs, and maintain persistent memory across conversations. The agent computer handles voice activity detection, turn-taking, and real-time transcript generation automatically.",
  },
  {
    question: "What latency should I expect?",
    answer:
      "Nenyax is optimized for real-time conversation. Typical end-to-end latency \u2014 from when the caller finishes speaking to when the agent starts responding \u2014 is under 800ms, depending on your choice of STT, LLM, and TTS providers. The orchestration layer itself adds minimal overhead.",
  },
  {
    question: "Do you offer enterprise support?",
    answer:
      "Yes. While Nenyax is open source and community-supported, we offer enterprise plans with dedicated support, SLAs, custom integrations, and priority feature development. Contact our sales team to discuss your requirements.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function FaqSection() {
  return (
    <section className="py-24 md:py-32 bg-white dark:bg-[#0C0C0C]">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1] mb-4"
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-zinc-500 dark:text-zinc-400 mb-16"
          >
            Everything you need to know about building with Nenyax.
          </motion.p>

          <motion.div variants={itemVariants} className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              {faqs.map((faq, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <AccordionItem value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
