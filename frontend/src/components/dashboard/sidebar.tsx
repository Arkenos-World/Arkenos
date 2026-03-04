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
    MenuIcon, XIcon, ChevronLeftIcon, ChevronRightIcon,
} from "@/components/icons";
import { ArkenosLogo, ArkenosLogoMark } from "@/components/ui/arkenos-logo";

interface SidebarProps {
    userEmail?: string;
    userName?: string;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
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

function SidebarContent({ pathname, userEmail, userName, collapsed, onCollapsedChange }: SidebarProps & { pathname: string }) {
    return (
        <>
            {/* Logo */}
            <div className={cn("border-b", collapsed ? "p-3 flex justify-center" : "p-4")}>
                <Link href="/" className="flex items-center gap-2">
                    {collapsed ? (
                        <ArkenosLogoMark className="h-6 w-6" />
                    ) : (
                        <ArkenosLogo className="h-6" />
                    )}
                </Link>
                {!collapsed && userEmail && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{userEmail}</p>
                )}
            </div>

            {/* Search */}
            {!collapsed && (
                <div className="p-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 text-muted-foreground text-sm">
                        <SearchIcon className="h-4 w-4" />
                        <span>Search</span>
                        <kbd className="ml-auto text-xs bg-background px-1.5 py-0.5">Ctrl+K</kbd>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className={cn("flex-1 py-2 space-y-6 overflow-y-auto", collapsed ? "px-1" : "px-3")}>
                {navSections.map((section, idx) => (
                    <div key={idx}>
                        {!collapsed && section.label && (
                            <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={cn(
                                        "flex items-center py-2 text-sm transition-colors",
                                        collapsed ? "justify-center px-2" : "gap-3 px-3",
                                        isActive(pathname, item.href)
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    {!collapsed && item.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom */}
            <div className={cn("border-t space-y-1", collapsed ? "p-1" : "p-3")}>
                {onCollapsedChange && (
                    <button
                        onClick={() => onCollapsedChange(!collapsed)}
                        className={cn(
                            "flex items-center py-2 text-sm transition-colors w-full text-muted-foreground hover:bg-muted hover:text-foreground",
                            collapsed ? "justify-center px-2" : "gap-3 px-3"
                        )}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? (
                            <ChevronRightIcon className="h-4 w-4 shrink-0" />
                        ) : (
                            <>
                                <ChevronLeftIcon className="h-4 w-4 shrink-0" />
                                <span>Collapse</span>
                            </>
                        )}
                    </button>
                )}
                <Link
                    href="/dashboard/settings"
                    title={collapsed ? "Settings" : undefined}
                    className={cn(
                        "flex items-center py-2 text-sm transition-colors",
                        collapsed ? "justify-center px-2" : "gap-3 px-3",
                        isActive(pathname, "/dashboard/settings")
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <SettingsIcon className="h-4 w-4 shrink-0" />
                    {!collapsed && "Settings"}
                </Link>
                <div className={cn("flex items-center py-2", collapsed ? "justify-center px-2" : "gap-3 px-3")}>
                    <UserButton />
                    {!collapsed && <span className="text-sm truncate">{userName || "User"}</span>}
                </div>
            </div>
        </>
    );
}

export function Sidebar({ userEmail, userName, collapsed: collapsedProp }: SidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (collapsedProp !== undefined) return collapsedProp;
        if (typeof window !== "undefined") {
            return localStorage.getItem("sidebar-collapsed") === "true";
        }
        return false;
    });

    // Persist collapse state
    useEffect(() => {
        localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    }, [isCollapsed]);

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
            <aside className={cn(
                "hidden lg:flex border-r bg-card flex-col h-screen sticky top-0 transition-all duration-200",
                isCollapsed ? "w-14 overflow-hidden" : "w-64"
            )}>
                <SidebarContent
                    pathname={pathname}
                    userEmail={userEmail}
                    userName={userName}
                    collapsed={isCollapsed}
                    onCollapsedChange={setIsCollapsed}
                />
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
