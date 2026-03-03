"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

// ─── Animation Variants ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Blog Posts ─────────────────────────────────────────────────────────────────

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readTime: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "hidden-cost-voice-ai",
    title: "The Hidden Cost of Voice AI Platforms",
    description:
      "Vapi advertises $0.05/min. Retell says $0.07/min. Your actual bill? Multiply by 3–5x. We break down the real math with every number sourced.",
    date: "Mar 1, 2026",
    category: "Pricing",
    readTime: "14 min read",
  },
  {
    slug: "why-open-source",
    title: "Why We're Building Arkenos Open Source",
    description:
      "89% of enterprises use open-source AI. Voice AI is the last holdout. Here's why we chose AGPL-3.0 and what it means for the industry.",
    date: "Feb 28, 2026",
    category: "Philosophy",
    readTime: "10 min read",
  },
  {
    slug: "voice-ai-landscape-2026",
    title: "Voice AI in 2026: Vapi vs Retell vs Open Source",
    description:
      "A deep comparison of the voice AI landscape — pricing, latency, features, and lock-in. Where proprietary platforms fall short and where open source wins.",
    date: "Feb 15, 2026",
    category: "Analysis",
    readTime: "12 min read",
  },
];

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <section className="border-b">
          <div className="container mx-auto px-4 pt-20 pb-12 lg:pt-28 lg:pb-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-2xl"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">Blog</Badge>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                Blog
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg text-muted-foreground">
                Latest updates, tutorials, and insights from the Arkenos team.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── Posts Grid ──────────────────────────────────────────────────── */}
        <section>
          <div className="container mx-auto px-4 py-12 lg:py-16">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
              {BLOG_POSTS.map((post, i) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="block border bg-card p-6 h-full hover:border-foreground/20 transition-colors group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {post.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{post.date}</p>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
