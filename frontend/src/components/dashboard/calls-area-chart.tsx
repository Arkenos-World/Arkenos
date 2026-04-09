"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

const CHART_COLOR = "#6366f1"

const chartConfig = {
    calls: {
        label: "Calls",
        color: CHART_COLOR,
    },
} satisfies ChartConfig

interface CallsAreaChartProps {
    data: { date: string; calls: number }[]
}

export function CallsAreaChart({ data }: CallsAreaChartProps) {
    return (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                    <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                    type="monotone"
                    dataKey="calls"
                    stroke={CHART_COLOR}
                    strokeWidth={2}
                    fill="url(#callsGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: CHART_COLOR }}
                />
            </AreaChart>
        </ChartContainer>
    )
}
