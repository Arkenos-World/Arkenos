"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import {
    Area, AreaChart, CartesianGrid,
    XAxis, YAxis, Pie, PieChart, Cell
} from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type {
    CostSummary, ProviderCost, CostTimelineEntry, AgentCost
} from "@/lib/api"
import { deltaColor } from "@/lib/design-tokens"
import { useAuthHeaders } from "@/lib/auth-headers"

// ─── Color palette (consistent with analytics) ──────────────────────────────
const C = {
    indigo: "#6366f1",
    teal: "#14b8a6",
    violet: "#8b5cf6",
    emerald: "#10b981",
    sky: "#0ea5e9",
    rose: "#f43f5e",
    amber: "#f59e0b",
    pink: "#ec4899",
} as const

const PROVIDER_COLORS = [C.indigo, C.teal, C.violet, C.emerald, C.sky, C.amber, C.pink, C.rose]

// ─── Chart configs ───────────────────────────────────────────────────────────
const timelineConfig = {
    total: { label: "Total Cost", color: C.indigo },
} satisfies ChartConfig

const providerBarConfig = {
    cost: { label: "Cost", color: C.violet },
} satisfies ChartConfig

// ─── Date range presets ──────────────────────────────────────────────────────
type PresetKey = "this_month" | "last_30" | "all_time"

const PRESETS: { key: PresetKey; label: string }[] = [
    { key: "this_month", label: "This Month" },
    { key: "last_30", label: "Last 30 Days" },
    { key: "all_time", label: "All Time" },
]

function getPresetDates(key: PresetKey): { start: string; end: string } {
    const now = new Date()
    const end = now.toISOString().split("T")[0]
    switch (key) {
        case "this_month": {
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
            return { start: start.toISOString().split("T")[0], end }
        }
        case "last_30": {
            const start = new Date()
            start.setDate(start.getDate() - 30)
            return { start: start.toISOString().split("T")[0], end }
        }
        case "all_time":
            return { start: "2020-01-01", end }
    }
}

// ─── Sort config ─────────────────────────────────────────────────────────────
type SortField = "total_cost" | "calls" | "avg_cost_per_call" | "agent_name"
type SortDir = "asc" | "desc"

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtCost(v: number | string): string {
    const n = Number(v) || 0
    return `$${n.toFixed(4)}`
}

function fmtCostShort(v: number | string): string {
    const n = Number(v) || 0
    if (n >= 1) return `$${n.toFixed(2)}`
    return `$${n.toFixed(4)}`
}

// ─── Icons ───────────────────────────────────────────────────────────────────
function SortIcon({ className, direction }: { className?: string; direction?: SortDir }) {
    if (!direction) {
        return (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
        )
    }
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                d={direction === "asc" ? "M4.5 15.75l7.5-7.5 7.5 7.5" : "M19.5 8.25l-7.5 7.5-7.5-7.5"} />
        </svg>
    )
}

// ─── Component ───────────────────────────────────────────────────────────────
interface CostsClientProps {
    userId: string
    apiUrl: string
}

