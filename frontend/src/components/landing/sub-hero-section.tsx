"use client";

import { Cpu, Zap, Lock, Globe } from "lucide-react";

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
    <section className="bg-white py-24 md:py-32 w-full">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="max-w-3xl mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-zinc-900 leading-[1.1] tracking-tight mb-6">
            The infrastructure to build, scale, and secure voice applications.
          </h2>
          <p className="text-[17px] md:text-lg text-zinc-500 leading-relaxed max-w-2xl">
            Nenyax is an open-source orchestration layer that gives every voice agent a personal runtime computer. Build complex, stateful workflows that run mid-conversation.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {FEATURES.map((feature, idx) => (
            <div key={idx} className="flex flex-col group">
              <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-black/5 flex items-center justify-center text-zinc-600 mb-6 shadow-sm group-hover:bg-white group-hover:shadow-[0_4px_14px_rgb(0,0,0,0.05)] transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-[16px] font-semibold text-zinc-900 mb-2.5 tracking-tight">{feature.title}</h3>
              <p className="text-[14px] text-zinc-500 leading-relaxed pr-4">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
