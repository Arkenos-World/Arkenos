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

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function WhyOpenSourceBlogPost() {
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
                <Badge variant="outline">Philosophy</Badge>
                <span className="text-sm text-muted-foreground">10 min read</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
              >
                Why We&apos;re Building Arkenos Open Source
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg text-muted-foreground mb-4"
              >
                89% of enterprises already use open-source AI. Voice AI is the last
                holdout &mdash; still dominated by closed platforms with opaque pricing
                and zero data portability. We think that has to change.
              </motion.p>

              <motion.p variants={fadeUp} className="text-sm text-muted-foreground">
                Feb 28, 2026
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <section>
          <div className="container mx-auto px-4 py-12 lg:py-16 max-w-2xl">

            <Paragraph>
              Every other layer of the AI stack has gone open source. Hugging Face hosts
              2 million+ public models. LangChain has 70,000+ GitHub stars. Meta open-sourced
              Llama. The Linux Foundation reports that 89% of organizations using AI already
              leverage open-source models in some form.
            </Paragraph>

            <Paragraph>
              But voice AI? Still locked behind proprietary platforms. Your agent configs
              live on someone else&apos;s servers. Your call data trains someone else&apos;s
              models. Your bill goes up 20&ndash;30% at renewal because switching costs
              make it too painful to leave.
            </Paragraph>

            <Paragraph>
              We started Arkenos because we think voice AI deserves the same open-source
              revolution that hit every other part of the stack. Here&apos;s why.
            </Paragraph>

            {/* ── Section 1: Lock-in ───────────────────────────────────────── */}
            <SectionHeading>The lock-in problem is real</SectionHeading>

            <Paragraph>
              Voice AI platforms create lock-in at every layer. Not through technical
              superiority, but through proprietary formats and data policies that make
              switching expensive.
            </Paragraph>

            <SubHeading>What you can&apos;t take with you</SubHeading>

            <ComparisonTable
              headers={["Asset", "Portable?"]}
              rows={[
                ["System prompts", "Partially — voice-tuned prompts need rebuilding"],
                ["Call flows / workflows", "No — platform-specific visual builders"],
                ["Function calling schemas", "No — Vapi, Retell, OpenAI all use different formats"],
                ["Conversation logs", "Limited export, platform-specific formats"],
                ["Phone numbers", "Yes — but 7–30 day porting process with LOA"],
                ["Voice clones", "No — tied to specific inference engines"],
                ["Agent configuration", "No — Vapi JSON ≠ Retell JSON, no standard"],
                ["Analytics / call data", "No — siloed in platform dashboards"],
              ]}
            />

            <Callout>
              &ldquo;Voice models are uniquely fragile: trained on proprietary stacks, tied to
              specific inference engines, and often encrypted at rest. Migrating a voice
              clone isn&apos;t a weekend project.&rdquo;
            </Callout>

            <SubHeading>Data policies that should worry you</SubHeading>

            <Paragraph>
              Vapi&apos;s Terms of Service state that they may use customer data &ldquo;to
              provide, maintain, and improve our Services, including for training our models
              and algorithms.&rdquo; Unless you explicitly opt out, your call data is
              training their models.
            </Paragraph>

            <Paragraph>
              Retell&apos;s default behavior records all calls. Opting out is not automatic.
              Their terms also include a non-compete clause: &ldquo;Customer shall not use
              AI-generated voices or content produced by the Services to train, improve, or
              develop models or services that compete with Retell AI.&rdquo; Your own call
              data can&apos;t be used to build an alternative.
            </Paragraph>

            <Paragraph>
              A developer on Vapi&apos;s own community forum documented five contradictions
              in their data policies: the ToS says one thing about call data retention,
              support says another, and the HIPAA docs say a third. When your compliance
              depends on the platform, that&apos;s not a minor issue.
            </Paragraph>

            <SubHeading>Real community voices</SubHeading>

            <Paragraph>
              From a Hacker News thread titled &ldquo;Is there an open source alternative
              for Vapi or Retell?&rdquo;:
            </Paragraph>

            <Callout>
              &ldquo;60&ndash;70% of our total spend was the Vapi platform fee, and only 30&ndash;40%
              was actual LLM/STT/TTS usage. Once you need data controls, privacy or
              self/offline deployment, you end up stuck.&rdquo;
              &mdash; news.ycombinator.com/item?id=45884165
            </Callout>

            <Callout>
              &ldquo;At $0.10 per minute it would cost significantly more than our existing
              TTS and STT solution&rdquo; &mdash; their existing cost was ~$0.01/min, making
              Retell a 10x increase. (news.ycombinator.com/item?id=39453402)
            </Callout>

            <Paragraph>
              Vapi&apos;s Trustpilot page tells a similar story: 2.3 out of 5 stars, with
              83% one-star reviews. Common complaints include unexplained billing spikes,
              features that don&apos;t work as documented, and support response times measured
              in days. One reviewer reported $50,000 in damages from downtime caused by
              platform bugs.
            </Paragraph>

            {/* ── Section 2: Open Source AI ─────────────────────────────────── */}
            <SectionHeading>The rest of AI already went open source</SectionHeading>

            <Paragraph>
              The data is unambiguous. Open-source AI isn&apos;t an alternative &mdash;
              it&apos;s the default.
            </Paragraph>

            <ComparisonTable
              headers={["Metric", "Number", "Source"]}
              rows={[
                ["Enterprises using open-source AI", "89%", "Linux Foundation / Meta (2025)"],
                ["Open-source as primary AI component", "63%", "McKinsey State of AI (2025)"],
                ["Open-source AI achieving positive ROI", "51% vs 41% proprietary", "Linux Foundation"],
                ["Cost reduction vs proprietary", "Up to 86%", "Linux Foundation"],
                ["Hugging Face monthly downloads", "113.5 million", "Hugging Face blog"],
                ["Hugging Face public models hosted", "2 million+", "Hugging Face"],
                ["Open-source AI market (2024)", "$13.4 billion", "Market.us"],
                ["Open-source AI market (2034 projected)", "$54.7 billion", "Market.us (15.1% CAGR)"],
              ]}
            />

            <Paragraph>
              Gartner predicts 40% of enterprise apps will feature task-specific AI agents
              by 2026, up from less than 5% in 2025. Forrester&apos;s 2026 predictions
              specifically note that vendors adopting open-source standards for AI agent
              collaboration will see higher enterprise adoption.
            </Paragraph>

            <Paragraph>
              The voice AI agent market specifically is projected to grow from $2.4 billion
              in 2024 to $47.5 billion by 2034 &mdash; a 34.8% CAGR, per Market.us. That&apos;s
              the fastest-growing segment within conversational AI. The question isn&apos;t
              whether this market goes open source. It&apos;s when.
            </Paragraph>

            {/* ── Section 3: The Missing Layer ─────────────────────────────── */}
            <SectionHeading>The missing layer in open-source voice AI</SectionHeading>

            <Paragraph>
              Open-source voice AI frameworks already exist. Pipecat (by Daily.co) has 5,000+
              GitHub stars and supports 40+ AI service integrations. LiveKit Agents has 9,200+
              stars and full self-hosting support. Both are excellent at what they do.
            </Paragraph>

            <Paragraph>
              What they don&apos;t do is give you a platform. No dashboard. No agent builder.
              No call analytics. No one-click deployment. You get a Python framework and a
              lot of DIY assembly.
            </Paragraph>

            <Paragraph>
              That&apos;s the gap. Managed platforms like Vapi and Retell fill it with
              proprietary dashboards and per-minute fees. The open-source ecosystem has the
              plumbing but not the product.
            </Paragraph>

            <Paragraph>
              Arkenos is that product layer. An open-source platform that gives you the
              managed-platform experience &mdash; dashboard, agent configuration, call logs,
              analytics, API keys &mdash; on top of open-source infrastructure. You self-host
              it. You own your data. The platform fee is $0.
            </Paragraph>

            {/* ── Section 4: Why AGPL ──────────────────────────────────────── */}
            <SectionHeading>Why AGPL-3.0</SectionHeading>

            <Paragraph>
              We chose the GNU Affero General Public License (AGPL-3.0) deliberately. Here&apos;s
              why, and what it means for you.
            </Paragraph>

            <Paragraph>
              The MIT and Apache licenses have a cloud loophole: a company can take your
              open-source code, run it as a hosted service, and never contribute a single
              line back. The AGPL closes this. If you modify Arkenos and run it as a network
              service, you must release your modifications as open source.
            </Paragraph>

            <Paragraph>
              This isn&apos;t theoretical. It&apos;s exactly what happened to multiple
              open-source projects:
            </Paragraph>

            <ComparisonTable
              headers={["Project", "Original License", "What happened", "Outcome"]}
              rows={[
                ["Elasticsearch", "Apache 2.0", "AWS launched managed service, contributed nothing", "Switched to SSPL (not OSI-approved)"],
                ["MongoDB", "AGPL → SSPL", "AWS built DocumentDB anyway", "Dropped from Debian, Red Hat, Fedora"],
                ["Grafana", "Apache 2.0 → AGPL", "Cloud vendors strip-mining the project", "Successfully protected while staying OSI-approved"],
                ["Nextcloud", "AGPL from day one", "No cloud parasitism", "Healthy ecosystem, enterprise adoption"],
              ]}
            />

            <Paragraph>
              Grafana Labs switched from Apache 2.0 to AGPL in April 2021, specifically
              because cloud vendors were &ldquo;strip-mining&rdquo; their project &mdash;
              building commercial services on top without contributing back. Their CEO
              explained that AGPL was chosen over SSPL because it&apos;s OSI-approved:
              enterprise legal teams accept it, Linux distributions include it, and it
              remains a legitimate open-source license.
            </Paragraph>

            <Paragraph>
              MongoDB&apos;s SSPL is the cautionary tale. It&apos;s more restrictive than
              AGPL but isn&apos;t recognized by the Open Source Initiative. Debian, Red Hat,
              and Fedora all dropped MongoDB from their distributions. AWS built DocumentDB
              anyway. More restriction didn&apos;t equal more protection.
            </Paragraph>

            <SubHeading>What AGPL means for you</SubHeading>

            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 ml-2">
              <li><strong>Self-hosting for your company:</strong> Fully allowed. No restrictions.</li>
              <li><strong>Modifying for internal use:</strong> Fully allowed. No obligation to share.</li>
              <li><strong>Building a product on top:</strong> Allowed &mdash; your product code doesn&apos;t need to be AGPL unless it modifies Arkenos core.</li>
              <li><strong>Running a hosted service with modifications:</strong> You must open-source your modifications to Arkenos itself.</li>
              <li><strong>Commercial use:</strong> Fully allowed. AGPL is not &ldquo;non-commercial.&rdquo;</li>
            </ul>

            <Paragraph>
              In short: AGPL protects the commons without restricting your ability to build
              on it. It prevents cloud vendors from taking the project private while keeping
              the door open for enterprise adoption.
            </Paragraph>

            {/* ── Section 5: Compliance ─────────────────────────────────────── */}
            <SectionHeading>Self-hosting isn&apos;t optional for regulated industries</SectionHeading>

            <Paragraph>
              For many industries, the choice between managed and self-hosted isn&apos;t about
              cost. It&apos;s about compliance.
            </Paragraph>

            <SubHeading>Healthcare (HIPAA)</SubHeading>

            <Paragraph>
              HIPAA requires a Business Associate Agreement (BAA) for any third party handling
              Protected Health Information. Voice recordings containing patient data are PHI.
              HHS OCR proposed the first major HIPAA Security Rule update in 20 years in
              January 2025, removing the distinction between &ldquo;required&rdquo; and
              &ldquo;addressable&rdquo; safeguards and introducing stricter encryption requirements.
            </Paragraph>

            <Paragraph>
              Vapi charges $1,000/month for HIPAA compliance &mdash; and a developer found
              documented contradictions between their ToS, support responses, and public
              HIPAA docs about what data is actually retained. Self-hosting eliminates both
              the fee and the ambiguity: you control exactly where PHI lives.
            </Paragraph>

            <Paragraph>
              The healthcare voice AI market alone was $468 million in 2024, projected to
              reach $3.175 billion by 2030 (Grand View Research). That&apos;s a massive
              market that cloud-only platforms are structurally unable to serve well.
            </Paragraph>

            <SubHeading>EU / GDPR</SubHeading>

            <Paragraph>
              GDPR classifies voice data as potentially biometric personal data under
              Article 9 &mdash; a special category requiring explicit consent and elevated
              protections. EU-resident voice data flowing through US-hosted platforms creates
              immediate compliance risk.
            </Paragraph>

            <Paragraph>
              The EU Data Act, effective September 2025, extends sovereignty requirements
              further. And as Telnyx noted in their infrastructure analysis: &ldquo;GDPR
              compliance for voice AI is not solved by hosting models in Europe alone.
              Infrastructure determines whether voice data truly stays EU-resident.&rdquo;
            </Paragraph>

            <SubHeading>The broader trend</SubHeading>

            <Paragraph>
              83% of CIOs plan to repatriate at least some AI workloads on-premise, according
              to Gartner (cited by Speechmatics). Iron Software reported a 300% surge in
              demand for perpetual, air-gapped AI solutions in 2025. 69% of organizations
              cite AI-powered data leaks as their top security concern.
            </Paragraph>

            <Paragraph>
              GDPR/HIPAA/SOC 2 compliance for cloud-hosted AI deployments adds $8,000&ndash;$25,000
              in audit, tooling, and legal overhead. Self-hosting eliminates most of this
              structurally.
            </Paragraph>

            {/* ── Section 6: What We're Building ───────────────────────────── */}
            <SectionHeading>What we&apos;re building</SectionHeading>

            <Paragraph>
              Arkenos is an open-source voice AI platform. Not a framework &mdash; a platform.
              The distinction matters.
            </Paragraph>

            <ComparisonTable
              headers={["", "Frameworks (Pipecat, LiveKit)", "Platforms (Vapi, Retell)", "Arkenos"]}
              rows={[
                ["Dashboard", "No", "Yes", "Yes"],
                ["Agent builder", "No", "Yes", "Yes"],
                ["Call analytics", "No", "Yes", "Yes"],
                ["Self-hostable", "Yes", "No", "Yes"],
                ["Open source", "Yes", "No", "Yes"],
                ["Provider lock-in", "None", "High", "None"],
                ["Platform fee", "$0", "$0.05–$0.07/min", "$0"],
                ["Data ownership", "Full", "Partial", "Full"],
              ]}
            />

            <Paragraph>
              We sit in the gap between raw frameworks and closed platforms. Open-source
              frameworks give you freedom but not productivity. Closed platforms give you
              productivity but not freedom. Arkenos gives you both.
            </Paragraph>

            <Paragraph>
              The voice AI market is projected to reach $47.5 billion by 2034. We believe
              the platform layer of that market should be open &mdash; just like databases
              (PostgreSQL), observability (Grafana), and application frameworks (Next.js)
              before it.
            </Paragraph>

            {/* ── Section 7: Sources ───────────────────────────────────────── */}
            <SectionHeading>Sources</SectionHeading>

            <ul className="text-sm text-muted-foreground space-y-1.5 mb-8 ml-2">
              <li>&bull; Linux Foundation / Meta &mdash; &ldquo;Economic and Workforce Impacts of Open Source AI&rdquo; (2025)</li>
              <li>&bull; McKinsey &mdash; State of AI 2025</li>
              <li>&bull; Canonical &mdash; State of Global Open Source 2025</li>
              <li>&bull; Market.us &mdash; Voice AI Agents Market Report</li>
              <li>&bull; Market.us &mdash; Open-Source AI Model Market Report</li>
              <li>&bull; Grand View Research &mdash; AI Voice Agents Healthcare Market Report</li>
              <li>&bull; Gartner &mdash; Enterprise Apps AI Agents Prediction (August 2025)</li>
              <li>&bull; Forrester &mdash; Predictions 2026: AI Agents and Enterprise Software</li>
              <li>&bull; Hugging Face &mdash; huggingface_hub v1.0 blog post</li>
              <li>&bull; Grafana Labs &mdash; Relicensing to AGPLv3 (April 2021)</li>
              <li>&bull; Nextcloud &mdash; &ldquo;Why the AGPL is Great for Business Users&rdquo;</li>
              <li>&bull; Telnyx &mdash; GDPR Voice AI Infrastructure Analysis</li>
              <li>&bull; Speechmatics &mdash; &ldquo;The Return of On-Prem&rdquo;</li>
              <li>&bull; Iron Software / PRNewswire &mdash; Data Sovereignty Revolution (2025)</li>
              <li>&bull; Vapi Trustpilot &mdash; trustpilot.com/review/vapi.ai</li>
              <li>&bull; HN thread &mdash; news.ycombinator.com/item?id=45884165</li>
              <li>&bull; HN thread &mdash; news.ycombinator.com/item?id=39453402</li>
              <li>&bull; Vapi community forums &mdash; data policy contradictions thread</li>
              <li>&bull; SigmaMind &mdash; Vapi and Retell ToS analysis</li>
            </ul>

            {/* ── CTA ─────────────────────────────────────────────────────── */}
            <div className="border-t pt-12 mt-12">
              <p className="text-lg font-semibold mb-2">
                Voice AI should be open.
              </p>
              <p className="text-muted-foreground mb-6">
                Arkenos is open-source, self-hosted, and free. Star us on GitHub or
                read the docs to get started.
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
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