export default function CostsClient({ userId, apiUrl }: CostsClientProps) {
    const [loading, setLoading] = useState(true)
    const [activePreset, setActivePreset] = useState<PresetKey>("last_30")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("daily")

    // Data
    const [summary, setSummary] = useState<CostSummary | null>(null)
    const [providers, setProviders] = useState<ProviderCost[]>([])
    const [timeline, setTimeline] = useState<CostTimelineEntry[]>([])
    const [agents, setAgents] = useState<AgentCost[]>([])

    // Sort
    const [sortField, setSortField] = useState<SortField>("total_cost")
    const [sortDir, setSortDir] = useState<SortDir>("desc")

    // Initialize dates from preset
    useEffect(() => {
        const dates = getPresetDates(activePreset)
        setStartDate(dates.start)
        setEndDate(dates.end)
    }, [activePreset])

    const auth = useAuthHeaders();
    const headers = auth

    const fetchData = useCallback(async () => {
        if (!startDate || !endDate) return
        if (!headers["Authorization"]) return
        setLoading(true)
        const params = `start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
        try {
            const [summaryRes, providersRes, timelineRes, agentsRes] = await Promise.all([
                fetch(`${apiUrl}/costs/summary`, { headers, cache: "no-store" }),
                fetch(`${apiUrl}/costs/summary`, { headers, cache: "no-store" }),
                fetch(`${apiUrl}/costs/timeline?${params}&period=${granularity}`, { headers, cache: "no-store" }),
                fetch(`${apiUrl}/costs/by-agent`, { headers, cache: "no-store" }),
            ])

            if (summaryRes.ok) {
                const data = await summaryRes.json()
                setSummary({
                    total_cost: data.total_cost,
                    this_month_cost: data.this_month_cost,
                    avg_cost_per_call: 0,
                    total_calls: 0,
                })
            }
            if (providersRes.ok) {
                const data = await providersRes.json()
                const bp = data.by_provider || {}
                setProviders(Object.entries(bp).map(([provider, cost]) => ({
                    provider,
                    cost: Number(cost),
                    calls: 0,
                })))
            }
            if (timelineRes.ok) {
                const data = await timelineRes.json()
                setTimeline((Array.isArray(data) ? data : []).map((p: { date: string; total_cost: number; by_provider: Record<string, number> }) => ({
                    date: p.date,
                    total: Number(p.total_cost),
                    costs: Object.fromEntries(Object.entries(p.by_provider).map(([k, v]) => [k, Number(v)])),
                })))
            }
            if (agentsRes.ok) {
                const data = await agentsRes.json()
                setAgents((Array.isArray(data) ? data : []).map((a: { agent_id: string; agent_name: string; total_cost: number; session_count: number }) => ({
                    agent_id: a.agent_id,
                    agent_name: a.agent_name,
                    total_cost: Number(a.total_cost),
                    calls: a.session_count,
                    avg_cost_per_call: a.session_count > 0 ? Number(a.total_cost) / a.session_count : 0,
                })))
            }
        } catch (e) {
            console.error("Failed to fetch cost data", e)
        } finally {
            setLoading(false)
        }
    }, [apiUrl, headers, startDate, endDate, granularity, sortField, sortDir])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Sort agents client-side for instant re-sort
    const sortedAgents = useMemo(() => {
        const sorted = [...agents]
        sorted.sort((a, b) => {
            let cmp = 0
            switch (sortField) {
                case "agent_name":
                    cmp = a.agent_name.localeCompare(b.agent_name)
                    break
                case "calls":
                    cmp = a.calls - b.calls
                    break
                case "total_cost":
                    cmp = a.total_cost - b.total_cost
                    break
                case "avg_cost_per_call":
                    cmp = a.avg_cost_per_call - b.avg_cost_per_call
                    break
            }
            return sortDir === "asc" ? cmp : -cmp
        })
        return sorted
    }, [agents, sortField, sortDir])

    function toggleSort(field: SortField) {
        if (sortField === field) {
            setSortDir(d => d === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDir("desc")
        }
    }

    // Unique providers in timeline for stacked area chart
    const timelineProviders = useMemo(() => {
        const set = new Set<string>()
        timeline.forEach(entry => {
            Object.keys(entry.costs).forEach(p => set.add(p))
        })
        return Array.from(set)
    }, [timeline])

    const timelineChartConfig = useMemo(() => {
        const config: ChartConfig = {}
        timelineProviders.forEach((p, i) => {
            config[p] = { label: p, color: PROVIDER_COLORS[i % PROVIDER_COLORS.length] }
        })
        return config
    }, [timelineProviders])

    // Timeline data formatted as cumulative for chart
    const timelineChartData = useMemo(() => {
        const fmtDate = (d: string) => granularity === "monthly"
            ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" })
            : new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })

        // Build cumulative sums per provider
        const cumulative: Record<string, number> = {}
        const points = timeline.map(entry => {
            const point: Record<string, string | number> = { date: fmtDate(entry.date) }
            let total = 0
            for (const [provider, cost] of Object.entries(entry.costs)) {
                cumulative[provider] = (cumulative[provider] || 0) + Number(cost)
                point[provider] = cumulative[provider]
                total += cumulative[provider]
            }
            point.total = total
            return point
        })

        // Prepend a $0 origin so the chart always starts from zero
        if (points.length > 0) {
            const zeroPoint: Record<string, string | number> = { date: "" }
            timelineProviders.forEach(p => { zeroPoint[p] = 0 })
            zeroPoint.total = 0
            return [zeroPoint, ...points]
        }
        return points
    }, [timeline, granularity, timelineProviders])

    // Provider categories for grouped display
    const PROVIDER_CATEGORIES: Record<string, { label: string; icon: string }> = {
        assemblyai: { label: "STT", icon: "🎤" },
        deepgram: { label: "STT", icon: "🎤" },
        elevenlabs: { label: "STT", icon: "🎤" },
        gemini: { label: "LLM", icon: "🧠" },
        google: { label: "LLM", icon: "🧠" },
        resemble: { label: "TTS", icon: "🔊" },
        twilio: { label: "Telephony", icon: "📞" },
        telnyx: { label: "Telephony", icon: "📞" },
    }

    const groupedProviders = useMemo(() => {
        const maxCost = Math.max(...providers.map(p => p.cost), 0.001)
        const groups: Record<string, { label: string; items: { provider: string; cost: number; pct: number; color: string }[] }> = {}
        providers.forEach((p, i) => {
            const cat = PROVIDER_CATEGORIES[p.provider.toLowerCase()] || { label: "Other", icon: "⚡" }
            if (!groups[cat.label]) groups[cat.label] = { label: cat.label, items: [] }
            groups[cat.label].items.push({
                provider: p.provider,
                cost: p.cost,
                pct: (p.cost / maxCost) * 100,
                color: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
            })
        })
        return groups
    }, [providers])

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center space-y-2">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm">Loading cost data…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header + Date Range */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Costs</h1>
                    <p className="text-muted-foreground text-sm">Usage and cost analytics across providers</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Quick Presets */}
                    <div className="flex gap-1 border rounded-lg p-1">
                        {PRESETS.map(p => (
                            <Button
                                key={p.key}
                                variant={activePreset === p.key ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setActivePreset(p.key)}
                                className="h-7 px-3 text-xs"
                            >
                                {p.label}
                            </Button>
                        ))}
                    </div>
                    {/* Custom Date Inputs */}
                    <div className="flex items-center gap-1.5">
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => {
                                setStartDate(e.target.value)
                                setActivePreset(null as unknown as PresetKey)
                            }}
                            className="h-7 rounded-md border bg-background px-2 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => {
                                setEndDate(e.target.value)
                                setActivePreset(null as unknown as PresetKey)
                            }}
                            className="h-7 rounded-md border bg-background px-2 text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="animate-[slide-up-fade_0.4s_ease-out_both]" style={{ animationDelay: "0s" }}>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Cost (All Time)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{fmtCostShort(summary?.total_cost ?? 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {summary?.total_calls ?? 0} total calls
                        </p>
                    </CardContent>
                </Card>

                <Card className="animate-[slide-up-fade_0.4s_ease-out_both]" style={{ animationDelay: "0.05s" }}>
                    <CardHeader className="pb-2">
                        <CardDescription>This Month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{fmtCostShort(summary?.this_month_cost ?? 0)}</p>
                    </CardContent>
                </Card>

                <Card className="animate-[slide-up-fade_0.4s_ease-out_both]" style={{ animationDelay: "0.1s" }}>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg Cost per Call</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{fmtCost(summary?.avg_cost_per_call ?? 0)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Row: Provider Breakdown (pie) + Provider Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="animate-[slide-up-fade_0.4s_ease-out_both]" style={{ animationDelay: "0.15s" }}>
                    <CardHeader>
                        <CardTitle>Cost by Provider</CardTitle>
                        <CardDescription>Breakdown by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {providers.length === 0 ? (
                            <EmptyChart />
                        ) : (() => {
                            const total = providers.reduce((s, p) => s + p.cost, 0)
                            const sorted = [...providers].sort((a, b) => b.cost - a.cost)
                            const pieData = sorted.map((p, i) => ({
                                name: p.provider,
                                value: p.cost,
                                fill: PROVIDER_COLORS[i % PROVIDER_COLORS.length],
                            }))
                            return (
                                <>
                                    <ChartContainer config={providerBarConfig} className="h-[180px] w-full">
                                        <PieChart>
                                            <ChartTooltip
                                                content={<ChartTooltipContent
                                                    formatter={(value) => fmtCost(value as number)}
                                                />}
                                            />
                                            <Pie
                                                data={pieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                                strokeWidth={0}
                                            >
                                                {pieData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                    <div className="flex flex-col gap-1.5 mt-3">
                                        {sorted.map((p, i) => {
                                            const pct = total > 0 ? (p.cost / total) * 100 : 0
                                            const cat = PROVIDER_CATEGORIES[p.provider.toLowerCase()]?.label || "Other"
                                            return (
                                                <div key={p.provider} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-2.5 w-2.5 rounded-sm shrink-0"
                                                            style={{ background: PROVIDER_COLORS[i % PROVIDER_COLORS.length] }}
                                                        />
                                                        <span className="text-foreground">{p.provider}</span>
                                                        <span className="text-xs text-muted-foreground">{cat}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                                                        <span className="font-mono font-medium">{fmtCostShort(p.cost)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/40">
                                        <span className="text-sm text-muted-foreground">Total</span>
                                        <span className="text-sm font-mono font-bold">{fmtCostShort(total)}</span>
                                    </div>
                                </>
                            )
                        })()}
                    </CardContent>
                </Card>

                {/* Timeline Chart */}
                <Card className="lg:col-span-2 animate-[slide-up-fade_0.4s_ease-out_both]" style={{ animationDelay: "0.2s" }}>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle>Cumulative Spend</CardTitle>
                            <CardDescription>Running total by provider</CardDescription>
                        </div>
                        <div className="flex gap-1 border rounded-lg p-1">
                            {(["daily", "weekly", "monthly"] as const).map(g => (
                                <Button
                                    key={g}
                                    variant={granularity === g ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setGranularity(g)}
                                    className="h-7 px-3 text-xs capitalize"
                                >
                                    {g}
                                </Button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {timelineChartData.length === 0 ? (
                            <EmptyChart />
                        ) : (
                            <ChartContainer config={timelineChartConfig} className="h-[260px] w-full">
                                <AreaChart data={timelineChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                    <defs>
                                        {timelineProviders.map((p, i) => (
                                            <linearGradient key={p} id={`costGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={PROVIDER_COLORS[i % PROVIDER_COLORS.length]} stopOpacity={0.25} />
                                                <stop offset="95%" stopColor={PROVIDER_COLORS[i % PROVIDER_COLORS.length]} stopOpacity={0.02} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v: number | string) => `$${(Number(v) || 0).toFixed(2)}`} />
                                    <ChartTooltip
                                        content={<ChartTooltipContent
                                            formatter={(value) => fmtCost(value as number)}
                                            labelFormatter={(label) => label || "Start"}
                                        />}
                                    />
                                    {timelineProviders.map((p, i) => (
                                        <Area
                                            key={p}
                                            type="monotone"
                                            dataKey={p}
                                            stackId="1"
                                            stroke={PROVIDER_COLORS[i % PROVIDER_COLORS.length]}
                                            strokeWidth={2}
                                            fill={`url(#costGrad-${i})`}
                                            dot={{ r: 3, fill: PROVIDER_COLORS[i % PROVIDER_COLORS.length], strokeWidth: 0 }}
                                            activeDot={{ r: 5, fill: PROVIDER_COLORS[i % PROVIDER_COLORS.length], strokeWidth: 2, stroke: "var(--background)" }}
                                        />
                                    ))}
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Cost by Agent Table */}
            <Card className="animate-[slide-up-fade_0.4s_ease-out_both]" style={{ animationDelay: "0.25s" }}>
                <CardHeader>
                    <CardTitle>Cost by Agent</CardTitle>
                    <CardDescription>Per-agent cost breakdown for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedAgents.length === 0 ? (
                        <div className="h-[120px] flex items-center justify-center border-2 border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground">No agent cost data for this period</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <SortableHeader
                                            label="Agent"
                                            field="agent_name"
                                            current={sortField}
                                            dir={sortDir}
                                            onClick={toggleSort}
                                        />
                                        <SortableHeader
                                            label="Calls"
                                            field="calls"
                                            current={sortField}
                                            dir={sortDir}
                                            onClick={toggleSort}
                                            className="text-right"
                                        />
                                        <SortableHeader
                                            label="Total Cost"
                                            field="total_cost"
                                            current={sortField}
                                            dir={sortDir}
                                            onClick={toggleSort}
                                            className="text-right"
                                        />
                                        <SortableHeader
                                            label="Avg Cost/Call"
                                            field="avg_cost_per_call"
                                            current={sortField}
                                            dir={sortDir}
                                            onClick={toggleSort}
                                            className="text-right"
                                        />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedAgents.map(agent => (
                                        <tr key={agent.agent_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="py-3 pr-4 font-medium">{agent.agent_name}</td>
                                            <td className="py-3 pr-4 text-right text-muted-foreground">{agent.calls}</td>
                                            <td className="py-3 pr-4 text-right font-medium">{fmtCost(agent.total_cost)}</td>
                                            <td className="py-3 text-right text-muted-foreground">{fmtCost(agent.avg_cost_per_call)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SortableHeader({
    label,
    field,
    current,
    dir,
    onClick,
    className = "",
}: {
    label: string
    field: SortField
    current: SortField
    dir: SortDir
    onClick: (field: SortField) => void
    className?: string
}) {
    const active = current === field
    return (
        <th className={`py-3 pr-4 font-medium text-muted-foreground ${className}`}>
            <button
                onClick={() => onClick(field)}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
                {label}
                <SortIcon
                    className={`h-3.5 w-3.5 ${active ? "text-foreground" : "text-muted-foreground/50"}`}
                    direction={active ? dir : undefined}
                />
            </button>
        </th>
    )
}

function EmptyChart() {
    return (
        <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">No data for this period</p>
        </div>
    )
}
