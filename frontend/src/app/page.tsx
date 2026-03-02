"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

const AbstractBall = dynamic(() => import("@/components/ui/abstract-ball"), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-muted/20 rounded-full" />,
});

// ─── Icons ─────────────────────────────────────────────────────────────────────

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

function CodeBracketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
    </svg>
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isInView, target]);

  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

// ─── Typing Terminal ───────────────────────────────────────────────────────────

const TERMINAL_LINES = [
  { content: "git clone https://github.com/voxarena/voxarena", isCommand: true },
  { content: "docker compose up -d", isCommand: true },
  { content: "All services running on localhost:3000", isCommand: false },
];

function TypingTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timers = TERMINAL_LINES.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 500 + i * 800)
    );
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  return (
    <div ref={ref} className="p-4 rounded-lg bg-zinc-950 text-zinc-300 font-mono text-sm border border-zinc-800 overflow-x-auto min-h-[100px]">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
        <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
      </div>
      {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={!line.isCommand ? "text-zinc-500 mt-1" : ""}
        >
          <span className="text-emerald-400">{line.isCommand ? "$ " : ""}</span>
          {line.content}
        </motion.p>
      ))}
      {visibleLines < TERMINAL_LINES.length && (
        <p>
          <span className="text-emerald-400">$ </span>
          <span className="inline-block w-2 h-4 bg-emerald-400 align-middle animate-pulse" />
        </p>
      )}
    </div>
  );
}

