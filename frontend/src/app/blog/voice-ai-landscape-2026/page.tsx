"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

// ─── Animation ──────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Reusable Pieces ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-bold mt-16 mb-6">{children}</h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-semibold mt-10 mb-4">{children}</h3>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base leading-7 text-muted-foreground mb-4">
      {children}
    </p>
  );
}

function ComparisonTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="my-8 border">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-semibold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 ${j === 0 ? "font-medium" : "text-muted-foreground"
                    }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({
  children,
  type = "info",
}: {
  children: React.ReactNode;
  type?: "info" | "warning";
}) {
  return (
    <div
      className={`my-6 border-l-4 px-5 py-4 text-sm ${type === "warning"
          ? "border-chart-5 bg-chart-5/5"
          : "border-primary bg-primary/5"
        }`}
    >
      {children}
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-muted text-sm font-mono">
      {children}
    </code>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function VoiceAILandscape2026() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        {/* ── Article Header ──────────────────────────────────────────────── */}
        <section className="border-b">
          <div className="container mx-auto px-4 pt-16 pb-10 lg:pt-24 lg:pb-14">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-3xl"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <Badge variant="secondary">Analysis</Badge>
                <span className="text-sm text-muted-foreground">12 min read</span>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
              >
                Voice AI in 2026: Vapi vs Retell vs Open Source
              </motion.h1>
              <motion.p
                variants={fadeUp}
                className="text-lg text-muted-foreground mb-6"
              >
                A deep comparison of the voice AI platform landscape — real pricing, latency benchmarks, feature gaps, and where open source fits in.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="flex items-center gap-4 text-sm text-muted-foreground"
              >
                <span>Feb 15, 2026</span>
                <span>|</span>
                <span>Arkenos Team</span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Article Body ────────────────────────────────────────────────── */}
        <section>
          <div className="container mx-auto px-4 py-12 lg:py-16">
            <article className="max-w-3xl prose-neutral">

              <Paragraph>
                The voice AI agent market hit $2.4 billion in 2024 and is projected to reach $47.5 billion by 2034 at 34.8% CAGR (per market.us). According to Cartesia (via a16z), 22% of the most recent Y Combinator class is building with voice. Over 90 YC-backed voice agent companies have launched since 2020.
              </Paragraph>

              <Paragraph>
                If you&apos;re building a product that puts an AI on the phone — customer support, appointment booking, lead qualification, or anything else — you have more choices than ever. But the differences between those choices are often hidden behind marketing pages. This article breaks them down with real numbers.
              </Paragraph>

              <Paragraph>
                We compare the three main approaches: <strong>Vapi</strong> (the most flexible managed platform), <strong>Retell AI</strong> (the most polished managed platform), and <strong>open-source stacks</strong> (Pipecat, LiveKit Agents, and Arkenos). We cover pricing, latency, features, lock-in, and the tradeoffs that actually matter in production.
              </Paragraph>

              {/* ── Section: The $0.05 Lie ──────────────────────────────────── */}
              <SectionHeading>The real cost of voice AI</SectionHeading>

              <Paragraph>
                Every managed platform advertises a per-minute base rate. Vapi says $0.05/min. Retell says $0.055/min. These numbers are technically correct — and completely misleading.
              </Paragraph>

              <Paragraph>
                A voice agent needs four components: speech-to-text (STT), a language model (LLM), text-to-speech (TTS), and telephony. The base rate covers only the orchestration layer. You still pay for every other piece. Here&apos;s what it actually costs to run a production agent:
              </Paragraph>

              <ComparisonTable
                headers={["Component", "Vapi", "Retell", "Self-Hosted"]}
                rows={[
                  ["Platform fee", "$0.050/min", "$0.055/min", "$0 (your infra)"],
                  ["STT (Deepgram nova-2)", "$0.010/min", "Included*", "$0.004/sec direct"],
                  ["LLM (GPT-4o)", "$0.060/min", "$0.050/min", "API cost only"],
                  ["TTS (ElevenLabs)", "$0.036/min", "$0.040/min", "API cost only"],
                  ["Telephony (US)", "$0.008/min", "$0.015/min", "$0.002–0.01/min"],
                  ["Total", "$0.164/min", "$0.160/min", "~$0.03–0.05/min"],
                ]}
              />

              <Paragraph>
                <em>*Retell bundles STT internally — you can&apos;t choose your STT provider.</em>
              </Paragraph>

              <Callout type="warning">
                <strong>At 10,000 minutes/month</strong>, Vapi costs roughly $1,443 while Retell costs about $700 (bundled pricing). A self-hosted stack with direct API accounts runs $300–500. At 100,000+ minutes, self-hosted drops to approximately $0.03/min — a 5x savings over managed platforms.
              </Callout>

              <Paragraph>
                Vapi sends you up to five separate invoices — platform, telephony, STT, TTS, and LLM — making it hard to forecast costs. Retell bundles more, which simplifies billing but removes your ability to choose cheaper providers for individual components.
              </Paragraph>

              <SubHeading>Enterprise pricing</SubHeading>

              <Paragraph>
                Vapi&apos;s enterprise tier is custom-priced (third-party estimates put it at $40,000–70,000/year for moderate usage). HIPAA compliance is an additional $1,000/month. Retell&apos;s enterprise pricing starts at $0.05/min base for companies with 50+ concurrent calls or over $3,000/month spend. For comparison, the only platform offering on-premise deployment — Cognigy — charges $300,000+/year.
              </Paragraph>

              <Paragraph>
                Self-hosting eliminates the platform fee entirely. Your only costs are cloud infrastructure and direct API charges to STT/LLM/TTS providers.
              </Paragraph>

              {/* ── Section: Latency ──────────────────────────────────────── */}
              <SectionHeading>Latency: the number that matters most</SectionHeading>

              <Paragraph>
                In voice, latency is everything. Humans notice pauses above 300ms and find conversations unnatural above 800ms. Every voice agent follows the same flow: the user speaks → STT transcribes → LLM reasons → TTS generates audio → audio plays back. Each hop adds delay.
              </Paragraph>

              <ComparisonTable
                headers={["Metric", "Vapi (best case)", "Retell", "Self-Hosted"]}
                rows={[
                  ["STT latency", "90ms", "~100ms (internal)", "90–150ms"],
                  ["LLM time-to-first-token", "200ms", "180ms", "150–300ms"],
                  ["TTS latency", "75ms", "~80ms", "75–120ms"],
                  ["Network overhead (web)", "100ms", "~100ms", "~20ms (colocated)"],
                  ["Network overhead (phone)", "600ms+", "~260ms", "~50ms (colocated)"],
                  ["Total (web)", "~465ms", "~460ms", "~335–590ms"],
                  ["Total (phone)", "~965ms+", "~600ms", "~385–640ms"],
                ]}
              />

              <Paragraph>
                Retell claims approximately 600ms end-to-end latency on their official site. Vapi claims similar best-case numbers on WebRTC but adds 600ms+ of telephony overhead through Twilio/Vonage. In practice, users on Vapi&apos;s own community forums report 6–7 second latency spikes during peak hours.
              </Paragraph>

              <Callout>
                <strong>The self-hosting advantage</strong>: when STT, LLM, and TTS run colocated on the same infrastructure, you eliminate 180–200ms of non-compressible network latency between services. This is latency that managed platforms physically cannot remove because they route through multiple provider APIs.
              </Callout>

              <Paragraph>
                Under concurrency load, Retell degrades roughly 8% according to their own benchmarks (~650ms at 50 concurrent calls). Google Dialogflow degrades 35% under the same load. Vapi&apos;s concurrency performance varies significantly — the pay-as-you-go tier caps at 10 concurrent calls.
              </Paragraph>

              {/* ── Section: Features ──────────────────────────────────────── */}
              <SectionHeading>Feature comparison</SectionHeading>

              <ComparisonTable
                headers={["Feature", "Vapi", "Retell", "Open Source*"]}
                rows={[
                  ["STT providers", "Deepgram, AssemblyAI, Azure, Google, Whisper", "Internal (not selectable)", "Any (you choose)"],
                  ["LLM providers", "OpenAI, Claude, Gemini, Mistral, Llama, custom", "OpenAI, Claude, Gemini, custom", "Any"],
                  ["TTS providers", "ElevenLabs, PlayHT, Azure, Deepgram, custom", "ElevenLabs, Cartesia, OpenAI, Retell native", "Any"],
                  ["Function calling", "Yes (webhooks + code tools)", "Yes (built-in)", "Yes"],
                  ["Telephony", "Twilio, Vonage, Telnyx", "Twilio, Vonage, SIP", "Twilio, Telnyx, SIP"],
                  ["Visual flow builder", "Yes (Flow Studio)", "Yes (basic)", "No**"],
                  ["Multi-agent transfer", "Yes (Squads)", "Yes (Warm Transfer 2.0)", "Framework-dependent"],
                  ["Batch outbound", "Limited", "Yes", "Build your own"],
                  ["Dashboard", "Yes", "Yes", "Framework: No / Arkenos: Yes"],
                  ["Self-hosting", "No", "No", "Yes"],
                  ["HIPAA", "Yes (+$1K/mo)", "Yes (enterprise)", "You control compliance"],
                  ["SOC 2 Type II", "Yes", "Claimed", "N/A (your infra)"],
                  ["RBAC", "No", "No", "Build your own"],
                  ["Concurrent call limit", "10 (pay-as-you-go)", "20 (free tier)", "Infrastructure-limited"],
                ]}
              />

              <Paragraph>
                <em>*Open Source covers Pipecat, LiveKit Agents, and Arkenos. **Arkenos&apos;s visual builder is on the roadmap.</em>
              </Paragraph>

              <SubHeading>Where Vapi wins</SubHeading>

              <Paragraph>
                Provider flexibility. Vapi lets you swap any STT, LLM, or TTS provider without changing your agent logic. Their Flow Studio visual builder and Squads (multi-agent orchestration) are the most mature in the market. If you need maximum configurability within a managed platform, Vapi is the strongest option.
              </Paragraph>

              <SubHeading>Where Retell wins</SubHeading>

              <Paragraph>
                Polish and latency. Retell&apos;s bundled approach means fewer knobs to turn but a more predictable experience. Their 620ms end-to-end latency is consistently achievable, their Warm Transfer 2.0 reduces handoff latency by 40%, and their pricing is more transparent. For teams that want to ship fast without optimizing provider combinations, Retell is the smoother path.
              </Paragraph>

              <SubHeading>Where open source wins</SubHeading>

              <Paragraph>
                Cost, control, and compliance. Self-hosting eliminates the $0.05–0.06/min platform fee — which compounds to $500–600/month at 10,000 minutes. You choose every provider, control data residency (solving GDPR and HIPAA without paying extra), and can debug the full stack when something breaks. No black boxes.
              </Paragraph>

              {/* ── Section: Lock-In ──────────────────────────────────────── */}
              <SectionHeading>The lock-in problem</SectionHeading>

              <Paragraph>
                This is the dimension most buyers underestimate. Vapi and Retell are both cloud-only with no self-hosting option. When you build on either platform, you accumulate dependencies:
              </Paragraph>

              <Paragraph>
                <strong>Vapi</strong>: Your workflow logic lives in Flow Studio and Squads — proprietary formats that don&apos;t export. If you leave Vapi, you rebuild your agent orchestration from scratch. You also manage 4–6 separate vendor relationships (Vapi + each provider), creating billing fragmentation.
              </Paragraph>

              <Paragraph>
                <strong>Retell</strong>: Your STT is bundled and not selectable. Your agent configuration, webhook integrations, and call flow logic are all tied to Retell&apos;s API surface. Switching means reimplementing everything.
              </Paragraph>

              <Paragraph>
                <strong>Open source</strong>: Your code is your code. If the framework maintainer changes direction, you fork. If a provider raises prices, you swap. Your orchestration logic is standard Python/TypeScript that runs anywhere.
              </Paragraph>

              <Callout type="warning">
                <strong>The hidden cost of lock-in</strong>: Users report that Vapi assistants break after platform or upstream API updates, requiring emergency developer intervention. When your infrastructure is a black box, you can&apos;t diagnose root causes — you can only wait for the vendor to fix it.
              </Callout>

              {/* ── Section: Open Source Landscape ────────────────────────── */}
              <SectionHeading>The open-source landscape</SectionHeading>

              <Paragraph>
                Three open-source frameworks have production-grade traction:
              </Paragraph>

              <ComparisonTable
                headers={["Project", "GitHub Stars", "Approach", "Strength"]}
                rows={[
                  ["Pipecat (Daily.co)", "10,500+", "Composable Python pipeline", "Widest provider support, Pipecat Cloud option"],
                  ["LiveKit Agents", "9,500+", "WebRTC-native agents", "Used by OpenAI and xAI in production"],
                  ["TEN Framework", "10,100+", "Modular extensions", "Multimodal (voice + vision), fastest growing"],
                ]}
              />

              <Paragraph>
                These frameworks are battle-tested and well-maintained. But they share a common gap: <strong>none of them include a dashboard</strong>. You get a Python/TypeScript SDK for building agents, but monitoring, deployment, analytics, and agent management? You build all of that yourself.
              </Paragraph>

              <Paragraph>
                This is the fundamental tradeoff in the market today:
              </Paragraph>

              <ComparisonTable
                headers={["", "Managed (Vapi/Retell)", "Framework (Pipecat/LiveKit)", "Platform (Arkenos)"]}
                rows={[
                  ["Dashboard", "Yes", "No", "Yes"],
                  ["Self-hosting", "No", "Yes", "Yes"],
                  ["Provider flexibility", "High (Vapi) / Medium (Retell)", "Full", "Full"],
                  ["Setup time", "Hours", "Days–weeks", "Minutes"],
                  ["Ongoing cost", "$0.10–0.33/min", "~$0.03–0.05/min", "~$0.03–0.05/min"],
                  ["Vendor lock-in", "High", "None", "None"],
                ]}
              />

              <Paragraph>
                Arkenos sits in the gap between managed platforms and raw frameworks. It&apos;s open-source (AGPL-3.0), self-hostable, and includes the dashboard — agent management, call logs, analytics, and API keys — so you get the convenience of Vapi/Retell without the lock-in or markup.
              </Paragraph>

              {/* ── Section: Who Should Use What ──────────────────────────── */}
              <SectionHeading>Who should use what</SectionHeading>

              <SubHeading>Choose Vapi if...</SubHeading>
              <Paragraph>
                You have a strong engineering team, need maximum provider flexibility, and want managed infrastructure. You&apos;re comfortable with $0.13–0.33/min all-in costs and don&apos;t need self-hosting. Vapi&apos;s Flow Studio and Squads are the most powerful workflow tools in the managed category.
              </Paragraph>

              <SubHeading>Choose Retell if...</SubHeading>
              <Paragraph>
                You want the fastest time-to-production with the least configuration. Retell&apos;s bundled stack, consistent sub-second latency, and simpler pricing make it the right choice for teams that want to ship and iterate without optimizing every component. Good for contact center replacement projects where you need reliability over flexibility.
              </Paragraph>

              <SubHeading>Choose open source (Pipecat/LiveKit) if...</SubHeading>
              <Paragraph>
                You have infrastructure engineers who can manage WebRTC servers, set up observability, and build custom dashboards. You want zero vendor lock-in and the lowest possible per-minute cost. Best for teams already running significant infrastructure who want to add voice as a capability.
              </Paragraph>

              <SubHeading>Choose Arkenos if...</SubHeading>
              <Paragraph>
                You want the economics and control of open source with the usability of a managed platform. Self-host on your own infrastructure, manage agents through a dashboard, and pay only for the providers you use — no platform markup. Best for teams building voice products who want to own their stack without building everything from scratch.
              </Paragraph>

              {/* ── Section: What's Next ──────────────────────────────────── */}
              <SectionHeading>What&apos;s coming next</SectionHeading>

              <Paragraph>
                The voice AI market is moving fast. A few trends to watch:
              </Paragraph>

              <Paragraph>
                <strong>Speech-to-speech models</strong> are eliminating the STT → LLM → TTS pipeline entirely. Ultravox&apos;s open-weight native audio LLM and OpenAI&apos;s Realtime API both process audio natively, cutting latency and cost significantly. Platforms that are tightly coupled to the three-hop architecture will need to adapt.
              </Paragraph>

              <Paragraph>
                <strong>Self-hosting economics are improving</strong>. Open-source TTS (Kokoro), ASR (Whisper variants), and small LLMs (Llama 3.2) make a fully on-premise, zero-cloud-dependency voice agent stack achievable today. As models get smaller and faster, the cost advantage of self-hosting compounds.
              </Paragraph>

              <Paragraph>
                <strong>Vertical specialization</strong> is accelerating. HappyRobot for logistics, Parloa for European enterprise, Air AI for autonomous sales. The horizontal platform layer — the infrastructure that powers all of these — is where the durable value lies.
              </Paragraph>

              <Paragraph>
                The question isn&apos;t whether voice AI agents will replace most phone-based customer interactions — Gartner projects 1 in 10 agent interactions will be automated by 2026, and the trajectory is accelerating. The question is whether you&apos;ll build on infrastructure you own, or rent it from someone who can change the terms.
              </Paragraph>

              {/* ── Sources ──────────────────────────────────────────────── */}
              <SectionHeading>Sources</SectionHeading>

              <div className="text-sm text-muted-foreground space-y-2 mb-16">
                <p>Market sizing: market.us Voice AI Agents Report (2024), Technavio Voice AI Forecast, a16z AI Voice Agents 2025 Update</p>
                <p>Vapi pricing: CloudTalk Vapi Pricing Guide, Telnyx Vapi Pricing Breakdown, Ringg.ai Vapi Pricing Analysis</p>
                <p>Retell pricing: Retell AI Pricing Page, Dialora Retell Cost Guide, Retell Outbound Caller Cost Breakdown</p>
                <p>Latency benchmarks: AssemblyAI Latency Guide for Vapi, Retell AI Latency Face-Off 2025, Telnyx Independent Voice AI Benchmark</p>
                <p>Open-source data: Pipecat GitHub (10.5K stars), LiveKit Agents GitHub (9.5K stars), TEN Framework GitHub (10.1K stars)</p>
                <p>Market trends: Deepgram State of Voice AI 2025, Bessemer Venture Partners Roadmap Voice AI, Gartner AI Agent Automation Forecast</p>
                <p>TCO analysis: Dograh Self-Hosted vs Vapi Real Cost Analysis</p>
              </div>

            </article>

            {/* ── Back + CTA ──────────────────────────────────────────────── */}
            <div className="max-w-3xl border-t pt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                &larr; Back to Blog
              </Link>
              <Link href="/">
                <Button size="sm">Try Arkenos Free</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
