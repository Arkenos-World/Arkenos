"use client";

import { CustomAgentDemo } from "@/components/ui/custom-agent-demo";

export function InfrastructureSection() {
  return (
    <section className="py-48 bg-white dark:bg-background border-t border-border/10">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mb-24">
          <h2 className="text-5xl sm:text-6xl font-medium tracking-tight mb-10 text-foreground">Infrastructure</h2>
          <p className="text-2xl text-muted-foreground leading-relaxed">
            Every agent gets a personal computer. Code in Python or design visually — with an AI assistant that builds alongside you.
          </p>
        </div>

        <div className="rounded-[3rem] bg-stone-50 dark:bg-stone-900/50 p-6 md:p-12 lg:p-20 border border-border/20">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-black/[0.03] dark:border-white/[0.03] shadow-sm overflow-hidden p-8 md:p-12">
            <CustomAgentDemo />
          </div>
        </div>
      </div>
    </section>
  );
}