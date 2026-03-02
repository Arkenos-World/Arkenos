"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    HomeIcon, BotIcon, PlayIcon, KeyIcon, PhoneIcon,
    ChartIcon, CurrencyIcon, SettingsIcon, SearchIcon,
    MicrophoneIcon, MenuIcon, XIcon,
} from "@/components/icons";

interface SidebarProps {
    userEmail?: string;
    userName?: string;
}

const navSections = [
    {
        label: null,
        items: [{ icon: HomeIcon, label: "Dashboard", href: "/dashboard" }],
    },
    {
        label: "Build",
        items: [
            { icon: BotIcon, label: "Agents", href: "/dashboard/agents" },
            { icon: PlayIcon, label: "Preview", href: "/preview" },
            { icon: KeyIcon, label: "API Keys", href: "/dashboard/keys" },
        ],
    },
    {
        label: "Observe",
        items: [
            { icon: PhoneIcon, label: "Call Logs", href: "/dashboard/logs" },
            { icon: ChartIcon, label: "Analytics", href: "/dashboard/analytics" },
            { icon: CurrencyIcon, label: "Costs", href: "/dashboard/costs" },
        ],
    },
];

function isActive(pathname: string, href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
}

function SidebarContent({ pathname, userEmail, userName }: SidebarProps & { pathname: string }) {
    return (
        <>
            {/* Logo */}
            <div className="p-4 border-b">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center bg-primary">
                        <MicrophoneIcon className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">Arkenos</span>
                </Link>
                {userEmail && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{userEmail}</p>
                )}
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 text-muted-foreground text-sm">
                    <SearchIcon className="h-4 w-4" />
                    <span>Search</span>
                    <kbd className="ml-auto text-xs bg-background px-1.5 py-0.5">Ctrl+K</kbd>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
                {navSections.map((section, idx) => (
                    <div key={idx}>
                        {section.label && (
                            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                                        isActive(pathname, item.href)
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t space-y-2">
                <Link
                    href="/dashboard/settings"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                        isActive(pathname, "/dashboard/settings")
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <SettingsIcon className="h-4 w-4" />
                    Settings
                </Link>
                <div className="flex items-center gap-3 px-3 py-2">
                    <UserButton />
                    <span className="text-sm truncate">{userName || "User"}</span>
                </div>
            </div>
        </>
    );
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Close on ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMobileOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-64 border-r bg-card flex-col h-screen sticky top-0">
                <SidebarContent pathname={pathname} userEmail={userEmail} userName={userName} />
            </aside>

            {/* Mobile hamburger */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden fixed top-3 left-3 z-50"
                onClick={() => setMobileOpen(true)}
            >
                <MenuIcon className="h-5 w-5" />
            </Button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-card flex flex-col lg:hidden"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3"
                                onClick={() => setMobileOpen(false)}
                            >
                                <XIcon className="h-5 w-5" />
                            </Button>
                            <SidebarContent pathname={pathname} userEmail={userEmail} userName={userName} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
