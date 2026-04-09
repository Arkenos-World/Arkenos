"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    useSession,
    useListOrganizations,
    organization,
} from "@/lib/auth-client";
import { NenyaxLogo } from "@/components/ui/nenyax-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/icons";
import { Building2, Users, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

export default function OnboardingPage() {
    const router = useRouter();
    const { data: sessionData, isPending: sessionLoading } = useSession();
    const { data: orgs, isPending: orgsLoading } = useListOrganizations();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [orgName, setOrgName] = useState("");
    const [creating, setCreating] = useState(false);
    const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

    // Invite state
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
    const [inviting, setInviting] = useState(false);
    const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

    // If session is loading, show spinner
    if (sessionLoading || orgsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner className="h-8 w-8 text-muted-foreground" />
            </div>
        );
    }

    // If not logged in, redirect to home
    if (!sessionData?.user) {
        router.push("/");
        return null;
    }

    // If user already has orgs, redirect to dashboard
    if (orgs && orgs.length > 0 && step === 1 && !createdOrgId) {
        router.push("/dashboard");
        return null;
    }

    const handleCreateOrg = async () => {
        const trimmed = orgName.trim();
        if (!trimmed) {
            toast.error("Please enter an organization name");
            return;
        }

        setCreating(true);
        try {
            const slug = slugify(trimmed);
            const result = await organization.create({
                name: trimmed,
                slug: slug || `org-${Date.now()}`,
            });

            if (result.error) {
                toast.error(result.error.message || "Failed to create organization");
                return;
            }

            const orgId = result.data?.id;
            if (orgId) {
                // Set as active organization
                await organization.setActive({ organizationId: orgId });
                setCreatedOrgId(orgId);
                setStep(2);
                toast.success("Organization created");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    const handleInvite = async () => {
        const email = inviteEmail.trim().toLowerCase();
        if (!email) {
            toast.error("Please enter an email address");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }
        if (!createdOrgId) return;

        setInviting(true);
        try {
            const result = await organization.inviteMember({
                organizationId: createdOrgId,
                email,
                role: inviteRole,
            });

            if (result.error) {
                toast.error(result.error.message || "Failed to send invitation");
                return;
            }

            setInvitedEmails((prev) => [...prev, email]);
            setInviteEmail("");
            toast.success(`Invitation sent to ${email}`);
        } catch {
            toast.error("Failed to send invitation");
        } finally {
            setInviting(false);
        }
    };

    const handleFinish = () => {
        setStep(3);
        // Brief pause to show success state, then redirect
        setTimeout(() => {
            router.push("/dashboard");
        }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            {/* Logo */}
            <div className="mb-8">
                <NenyaxLogo className="h-8 text-foreground" />
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`h-2 rounded-full transition-all duration-300 ${
                            s === step
                                ? "w-8 bg-primary"
                                : s < step
                                  ? "w-2 bg-primary/60"
                                  : "w-2 bg-muted"
                        }`}
                    />
                ))}
            </div>

            {/* Step 1: Create organization */}
            {step === 1 && (
                <Card className="w-full max-w-md animate-[slide-up-fade_0.3s_ease-out]">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Name your organization</CardTitle>
                        <CardDescription>
                            This is where your team will manage agents, calls, and API keys.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="org-name">Organization name</Label>
                            <Input
                                id="org-name"
                                placeholder="Acme Inc."
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateOrg();
                                }}
                                autoFocus
                            />
                            {orgName.trim() && (
                                <p className="text-xs text-muted-foreground">
                                    Slug: {slugify(orgName.trim()) || "..."}
                                </p>
                            )}
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleCreateOrg}
                            disabled={creating || !orgName.trim()}
                        >
                            {creating ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            {creating ? "Creating..." : "Create organization"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Invite team */}
            {step === 2 && (
                <Card className="w-full max-w-md animate-[slide-up-fade_0.3s_ease-out]">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Invite your team</CardTitle>
                        <CardDescription>
                            Add teammates to collaborate on your voice agents. You can always do this later.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">Email address</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="teammate@company.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleInvite();
                                    }}
                                    autoFocus
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as "member" | "admin")}
                                    className="h-9 rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleInvite}
                            disabled={inviting || !inviteEmail.trim()}
                        >
                            {inviting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Users className="h-4 w-4 mr-2" />
                            )}
                            {inviting ? "Sending..." : "Send invitation"}
                        </Button>

                        {/* Invited list */}
                        {invitedEmails.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Invitations sent
                                </p>
                                {invitedEmails.map((email) => (
                                    <div
                                        key={email}
                                        className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 rounded-md bg-muted/50"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        {email}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2">
                            <Button className="w-full" onClick={handleFinish}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                {invitedEmails.length > 0 ? "Continue to dashboard" : "Skip for now"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <Card className="w-full max-w-md animate-[slide-up-fade_0.3s_ease-out]">
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">You&apos;re all set!</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Redirecting to your dashboard...
                            </p>
                        </div>
                        <LoadingSpinner className="h-5 w-5 mx-auto text-muted-foreground" />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
