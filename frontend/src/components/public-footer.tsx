"use client";

import Link from "next/link";
import { NenyaxLogo } from "@/components/ui/nenyax-logo";
import { motion } from "framer-motion";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const FOOTER_LINKS = {
  Platform: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Agents", href: "/dashboard/agents" },
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "API Keys", href: "/dashboard/keys" },
  ],
  Resources: [
    { label: "Documentation", href: "https://nenyax.mintlify.app", external: true },
    { label: "API Reference", href: "https://nenyax.mintlify.app", external: true },
    { label: "GitHub", href: "https://github.com/Nenyax-AI/Nenyax", external: true },
    { label: "Self-Hosting", href: "https://nenyax.mintlify.app", external: true },
  ],
  Company: [
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Open Source", href: "https://github.com/Nenyax-AI/Nenyax", external: true },
    { label: "Careers", href: "/careers" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="bg-white dark:bg-[#0C0C0C] border-t border-black/5 dark:border-white/[0.06] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-12 mb-20">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-3 pr-8">
            <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
              <NenyaxLogo className="h-5" />
            </Link>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm leading-relaxed">
              The open-source orchestration layer for building and managing production-grade conversational AI.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Nenyax-AI/Nenyax"
                className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-black/5 dark:border-white/[0.06] flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm transition-all hover:-translate-y-0.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className="col-span-1 lg:col-span-1">
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-5">{title}</p>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors inline-block"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors inline-block"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/5 dark:border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
              &copy; {new Date().getFullYear()} Nenyax. AGPL-3.0 Licensed.
            </p>
            <div className="flex items-center gap-6 text-[13px] text-zinc-500 dark:text-zinc-400">
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Security</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/[0.06] shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400">All systems normal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
