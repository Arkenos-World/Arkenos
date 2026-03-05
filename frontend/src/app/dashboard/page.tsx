import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
// Dashboard layout and analytics
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { MicrophoneIcon, PhoneIcon } from "@/components/icons";
import { sentimentDotColor } from "@/lib/design-tokens";
import type { VoiceSession, SessionsPage, KeyStatusResponse } from "@/lib/api";

// ─── Session label resolver ──────────────────────────────────────────────────
function resolveSessionLabel(session: { agent_name?: string | null; room_name: string; outbound_phone_number?: string | null }): {
    primary: string
    secondary: string
} {
    const room = session.room_name || ''
    const sipMatch = room.match(/(?:sip-)?_?(\+?\d{7,15})_?/)
    const name = session.agent_name || 'Call'
    if (session.outbound_phone_number) return { primary: name, secondary: `Outbound ${session.outbound_phone_number}` }
    if (sipMatch) return { primary: name, secondary: `Inbound ${sipMatch[1].startsWith('+') ? sipMatch[1] : '+' + sipMatch[1]}` }
    if (room.startsWith('preview-')) return { primary: session.agent_name || 'Preview', secondary: room.replace('preview-', '').slice(0, 18) }
    const shortId = room.replace(/^(preview-|arkenos-)/, '').slice(0, 18)
    return { primary: name, secondary: `ID: ${shortId}` }
}

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const user = await currentUser();

    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const headers = { 'x-user-id': userId };

    const [recentRes, keyStatusRes] = await Promise.all([
        fetch(`${apiUrl}/sessions/?limit=5`, { headers, cache: 'no-store' }),
        fetch(`${apiUrl}/settings/keys`, { cache: 'no-store' }).catch(() => null),
    ]);
    const keyStatus: KeyStatusResponse | null = keyStatusRes?.ok ? await keyStatusRes.json().catch(() => null) : null;
    const allConfigured = keyStatus?.all_required_set ?? false;

    const recentData: SessionsPage | null = recentRes.ok ? await recentRes.json().catch(() => null) : null;
    const recentSessions: VoiceSession[] = recentData?.sessions ?? [];

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Welcome */}
                <div>
                    <p className="text-sm text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
                    <h1 className="text-2xl font-bold">Welcome {user?.firstName || "back"}!</h1>
                </div>

                {/* Stat Row + Call Volume Chart */}
                <DashboardStats userId={userId} />

                {/* Recent Calls */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Recent Calls</CardTitle>
                            <Link href="/dashboard/logs">
                                <Button variant="ghost" size="sm">View all</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentSessions.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                                <PhoneIcon className="h-12 w-12 mb-4 opacity-50" />
                                <p className="font-medium">Oops...</p>
                                <p className="text-sm">You don&apos;t have any calls yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentSessions.map((session) => (
                                    <Link key={session.id} href={`/dashboard/logs/${session.id}`} className="block">
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <MicrophoneIcon className="h-5 w-5" />
                                                    {session.analysis?.sentiment && (
                                                        <span
                                                            className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${sentimentDotColor(session.analysis.sentiment_score)}`}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    {(() => {
                                                        const { primary, secondary } = resolveSessionLabel(session)
                                                        return (
                                                            <p className="font-medium text-sm">
                                                                {primary}
                                                                <span className="text-muted-foreground ml-1 font-normal">
                                                                    — {secondary}
                                                                </span>
                                                            </p>
                                                        )
                                                    })()}
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(session.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{formatDuration(session.duration || 0)}</p>
                                                <Badge variant={session.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-[10px] h-4">
                                                    {session.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="flex gap-4">
                    {allConfigured ? (
                        <Link href="/preview">
                            <Button size="lg" className="gap-2">
                                <MicrophoneIcon className="h-5 w-5" />
                                Start Voice Session
                            </Button>
                        </Link>
                    ) : (
                        <Button size="lg" className="gap-2" disabled title="Configure API keys first">
                            <MicrophoneIcon className="h-5 w-5" />
                            Start Voice Session
                        </Button>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
