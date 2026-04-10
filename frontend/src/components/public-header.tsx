"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NenyaxLogoMark } from "@/components/ui/nenyax-logo";
import { AuthModal } from "@/components/auth-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

const NAV_LINKS = [
  { href: "/product", label: "Product" },
  { href: "https://nenyax.mintlify.app", label: "Docs", external: true },
  { href: "/blog", label: "Blog" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [scrolled, setScrolled] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [starCount, setStarCount] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const cached = sessionStorage.getItem("nenyax-gh-stars");
    if (cached) {
      setStarCount(cached);
      return;
    }
    fetch("https://api.github.com/repos/Nenyax-AI/Nenyax")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === "number") {
          const count = data.stargazers_count;
          const formatted = count >= 1000 ? `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(count);
          sessionStorage.setItem("nenyax-gh-stars", formatted);
          setStarCount(formatted);
        }
      })
      .catch(() => {
        // Silently fail — badge will show fallback
      });
  }, []);

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500",
          scrolled ? "pt-4 pb-0 pointer-events-none" : "pt-6 pb-4"
        )}
      >
        <div 
          className={cn(
            "mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] px-6 md:px-8",
            scrolled 
              ? "max-w-4xl h-14 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-black/5 dark:border-white/[0.06] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] pointer-events-auto translate-y-2"
              : "max-w-7xl h-14 bg-transparent pointer-events-auto"
          )}
        >
          <div className="flex items-center gap-8 md:gap-10">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group"
            >
              <NenyaxLogoMark className="h-5 w-5 text-zinc-900 dark:text-zinc-100 transition-transform duration-300 group-hover:scale-105 active:scale-95" />
              <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:block">nenyax</span>
            </Link>
            
            <nav 
              className="hidden md:flex items-center gap-1"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {NAV_LINKS.map((link, idx) => {
                const isActive = pathname === link.href;
                return (
                  <div 
                    key={link.href} 
                    className="relative"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  >
                    <AnimatePresence>
                      {hoveredIndex === idx && (
                        <motion.div 
                          layoutId="nav-hover"
                          className="absolute inset-0 bg-black/[0.03] dark:bg-white/[0.06] rounded-full -z-10"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        />
                      )}
                    </AnimatePresence>
                    
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "px-4 py-2 text-[13px] font-medium transition-colors duration-200 block",
                          hoveredIndex === idx ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"
                        )}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-1 px-4 py-2 text-[13px] font-medium transition-colors duration-200",
                          isActive ? "text-zinc-900 dark:text-zinc-100" : hoveredIndex === idx ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"
                        )}
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>

            <a
              href="https://github.com/Nenyax-AI/Nenyax"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 rounded-full bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/[0.06] text-[12px] font-medium px-3 py-1.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              {starCount ? starCount : "Star"}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <Link href="/dashboard">
                <Button 
                  size="sm" 
                  className="rounded-full px-5 h-8 text-[13px] font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setAuthMode("sign-in"); setAuthOpen(true); }}
                  className="rounded-full px-4 h-8 text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors hidden sm:inline-flex"
                >
                  Log in
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => { setAuthMode("sign-up"); setAuthOpen(true); }}
                  className="rounded-full px-5 h-8 text-[13px] font-medium shadow-[0_2px_10px_rgb(0,0,0,0.08)] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:shadow-[0_4px_14px_rgb(0,0,0,0.1)] dark:hover:shadow-[0_4px_14px_rgb(0,0,0,0.4)] transition-all transform hover:-translate-y-[1px]"
                >
                  Start Building
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </>
  );
}
