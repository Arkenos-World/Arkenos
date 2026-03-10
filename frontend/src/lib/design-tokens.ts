// Standardized sidebar width
export const SIDEBAR_WIDTH = "w-64";

// Standardized icon sizes
export const ICON_SIZE = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

// Standardized spacing
export const SECTION_GAP = "space-y-6";

// Semantic status text colors
export const STATUS_COLORS = {
  positive: "text-emerald-500 dark:text-emerald-400",
  negative: "text-red-500 dark:text-red-400",
  neutral: "text-yellow-500 dark:text-yellow-400",
  info: "text-sky-500 dark:text-sky-400",
  warning: "text-amber-500 dark:text-amber-400",
} as const;

// Semantic status badge backgrounds
export const STATUS_BG = {
  positive: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  negative: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
  neutral: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
  transferred: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  info: "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400",
} as const;

// Pipeline badge colors — tied to function, not provider
export const PIPELINE_COLORS = {
  stt: "bg-chart-1/10 text-chart-1 border-chart-1/30",
  llm: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  tts: "bg-chart-4/10 text-chart-4 border-chart-4/30",
} as const;

// Delta indicator color for KPI stats
export function deltaColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-muted-foreground";
  return value >= 0 ? STATUS_COLORS.positive : STATUS_COLORS.negative;
}

// Sentiment dot color
export function sentimentDotColor(sentiment: string | number | null | undefined): string {
  if (sentiment === null || sentiment === undefined) return "bg-muted-foreground";
  const val = typeof sentiment === "string" ? parseFloat(sentiment) : sentiment;
  if (isNaN(val)) return "bg-muted-foreground";
  if (val >= 0.3) return "bg-emerald-500";
  if (val <= -0.3) return "bg-red-500";
  return "bg-yellow-500";
}