// ─── 3D Tilt Card ──────────────────────────────────────────────────────────────

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  function handleMouseLeave() {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
  }

  return (
    <div
      ref={ref}
      className={`transition-transform duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

// ─── Orbit Dots (around Abstract Ball) ─────────────────────────────────────────

function OrbitDots() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[
        { size: "80%", duration: 20, dotSize: 6, opacity: 0.3 },
        { size: "95%", duration: 28, dotSize: 4, opacity: 0.2 },
        { size: "65%", duration: 35, dotSize: 5, opacity: 0.25 },
      ].map((orbit, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: orbit.size, height: orbit.size }}
        >
          <div
            className="absolute inset-0"
            style={{
              animation: `spin ${orbit.duration}s linear infinite`,
              animationDelay: `${i * 3}s`,
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              style={{ width: orbit.dotSize, height: orbit.dotSize, opacity: orbit.opacity }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Mini Waveform (for pipeline illustrations) ────────────────────────────────

function MiniWaveform({ seedOffset = 0 }: { seedOffset?: number }) {
  return (
    <div className="flex items-end gap-[2px] h-5">
      {[8, 14, 10, 18, 12, 16, 8, 14].map((h, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full bg-primary/40 origin-bottom h-full"
          style={{
            "--wave-scale": (h / 18).toFixed(4),
            animationName: "waveform-bar",
            animationDuration: `${(0.8 + seededRandom(i + seedOffset) * 0.5).toFixed(4)}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${(i * 0.07).toFixed(4)}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Waveform (full-size, CSS-animated) ────────────────────────────────────────

function Waveform() {
  const bars = 40;
  return (
    <div className="flex items-end justify-center gap-[2px] h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const scale = 0.3 + Math.sin(i * 0.4) * 0.25 + seededRandom(i) * 0.35;
        return (
          <div
            key={i}
            className="w-[3px] h-full rounded-full bg-gradient-to-t from-primary/30 to-primary origin-bottom"
            style={{
              "--wave-scale": scale.toFixed(4),
              animationName: "waveform-bar",
              animationDuration: `${(1 + seededRandom(i + 100) * 0.8).toFixed(4)}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: `${(i * 0.04).toFixed(4)}s`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// ─── Animation Variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const fadeUpScale = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MicrophoneIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">VoxArena</span>
          </div>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign In</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm">Get Started</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <div suppressHydrationWarning>
                <UserButton />
              </div>
            </SignedIn>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative overflow-x-clip overflow-y-visible">
          {/* Background glow */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none bg-primary/5 blur-[120px] rounded-full" />

          <div className="container mx-auto px-4 pt-20 pb-16 lg:pt-28 lg:pb-24 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left: Content */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={stagger}
                className="text-center lg:text-left"
              >
                {/* Badge with pulse ring */}
                <motion.div variants={fadeUp} className="inline-block mb-6">
                  <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium">
                    Open Source Voice AI Platform
                  </Badge>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
                >
                  Build Voice Agents{" "}
                  <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
                    That Actually Work
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="max-w-xl mx-auto lg:mx-0 text-lg sm:text-xl text-muted-foreground mb-10"
                >
                  The open-source platform to create, deploy, and manage production voice AI agents. Self-hosted. Model-agnostic. Ready in minutes.
                </motion.p>

                <motion.div
                  variants={fadeUp}
                  className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
                >
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button size="lg" className="gap-2 h-12 px-8 text-base">
                        Start Building Free
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard">
                      <Button size="lg" className="gap-2 h-12 px-8 text-base">
                        Go to Dashboard
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </SignedIn>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-8 text-base" asChild>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      <GithubIcon className="h-5 w-5" />
                      Star on GitHub
                    </a>
                  </Button>
                </motion.div>

                {/* Floating tech stack badges */}
                <motion.div
                  variants={fadeUp}
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-10"
                >
                  <span className="text-xs text-muted-foreground mr-1">Powered by</span>
                  {["LiveKit", "Gemini", "AssemblyAI", "Resemble AI"].map((name, i) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                    >
                      <Badge variant="secondary" className="text-xs font-normal">
                        {name}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right: Abstract Ball + Orbit Dots */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="relative h-[350px] sm:h-[400px] lg:h-[520px] order-first lg:order-last"
              >
                <OrbitDots />
                <AbstractBall
                  spherePoints={true}
                  spherePsize={1.5}
                  perlinTime={12}
                  perlinMorph={8}
                  perlinDNoise={2.0}
                  chromaRGBr={6}
                  chromaRGBg={6}
                  chromaRGBb={7}
                  chromaRGBn={1}
                  chromaRGBm={1}
                  cameraSpeedY={0.5}
                  cameraSpeedX={0.2}
                  cameraZoom={175}
                  interactive={true}
                />
                {/* Subtle glow behind ball */}
                <div className="absolute inset-0 -z-10 bg-primary/5 blur-[80px] rounded-full scale-75" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Pipeline ───────────────────────────────────────────────────── */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">How It Works</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Three stages. One pipeline.
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Voice flows through three intelligent stages — each powered by the model of your choice.
              </motion.p>
            </motion.div>

            {/* Pipeline cards with mini-illustrations */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
              className="grid md:grid-cols-3 gap-px max-w-5xl mx-auto bg-border rounded-lg overflow-hidden"
            >
              {/* STT Card */}
              <motion.div variants={fadeUpScale} className="bg-card p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MicrophoneIcon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary tracking-widest">STEP 01</span>
                    <h3 className="text-xl font-bold">Speech to Text</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time audio capture with voice activity detection. Converts speech to text using AssemblyAI, Deepgram, or any STT provider.
                </p>
                {/* Mini illustration: waveform → text */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50">
                  <MiniWaveform seedOffset={200} />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRightIcon className="h-3 w-3 text-primary/50" />
                  </motion.div>
                  <span className="text-xs font-mono text-primary/60 px-1.5 py-0.5 bg-primary/5 rounded">abc</span>
                </div>
              </motion.div>

              {/* LLM Card */}
              <motion.div variants={fadeUpScale} className="bg-card p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BrainIcon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary tracking-widest">STEP 02</span>
                    <h3 className="text-xl font-bold">LLM Processing</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Context-aware AI responses powered by Gemini, GPT, Claude, or any LLM. Function calling for real-world actions.
                </p>
                {/* Mini illustration: input → brain → output */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50">
                  <span className="text-xs font-mono text-primary/60 px-1.5 py-0.5 bg-primary/5 rounded">in</span>
                  <ArrowRightIcon className="h-3 w-3 text-primary/30" />
                  <div className="relative">
                    <BrainIcon className="h-6 w-6 text-primary/40" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary/60 animate-ping" />
                  </div>
                  <ArrowRightIcon className="h-3 w-3 text-primary/30" />
                  <span className="text-xs font-mono text-primary/60 px-1.5 py-0.5 bg-primary/5 rounded">out</span>
                </div>
              </motion.div>

              {/* TTS Card */}
              <motion.div variants={fadeUpScale} className="bg-card p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <SpeakerIcon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary tracking-widest">STEP 03</span>
                    <h3 className="text-xl font-bold">Text to Speech</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ultra-low latency voice synthesis with Resemble AI, ElevenLabs, or any TTS engine. Natural, human-like output.
                </p>
                {/* Mini illustration: text → waveform */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50">
                  <span className="text-xs font-mono text-primary/60 px-1.5 py-0.5 bg-primary/5 rounded">abc</span>
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <ArrowRightIcon className="h-3 w-3 text-primary/50" />
                  </motion.div>
                  <MiniWaveform seedOffset={300} />
                </div>
              </motion.div>
            </motion.div>

            {/* Animated flow pill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-12 flex justify-center"
            >
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border bg-card text-sm shadow-sm">
                <MicrophoneIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">Voice In</span>
                {["STT", "LLM", "TTS"].map((label, i) => (
                  <span key={label} className="contents">
                    <motion.div
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                    >
                      <ArrowRightIcon className="h-3 w-3 text-primary" />
                    </motion.div>
                    <span className="text-muted-foreground">{label}</span>
                  </span>
                ))}
                <motion.div
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.2, ease: "easeInOut" }}
                >
                  <ArrowRightIcon className="h-3 w-3 text-primary" />
                </motion.div>
                <SpeakerIcon className="h-4 w-4 text-primary" />
                <span className="font-medium">Voice Out</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Bento Features ─────────────────────────────────────────────── */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-24">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="text-center mb-16"
            >
              <motion.div variants={fadeUp}>
                <Badge variant="outline" className="mb-4">Features</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Everything you need
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
                A complete platform for building production voice AI applications.
              </motion.p>
            </motion.div>

            {/* Bento grid with TiltCard + animated borders */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
            >
              {/* Open Source — spans 2 cols, animated gradient border */}
              <motion.div variants={fadeUpScale} className="sm:col-span-2">
                <TiltCard>
                  <div className="relative group">
                    <div
                      className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(90deg, var(--foreground), var(--muted-foreground), var(--foreground))",
                        backgroundSize: "200% 100%",
                        animation: "gradient-x 3s ease infinite",
                      }}
                    />
                    <div className="relative h-full p-8 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-6">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CodeBracketIcon className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary">MIT License</Badge>
                      </div>
                      <h3 className="text-2xl font-bold mb-2">100% Open Source</h3>
                      <p className="text-muted-foreground mb-6">
                        Self-host on your own infrastructure. Full control over your data, models, and deployment.
                      </p>
                      <TypingTerminal />
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Real-time */}
              <motion.div variants={fadeUpScale}>
                <TiltCard className="h-full">
                  <div className="h-full p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors flex flex-col">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                      <BoltIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Real-time</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Sub-500ms voice-to-voice latency powered by LiveKit WebRTC.
                    </p>
                    <div className="mt-auto">
                      <div className="text-5xl font-bold text-primary">
                        <AnimatedCounter target={500} prefix="<" suffix="ms" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">end-to-end latency</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Model Agnostic */}
              <motion.div variants={fadeUpScale}>
                <TiltCard className="h-full">
                  <div className="h-full p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors flex flex-col">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                      <GlobeIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Model Agnostic</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Swap any STT, LLM, or TTS provider. Zero vendor lock-in.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {["Gemini", "AssemblyAI", "Resemble", "Deepgram", "ElevenLabs", "GPT-4o"].map((m, i) => (
                        <motion.div
                          key={m}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                        >
                          <Badge variant="outline" className="text-xs font-normal">
                            {m}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Full Dashboard — spans 2 cols, animated gradient border */}
              <motion.div variants={fadeUpScale} className="sm:col-span-2">
                <TiltCard>
                  <div className="relative group">
                    <div
                      className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(90deg, var(--foreground), var(--muted-foreground), var(--foreground))",
                        backgroundSize: "200% 100%",
                        animation: "gradient-x 3s ease infinite",
                      }}
                    />
                    <div className="relative h-full p-8 rounded-lg border bg-card">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                        <ChartBarIcon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Full Management Dashboard</h3>
                      <p className="text-muted-foreground mb-6">
                        Create agents, monitor calls, analyze conversations, track costs — all from one place.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Agent Builder", desc: "Create & configure" },
                          { label: "Call Logs", desc: "Full transcripts" },
                          { label: "Analytics", desc: "Sentiment & topics" },
                          { label: "Cost Tracking", desc: "Per-call breakdown" },
                        ].map((item, i) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="p-3 rounded-lg bg-muted/50 border text-center hover:bg-muted/80 transition-colors"
                          >
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Security */}
              <motion.div variants={fadeUpScale}>
                <TiltCard className="h-full">
                  <div className="h-full p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                      <ShieldCheckIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Secure by Default</h3>
                    <p className="text-sm text-muted-foreground">
                      Auth via Clerk, encrypted connections, no data leaves your servers. Your conversations stay private.
                    </p>
                    {/* Lock animation */}
                    <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ShieldCheckIcon className="h-5 w-5 text-chart-2/60" />
                      </motion.div>
                      <span className="text-xs text-chart-2/60 font-medium">End-to-end encrypted</span>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Telephony */}
              <motion.div variants={fadeUpScale}>
                <TiltCard className="h-full">
                  <div className="h-full p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                      <CpuIcon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">SIP Telephony</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect real phone numbers via Twilio SIP trunking. Your AI agents can answer actual phone calls.
                    </p>
                    {/* Phone ring animation */}
                    <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                      >
                        <CpuIcon className="h-5 w-5 text-primary/50" />
                      </motion.div>
                      <span className="text-xs text-muted-foreground font-mono">+1 (555) 0XX-XXXX</span>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>

              {/* Waveform card — full width */}
              <motion.div variants={fadeUpScale} className="sm:col-span-2 lg:col-span-3">
                <div className="p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl font-bold mb-2">Live Voice Pipeline</h3>
                      <p className="text-sm text-muted-foreground">
                        Real-time audio streaming with voice activity detection, interrupt handling, and turn-taking — powered by LiveKit.
                      </p>
                    </div>
                    <div className="flex-1 max-w-md w-full">
                      <Waveform />
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-20">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center"
            >
              {[
                { value: 500, prefix: "<", suffix: "ms", label: "Voice Latency" },
                { value: 100, prefix: "", suffix: "%", label: "Open Source" },
                { value: 5, prefix: "", suffix: "+", label: "AI Providers" },
                { value: 3, prefix: "", suffix: " min", label: "Setup Time" },
              ].map((stat) => (
                <motion.div key={stat.label} variants={fadeUp}>
                  <div className="text-4xl sm:text-5xl font-extrabold text-primary mb-2">
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-lg border bg-card p-12 sm:p-16 text-center"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.03, 0.08, 0.03],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary blur-[100px] rounded-full"
                />
              </div>

              <div className="relative">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Ready to build?
                </h2>
                <p className="mx-auto max-w-xl text-lg text-muted-foreground mb-8">
                  Deploy your first voice AI agent in minutes. Free forever. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button size="lg" className="gap-2 h-12 px-8 text-base">
                        Get Started Free
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard">
                      <Button size="lg" className="gap-2 h-12 px-8 text-base">
                        Go to Dashboard
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  </SignedIn>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-8 text-base" asChild>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                      <GithubIcon className="h-5 w-5" />
                      Star on GitHub
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <MicrophoneIcon className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold">VoxArena</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Open source voice AI platform.
          </p>
          <a
            href="https://github.com"
            className="text-muted-foreground hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
        </div>
      </footer>
    </div>
  );
}
