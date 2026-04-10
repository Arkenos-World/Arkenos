"use client";

import { useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

import { HeroSection } from "@/components/landing/hero-section";
import { SubHeroSection } from "@/components/landing/sub-hero-section";
import { BentoSection } from "@/components/landing/bento-section";
import { RuntimeComputerSection } from "@/components/landing/runtime-computer-section";
import { ComposablePipelineSection } from "@/components/landing/composable-pipeline-section";
import { CodingAgentSection } from "@/components/landing/coding-agent-section";
import { PostCallIntelligenceSection } from "@/components/landing/post-call-intelligence-section";
import { TelephonySection } from "@/components/landing/telephony-section";
import { EconomicsSection } from "@/components/landing/economics-section";
import { DeveloperSection } from "@/components/landing/developer-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200 selection:text-zinc-900">
      <PublicHeader />

      <main className="flex flex-col w-full overflow-hidden">
        <HeroSection setAuthOpen={setAuthOpen} />
        <SubHeroSection />
        <BentoSection />
        <RuntimeComputerSection />
        <ComposablePipelineSection />
        <CodingAgentSection />
        <PostCallIntelligenceSection />
        <TelephonySection />
        <EconomicsSection />
        <DeveloperSection />
        <CtaSection setAuthOpen={setAuthOpen} />
      </main>

      <PublicFooter />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode="sign-up" />
    </div>
  );
}
