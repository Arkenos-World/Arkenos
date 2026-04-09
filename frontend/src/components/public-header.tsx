"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NenyaxLogoMark } from "@/components/ui/nenyax-logo";
import { AuthModal } from "@/components/auth-modal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon, CommandIcon } from "lucide-react";

const NAV_LINKS = [
  { href: "/product", label: "Platform", hasDropdown: true },
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          scrolled ? "pt-4 pb-2" : "pt-6 pb-4"
        )}
      >
        <div 
          className={cn(
            "mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] px-8",
            scrolled 
              ? "max-w-5xl h-14 bg-white border border-black/5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.03)]" 
              : "max-w-7xl h-14 bg-transparent"
          )}
        >
          <div className="flex items-center gap-10">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group"
            >
              <NenyaxLogoMark className="h-6 w-6 text-zinc-900 transition-transform duration-300 group-hover:scale-105 active:scale-95" />
              <span className="text-[15px] font-semibold tracking-tight text-zinc-900">nenyax</span>
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
                          className="absolute inset-0 bg-zinc-50 rounded-full -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </AnimatePresence>
                    
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "px-4 py-2 text-[14px] font-medium transition-colors duration-200",
                          hoveredIndex === idx ? "text-zinc-900" : "text-zinc-500"
                        )}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-1 px-4 py-2 text-[14px] font-medium transition-colors duration-200",
                          isActive ? "text-zinc-900" : hoveredIndex === idx ? "text-zinc-900" : "text-zinc-500"
                        )}
                      >
                        {link.label}
                        {link.hasDropdown && <ChevronDownIcon className="w-3.5 h-3.5 opacity-40" />}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard">
                <Button 
                  size="sm" 
                  className="rounded-full px-6 h-9 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setAuthMode("sign-in"); setAuthOpen(true); }}
                  className="rounded-full px-5 h-9 text-[14px] font-medium hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:inline-flex"
                >
                  Log in
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => { setAuthMode("sign-up"); setAuthOpen(true); }}
                  className="rounded-full px-6 h-9 text-[14px] font-medium shadow-sm bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                >
                  Sign up
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
