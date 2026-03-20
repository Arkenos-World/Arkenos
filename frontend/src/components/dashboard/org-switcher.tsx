"use client";

import { useState, useRef, useEffect } from "react";
import { organization, useActiveOrganization, useListOrganizations } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface OrgSwitcherProps {
    collapsed?: boolean;
}

export function OrgSwitcher({ collapsed }: OrgSwitcherProps) {
    const { data: activeOrg, isPending: activeLoading } = useActiveOrganization();
    const { data: orgs, isPending: listLoading } = useListOrganizations();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");
    const [creating, setCreating] = useState(false);
    const [switching, setSwitching] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [dropdownOpen]);

    // Close dropdown on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") setDropdownOpen(false);
        }
        if (dropdownOpen) {
            document.addEventListener("keydown", handleKey);
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [dropdownOpen]);

    // Auto-set first org as active if none is selected
    useEffect(() => {
        if (activeLoading || listLoading) return;
        if (!activeOrg && orgs && orgs.length > 0) {
            organization.setActive({ organizationId: orgs[0].id }).then(() => {
                window.location.reload();
            });
        }
    }, [activeOrg, orgs, activeLoading, listLoading]);

    async function handleSwitchOrg(orgId: string) {
        setSwitching(true);
        setDropdownOpen(false);
        try {
            await organization.setActive({ organizationId: orgId });
            window.location.reload();
        } catch {
            setSwitching(false);
        }
    }

    async function handleCreateOrg() {
        if (!newOrgName.trim()) return;
        setCreating(true);
        try {
            const slug = newOrgName
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            const result = await organization.create({ name: newOrgName.trim(), slug });
            if (result?.data?.id) {
                await organization.setActive({ organizationId: result.data.id });
            }
            setCreateDialogOpen(false);
            setNewOrgName("");
            window.location.reload();
        } catch {
            setCreating(false);
        }
    }

    const isLoading = activeLoading || listLoading;

    if (isLoading) {
        return (
            <div className={cn("px-3 py-2", collapsed && "px-1 py-2 flex justify-center")}>
                <Skeleton className={cn("h-9 rounded-md", collapsed ? "w-10" : "w-full")} />
            </div>
        );
    }

    const orgList = orgs ?? [];
    const activeName = activeOrg?.name ?? "Select organization";
    const activeInitial = activeName[0]?.toUpperCase() ?? "O";

    if (collapsed) {
        return (
            <div className="px-1 py-2 flex justify-center">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    title={activeName}
                    className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                >
                    {activeInitial}
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="px-3 py-2 relative" ref={dropdownRef}>
                {/* Trigger button */}
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    disabled={switching}
                    className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        "bg-muted/50 hover:bg-muted text-foreground",
                        "border border-border/50",
                        switching && "opacity-50 cursor-wait"
                    )}
                >
                    <span className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {activeInitial}
                    </span>
                    <span className="truncate flex-1 text-left">{activeName}</span>
                    <svg
                        className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                    <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-card border border-border rounded-md shadow-lg overflow-hidden">
                        <div className="py-1 max-h-48 overflow-y-auto">
                            {orgList.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => handleSwitchOrg(org.id)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                                        "hover:bg-muted/80 text-foreground",
                                        activeOrg?.id === org.id && "bg-primary/10 text-primary font-medium"
                                    )}
                                >
                                    <span className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                        {org.name[0]?.toUpperCase() ?? "O"}
                                    </span>
                                    <span className="truncate">{org.name}</span>
                                    {activeOrg?.id === org.id && (
                                        <svg className="h-4 w-4 ml-auto shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-border">
                            <button
                                onClick={() => {
                                    setDropdownOpen(false);
                                    setCreateDialogOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                            >
                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Create new organization
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create org dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create organization</DialogTitle>
                        <DialogDescription>
                            Create a new organization to manage agents, API keys, and team members separately.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateOrg();
                        }}
                    >
                        <div className="space-y-2 py-4">
                            <Label htmlFor="org-name">Organization name</Label>
                            <Input
                                id="org-name"
                                placeholder="My Organization"
                                value={newOrgName}
                                onChange={(e) => setNewOrgName(e.target.value)}
                                autoFocus
                                disabled={creating}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                disabled={creating}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!newOrgName.trim() || creating}>
                                {creating ? "Creating..." : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
