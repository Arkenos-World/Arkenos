"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CtaSection({ setAuthOpen }: { setAuthOpen: (b: boolean) => void }) {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-stone-50 border border-black/5 p-12 md:p-24 flex flex-col items-center text-center">
          
          {/* Ambient Background Accents */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] -translate-y-1/2 translate-x-1/3 bg-stone-200/50 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] translate-y-1/3 -translate-x-1/3 bg-stone-200/50 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Status Badge */}
          <div className="relative z-10 mb-10 inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-1.5 text-sm font-medium border border-black/5 shadow-sm text-zinc-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900"></span>
            </span>
            Ready to deploy
          </div>

          {/* Core Content */}
          <h2 className="relative z-10 text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight mb-12 max-w-3xl leading-[1.1] text-zinc-900">
            Start building with the most flexible voice infrastructure.
          </h2>
          
          {/* Actions */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
            <Button 
              size="lg" 
              className="rounded-full px-10 h-14 text-base bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors shadow-sm" 
              onClick={() => setAuthOpen(true)}
            >
              Sign up
            </Button>
            <Link 
              href="#" 
              className="group inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium text-base transition-colors"
            >
              Talk to Sales
              <svg 
                className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
