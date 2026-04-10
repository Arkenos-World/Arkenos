import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import DashboardLayout from "@/components/dashboard/layout-dashboard";
import { SWRFallback } from "@/components/swr-fallback";
import { MicrophoneIcon, PhoneIcon } from "@/components/icons";
import { sentimentDotColor } from "@/lib/design-tokens";
import { getApiUrl } from "@/lib/api";
import { getServerAuthHeaders } from "@/lib/server-auth";
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
    const shortId = room.replace(/^(preview-|nenyax-)/, '').slice(0, 18)
    return { primary: name, secondary: `ID: ${shortId}` }
}

export default async function DashboardPage() {
    const { headers: reqHeaders, userId, user } = await getServerAuthHeaders();

    if (!userId) {
        redirect("/");
    }

    const apiUrl = getApiUrl();

    const [recentRes, keyStatusRes] = await Promise.all([
        fetch(`${apiUrl}/sessions/?limit=5`, { headers: reqHeaders, cache: 'no-store' }),
        fetch(`${apiUrl}/settings/keys`, { headers: reqHeaders, cache: 'no-store' }).catch(() => null),
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

    // Provide server-fetched key status as SWR fallback
    const orgId = reqHeaders["x-org-id"];
    const keyStatusKey = JSON.stringify(["/settings/keys", orgId]);
    const fallback: Record<string, unknown> = {};
    if (keyStatus) fallback[keyStatusKey] = keyStatus;

    return (
        <DashboardLayout>
            <SWRFallback fallback={fallback}>
            <div className="space-y-6">
                {/* Welcome */}
                <div>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <h1 className="text-2xl font-bold">Welcome {user?.name || "back"}!</h1>
                </div>

                {/* Stat Row + Call Volume Chart */}
                <DashboardStats userId={userId} />

                {/* Recent Calls */}
                <Card className="rounded-2xl border-black/5 dark:border-white/[0.06] shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold tracking-tight">Recent Calls</CardTitle>
                            <Link href="/dashboard/logs">
                                <Button variant="outline" size="sm" className="rounded-full h-8 text-xs font-medium px-4">
                                    View all
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentSessions.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-black/10 dark:border-white/10">
                                <PhoneIcon className="h-10 w-10 mb-3 text-zinc-300 dark:text-zinc-600" />
                                <p className="font-medium text-[14px] text-zinc-900 dark:text-zinc-100">No calls yet</p>
                                <p className="text-[13px] mt-1">Your recent voice interactions will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentSessions.map((session) => (
                                    <Link key={session.id} href={`/dashboard/logs/${session.id}`} className="block group">
                                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-black/5 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-zinc-900/40 group-hover:bg-zinc-100/80 dark:group-hover:bg-zinc-800/60 transition-colors cursor-pointer shadow-sm">
                                            <div className="flex items-center gap-3.5">
                                                <div className="relative w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                    <MicrophoneIcon className="h-4 w-4" />
                                                    {session.analysis?.sentiment && (
                                                        <span
                                                            className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-[2px] border-white dark:border-[#0C0C0C] ${sentimentDotColor(session.analysis.sentiment_score)}`}
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    {(() => {
                                                        const { primary, secondary } = resolveSessionLabel(session)
                                                        return (
                                                            <p className="font-semibold text-[14px] text-zinc-900 dark:text-zinc-100">
                                                                {primary}
                                                                <span className="text-zinc-500 dark:text-zinc-400 ml-1.5 font-normal text-[13px]">
                                                                    — {secondary}
                                                                </span>
                                                            </p>
                                                        )
                                                    })()}
                                                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                        {new Date(session.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1.5">
                                                <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 font-mono">{formatDuration(session.duration || 0)}</p>
                                                <Badge variant={session.status === 'COMPLETED' ? 'secondary' : 'default'} className="text-[10px] h-5 rounded-full px-2 font-medium">
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

            </div>
            </SWRFallback>
        </DashboardLayout>
    );
}
