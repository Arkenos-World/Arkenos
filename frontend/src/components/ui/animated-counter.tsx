"use client";

import { useCounter } from "@/hooks/use-counter";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix,
  suffix,
  decimals = 0,
  delay,
  className,
}: AnimatedCounterProps) {
  const { ref, display } = useCounter(value, { decimals, delay });

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      <span ref={ref}>{display}</span>
      {suffix}
    </span>
  );
}
