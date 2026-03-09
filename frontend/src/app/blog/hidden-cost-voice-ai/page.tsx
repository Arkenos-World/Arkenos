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
    <div className="overflow-x-auto my-8 border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 font-semibold whitespace-nowrap"
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
                  className={`px-4 py-3 whitespace-nowrap ${j === 0 ? "font-medium" : "text-muted-foreground"
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

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-foreground/20 pl-4 my-6 text-sm text-muted-foreground italic">
      {children}
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 text-sm font-mono">
      {children}
    </code>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function HiddenCostBlogPost() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="border-b">
          <div className="container mx-auto px-4 pt-20 pb-12 lg:pt-28 lg:pb-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-2xl"
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <Badge variant="outline">Pricing</Badge>
                <span className="text-sm text-muted-foreground">14 min read</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
              >
                The Hidden Cost of Voice AI Platforms
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg text-muted-foreground mb-4"
              >
                Vapi advertises $0.05/min. Retell says $0.07/min. Your actual bill?
                Multiply by 3&ndash;5x. Here&apos;s the real math, with every number sourced.
              </motion.p>

              <motion.p variants={fadeUp} className="text-sm text-muted-foreground">
                Mar 1, 2026
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <section>
          <div className="container mx-auto px-4 py-12 lg:py-16">
            <div className="max-w-2xl">

              <Paragraph>
                Voice AI platforms love simple pricing pages. One number, big and bold:
                &ldquo;$0.05 per minute.&rdquo; It feels affordable. It feels predictable.
                It&apos;s also less than a third of what you&apos;ll actually pay.
              </Paragraph>

              <Paragraph>
                The real cost of a voice AI call is split across four layers: speech-to-text,
                LLM inference, text-to-speech, and telephony. Managed platforms like Vapi and
                Retell bundle these together &mdash; but their headline price only covers the
                platform fee. The rest shows up on separate invoices from Twilio, OpenAI,
                ElevenLabs, and Deepgram.
              </Paragraph>

              <Paragraph>
                We pulled every number from official pricing pages as of Q1 2026. No estimates.
                No ranges. Just what each provider actually charges.
              </Paragraph>

              {/* ── Section 1: Raw Costs ──────────────────────────────────────── */}
              <SectionHeading>What voice AI actually costs to run</SectionHeading>

              <Paragraph>
                Before we talk about platforms, let&apos;s look at what the underlying providers
                charge. These are the raw API costs that every voice AI system pays &mdash;
                whether it&apos;s Vapi, Retell, or your own stack.
              </Paragraph>

              <SubHeading>Speech-to-Text (STT)</SubHeading>

              <ComparisonTable
                headers={["Provider", "Model", "Rate/min", "Notes"]}
                rows={[
                  ["AssemblyAI", "Universal Streaming", "$0.0025", "Cheapest real-time option"],
                  ["Deepgram", "Nova-2 (Growth)", "$0.0047", "Per-second billing, no rounding"],
                  ["Deepgram", "Nova-3 (Growth)", "$0.0065", "Best accuracy + low latency"],
                  ["OpenAI", "Whisper", "$0.006", "Batch only, no streaming"],
                  ["Google", "Cloud STT V2", "$0.016", "Block-based billing"],
                  ["Azure", "Speech", "$0.0167", "Standard PAYG"],
                  ["AWS", "Transcribe", "$0.024", "15-second minimum blocks"],
                ]}
              />

              <Callout>
                Sources: deepgram.com/pricing, assemblyai.com/pricing, cloud.google.com/speech-to-text/pricing,
                openai.com/api/pricing
              </Callout>

              <SubHeading>Large Language Models (LLM)</SubHeading>

              <Paragraph>
                LLM cost depends on tokens processed. A typical 5-minute voice call generates
                roughly 3,000 input tokens and 600 output tokens (based on ~150 words/min
                conversational speech, ~1.33 tokens per word, plus system prompt and conversation
                history).
              </Paragraph>

              <ComparisonTable
                headers={["Model", "Input / 1M tokens", "Output / 1M tokens", "Cost per 5-min call"]}
                rows={[
                  ["Gemini 2.0 Flash", "$0.10", "$0.40", "$0.0005"],
                  ["GPT-4o mini", "$0.15", "$0.60", "$0.0008"],
                  ["Claude Haiku 3", "$0.25", "$1.25", "$0.0015"],
                  ["GPT-4o", "$2.50", "$10.00", "$0.0135"],
                  ["Claude Sonnet 4.6", "$3.00", "$15.00", "$0.018"],
                  ["Gemini 2.5 Pro", "$1.25", "$10.00", "$0.010"],
                ]}
              />

              <Callout>
                Sources: ai.google.dev/gemini-api/docs/pricing, openai.com/api/pricing,
                platform.claude.com/docs/en/about-claude/pricing
              </Callout>

              <Paragraph>
                Notice something? LLM cost per call is almost negligible &mdash; under $0.02
                even with GPT-4o. The expensive parts are elsewhere.
              </Paragraph>

              <SubHeading>Text-to-Speech (TTS)</SubHeading>

              <Paragraph>
                A 5-minute call produces roughly 3,750 characters of AI speech (150 words/min
                &times; 5 chars/word average). Here&apos;s what that costs:
              </Paragraph>

              <ComparisonTable
                headers={["Provider", "Rate / 1M chars", "Cost per 5-min call"]}
                rows={[
                  ["Amazon Polly (Standard)", "$4.00", "$0.00002"],
                  ["Google TTS (Standard)", "$4.00", "$0.00002"],
                  ["OpenAI tts-1", "$15.00", "$0.00006"],
                  ["Amazon Polly (Neural)", "$16.00", "$0.00006"],
                  ["Google TTS (WaveNet)", "$16.00", "$0.00006"],
                  ["Deepgram Aura-2", "$30.00", "$0.0001"],
                  ["ElevenLabs (Pro overage)", "$240.00", "$0.0009"],
                  ["Google TTS (Studio)", "$160.00", "$0.0006"],
                ]}
              />

              <Callout>
                Sources: aws.amazon.com/polly/pricing, cloud.google.com/text-to-speech/pricing,
                elevenlabs.io/pricing, deepgram.com/pricing
              </Callout>

              <Paragraph>
                ElevenLabs is 60x more expensive than Amazon Polly Standard. The voice quality
                is better &mdash; but most managed platforms default to ElevenLabs, and that
                cost gets passed through to you.
              </Paragraph>

              <SubHeading>Telephony</SubHeading>

              <ComparisonTable
                headers={["Provider", "Inbound/min (US)", "Outbound/min (US)", "Phone number/mo"]}
                rows={[
                  ["Twilio", "$0.0085", "$0.014", "$1.15"],
                  ["Telnyx", "~$0.005–$0.008", "~$0.007–$0.01", "~$1.00"],
                  ["Vonage", "$0.0075", "$0.01", "~$1.00"],
                ]}
              />

              <Callout>
                Sources: twilio.com/en-us/voice/pricing/us, telnyx.com/resources/comparing-telnyx-twilio
              </Callout>

              {/* ── Section 2: True Call Cost ─────────────────────────────────── */}
              <SectionHeading>The real cost of a 5-minute call</SectionHeading>

              <Paragraph>
                Now let&apos;s assemble full stacks. Three configurations: budget, mid-range, and
                premium. All self-assembled, paying providers directly.
              </Paragraph>

              <ComparisonTable
                headers={["Component", "Budget", "Mid-range", "Premium"]}
                rows={[
                  ["STT", "AssemblyAI ($0.013)", "Deepgram Nova-3 ($0.033)", "Deepgram Nova-3 ($0.033)"],
                  ["LLM", "Gemini 2.0 Flash ($0.0005)", "GPT-4o mini ($0.0008)", "GPT-4o ($0.0135)"],
                  ["TTS", "Google Standard ($0.00002)", "OpenAI tts-1 ($0.00006)", "ElevenLabs ($0.0009)"],
                  ["Telephony", "Telnyx ($0.025)", "Twilio inbound ($0.043)", "Twilio outbound ($0.070)"],
                  ["Total", "$0.039", "$0.077", "$0.117"],
                ]}
              />

              <Paragraph>
                A mid-range self-assembled stack costs <InlineCode>$0.077</InlineCode> for a
                5-minute call. Keep that number in mind.
              </Paragraph>

              <SubHeading>The same call on Vapi</SubHeading>

              <Paragraph>
                Vapi&apos;s $0.05/min is just the platform fee. On top of that, you pay STT, LLM,
                TTS, and telephony separately. With a mid-range configuration (Deepgram +
                GPT-4o + ElevenLabs + Twilio):
              </Paragraph>

              <ComparisonTable
                headers={["Component", "Rate/min", "5-min cost"]}
                rows={[
                  ["Vapi platform fee", "$0.050", "$0.250"],
                  ["Telephony (Twilio)", "$0.010", "$0.050"],
                  ["STT (Deepgram)", "$0.010", "$0.050"],
                  ["TTS (ElevenLabs)", "$0.036", "$0.180"],
                  ["LLM (GPT-4o)", "~$0.030", "$0.150"],
                  ["Total", "$0.136/min", "$0.680"],
                ]}
              />

              <Paragraph>
                That&apos;s <InlineCode>$0.68</InlineCode> for the same 5-minute call that costs
                $0.077 self-assembled. An <strong>8.8x markup</strong>. And this is consistent
                with independent analyses: real Vapi deployments run $0.13&ndash;$0.33/min,
                not $0.05.
              </Paragraph>

              <Callout>
                &ldquo;60&ndash;70% of our total spend was the Vapi platform fee, and only 30&ndash;40%
                was actual LLM/STT/TTS usage.&rdquo; &mdash; Developer on Hacker News
                (news.ycombinator.com/item?id=45884165)
              </Callout>

              <SubHeading>The same call on Retell</SubHeading>

              <Paragraph>
                Retell bundles STT and basic TTS into their $0.055/min voice infra fee, plus
                $0.015/min for included TTS. But LLM and telephony are extra.
              </Paragraph>

              <ComparisonTable
                headers={["Component", "Rate/min", "5-min cost"]}
                rows={[
                  ["Voice infra + STT", "$0.055", "$0.275"],
                  ["TTS (included voices)", "$0.015", "$0.075"],
                  ["LLM (GPT-4o)", "$0.040", "$0.200"],
                  ["Telephony", "$0.015", "$0.075"],
                  ["Total", "$0.125/min", "$0.625"],
                ]}
              />

              <Paragraph>
                Better than Vapi, but still <strong>8.1x</strong> the self-assembled cost. And
                if you want ElevenLabs instead of their included voices, add another $0.025/min.
              </Paragraph>

              {/* ── Section 3: The Invoice Problem ───────────────────────────── */}
              <SectionHeading>The five-invoice problem</SectionHeading>

              <Paragraph>
                Vapi&apos;s architecture means you can receive up to five separate invoices per
                billing cycle: Vapi itself, Twilio (or Vonage/Telnyx), your LLM provider,
                your TTS provider, and your STT provider. Budget reconciliation becomes a
                full-time job.
              </Paragraph>

              <Paragraph>
                Retell is slightly better &mdash; they bundle STT and basic TTS into one line
                item. But LLM and telephony are still separate charges, and upgrading to
                premium TTS (ElevenLabs) adds another vendor to the mix.
              </Paragraph>

              <Paragraph>
                Both platforms also charge for silence. If a caller is on hold, the agent is
                waiting for a response, or there&apos;s dead air &mdash; the meter is running.
                Every minute the agent is active counts, not just minutes with speech.
              </Paragraph>

              {/* ── Section 4: Hidden Fees ───────────────────────────────────── */}
              <SectionHeading>Hidden fees you won&apos;t see on the pricing page</SectionHeading>

              <SubHeading>Vapi add-ons</SubHeading>

              <ComparisonTable
                headers={["Add-on", "Cost"]}
                rows={[
                  ["HIPAA compliance", "$1,000/month"],
                  ["Slack support channel", "$2,000/month"],
                  ["Call recording (unlimited)", "$200/month"],
                  ["Extra SIP lines", "$10/line/month"],
                  ["Phone numbers", "~$2/month each"],
                  ["Surge pricing (traffic spikes)", "+$0.05/min on top"],
                ]}
              />

              <Paragraph>
                A healthcare company using Vapi starts at $1,000/month in compliance fees alone,
                before a single call is made. Enterprise annual contracts typically run
                $40,000&ndash;$70,000 in platform fees (per third-party estimates from
                cloudtalk.io), excluding all provider costs.
              </Paragraph>

              <SubHeading>Retell add-ons</SubHeading>

              <ComparisonTable
                headers={["Add-on", "Cost"]}
                rows={[
                  ["Knowledge Base", "$8/month per base (10 free)"],
                  ["Concurrent calls beyond 20", "$8/month per slot"],
                  ["ElevenLabs TTS upgrade", "+$0.025/min over included TTS"],
                  ["Branded Caller ID", "$0.10/outbound call"],
                  ["Batch calls", "$0.005/dial"],
                  ["International telephony", "$0.03–$0.80/min"],
                ]}
              />

              <Callout>
                Sources: vapi.ai/pricing, retellai.com/pricing,
                blog.dograh.com/vapi-pricing-breakdown-2025-plans-hidden-costs-what-to-expect,
                emitrr.com/blog/vapi-pricing
              </Callout>

              {/* ── Section 5: At Scale ──────────────────────────────────────── */}
              <SectionHeading>What this looks like at scale</SectionHeading>

              <Paragraph>
                The gap between managed and self-hosted widens dramatically with volume.
                Here&apos;s the monthly cost comparison across three volume tiers:
              </Paragraph>

              <ComparisonTable
                headers={["Volume", "Self-hosted (mid-range)", "Retell (all-in)", "Vapi (all-in)"]}
                rows={[
                  ["1,000 min/mo", "$20–$80", "~$70–$130", "~$180–$220"],
                  ["10,000 min/mo", "$150–$450", "$700–$1,300", "$1,400–$2,600"],
                  ["100,000 min/mo", "$2,000–$5,000", "$7,000–$13,000", "$14,000–$26,000+"],
                ]}
              />

              <Paragraph>
                At 100,000 minutes per month, self-hosting saves <strong>$9,000&ndash;$21,000/month</strong> versus
                Vapi. That&apos;s $108,000&ndash;$252,000 per year. Even versus Retell, self-hosting
                saves $5,000&ndash;$8,000/month at that volume.
              </Paragraph>

              <SubHeading>The break-even point</SubHeading>

              <Paragraph>
                Independent TCO analyses (blog.dograh.com) put the break-even between managed
                platforms and self-hosting at roughly <strong>3,000&ndash;10,000 minutes/month</strong>,
                depending on your engineering costs. Below that, the simplicity of a managed
                platform can be worth it. Above it, you&apos;re paying a growing premium for
                convenience.
              </Paragraph>

              <Paragraph>
                At 20,000 min/month, the Vapi platform fee alone is $1,000/month. At 100,000
                min/month, the raw API cost for a comparable stack is roughly $0.01&ndash;$0.02/min
                vs. Vapi&apos;s $0.13&ndash;$0.18/min &mdash; a 5&ndash;8x difference that
                compounds every month.
              </Paragraph>

              {/* ── Section 6: What You're Paying For ────────────────────────── */}
              <SectionHeading>So what are you paying for?</SectionHeading>

              <Paragraph>
                The honest answer: convenience and time-to-market. Managed platforms give you
                a working voice agent in hours, not weeks. For prototyping or low-volume use
                cases, that tradeoff makes sense.
              </Paragraph>

              <Paragraph>
                But the tradeoff stops making sense when:
              </Paragraph>

              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 ml-2">
                <li>You cross 10,000 minutes/month and the bills keep climbing</li>
                <li>You need HIPAA/GDPR compliance and face $1,000+/month add-ons</li>
                <li>You want to switch providers but your agent configs aren&apos;t portable</li>
                <li>You need reliability &mdash; Vapi logged 230+ incidents since August 2024 (per isdown.app)</li>
                <li>Your data policy says voice recordings can&apos;t leave your infrastructure</li>
              </ul>

              <Paragraph>
                At that point, you&apos;re not paying for value. You&apos;re paying a tax on
                lock-in.
              </Paragraph>

              {/* ── Section 7: The Alternative ───────────────────────────────── */}
              <SectionHeading>The self-hosted alternative</SectionHeading>

              <Paragraph>
                Open-source frameworks like LiveKit Agents and Pipecat give you the same
                voice pipeline &mdash; STT, LLM, TTS, telephony &mdash; without the platform
                fee. You pay providers directly at their listed rates.
              </Paragraph>

              <Paragraph>
                What they don&apos;t give you is the dashboard, the agent builder, the
                analytics, the one-click deployment. That&apos;s the gap Arkenos fills.
              </Paragraph>

              <Paragraph>
                Arkenos is an open-source platform layer on top of these frameworks.
                You get the same managed-platform experience &mdash; dashboard, agent config,
                call logs, analytics &mdash; but the platform fee is $0. You bring your own
                provider keys and pay only raw API costs.
              </Paragraph>

              <ComparisonTable
                headers={["", "Vapi", "Retell", "Arkenos"]}
                rows={[
                  ["Platform fee", "$0.05/min", "$0.055/min", "$0 (open source)"],
                  ["Dashboard", "Yes", "Yes", "Yes"],
                  ["Agent builder", "Yes", "Yes", "Yes"],
                  ["Self-hostable", "No", "No", "Yes"],
                  ["Provider choice", "Limited", "Limited", "Any"],
                  ["HIPAA add-on", "$1,000/mo", "Enterprise only", "Self-hosted (free)"],
                  ["Data stays on your infra", "No", "No", "Yes"],
                ]}
              />

              <Paragraph>
                At 10,000 minutes/month with a mid-range stack, the cost comparison is:
              </Paragraph>

              <ComparisonTable
                headers={["Platform", "Monthly cost", "Effective $/min"]}
                rows={[
                  ["Arkenos (self-hosted)", "$150–$450", "$0.015–$0.045"],
                  ["Retell", "$700–$1,300", "$0.07–$0.13"],
                  ["Vapi", "$1,400–$2,600", "$0.14–$0.26"],
                ]}
              />

              {/* ── Section 8: Sources ───────────────────────────────────────── */}
              <SectionHeading>Sources</SectionHeading>

              <Paragraph>
                Every number in this article comes from official pricing pages or documented
                independent analyses. Key sources:
              </Paragraph>

              <ul className="text-sm text-muted-foreground space-y-1.5 mb-8 ml-2">
                <li>&bull; Deepgram pricing &mdash; deepgram.com/pricing</li>
                <li>&bull; AssemblyAI pricing &mdash; assemblyai.com/pricing</li>
                <li>&bull; Google Cloud STT pricing &mdash; cloud.google.com/speech-to-text/pricing</li>
                <li>&bull; Google Cloud TTS pricing &mdash; cloud.google.com/text-to-speech/pricing</li>
                <li>&bull; OpenAI API pricing &mdash; openai.com/api/pricing</li>
                <li>&bull; Gemini API pricing &mdash; ai.google.dev/gemini-api/docs/pricing</li>
                <li>&bull; Claude API pricing &mdash; platform.claude.com/docs/en/about-claude/pricing</li>
                <li>&bull; ElevenLabs pricing &mdash; elevenlabs.io/pricing</li>
                <li>&bull; Amazon Polly pricing &mdash; aws.amazon.com/polly/pricing</li>
                <li>&bull; Twilio voice pricing &mdash; twilio.com/en-us/voice/pricing/us</li>
                <li>&bull; Vapi pricing &mdash; vapi.ai/pricing</li>
                <li>&bull; Retell pricing &mdash; retellai.com/pricing</li>
                <li>&bull; Vapi pricing breakdown (Dograh) &mdash; blog.dograh.com</li>
                <li>&bull; Self-hosted vs Vapi TCO (Dograh) &mdash; blog.dograh.com</li>
                <li>&bull; Vapi pricing analysis (Synthflow) &mdash; synthflow.ai/blog/vapi-ai-pricing</li>
                <li>&bull; Retell cost breakdown &mdash; retellai.com/resources/outbound-ai-caller-cost-breakdown</li>
                <li>&bull; HN discussion &mdash; news.ycombinator.com/item?id=45884165</li>
              </ul>

              {/* ── CTA ─────────────────────────────────────────────────────── */}
              <div className="border-t pt-12 mt-12">
                <p className="text-lg font-semibold mb-2">
                  Stop paying the platform tax.
                </p>
                <p className="text-muted-foreground mb-6">
                  Arkenos gives you the dashboard and agent builder without the per-minute markup.
                  Open source, self-hosted, $0 platform fee.
                </p>
                <div className="flex gap-3">
                  <Link href="https://github.com/Arkenos-World/Arkenos" target="_blank">
                    <Button variant="outline">GitHub</Button>
                  </Link>
                  <Link href="https://arkenos.mintlify.app/">
                    <Button>Read the docs</Button>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
