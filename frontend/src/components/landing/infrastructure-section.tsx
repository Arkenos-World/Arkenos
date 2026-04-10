"use client";

import { CustomAgentDemo } from "@/components/ui/custom-agent-demo";

export function InfrastructureSection() {
  return (
    <section className="py-32 md:py-48 bg-white border-t border-black/5 w-full">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-50 border border-black/5 text-[13px] font-medium text-zinc-600 mb-6 shadow-sm">
            Extensible Architecture
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-8 text-zinc-900 leading-[1.1]">
            Infrastructure designed <br className="hidden md:block"/> for scale.
          </h2>
          <p className="text-lg text-zinc-500 leading-relaxed max-w-2xl">
            Every agent gets a personal computer. Code in Python or design visually — with an AI assistant that builds alongside you, connected directly to your existing systems.
          </p>
        </div>

        <div className="rounded-[2.5rem] bg-stone-50 p-6 md:p-12 lg:p-16 border border-black/5 shadow-sm">
          <div className="bg-white rounded-2xl border border-black/5 shadow-md overflow-hidden">
            <CustomAgentDemo />
          </div>
        </div>
      </div>
    </section>
  );
}