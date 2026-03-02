"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  delay?: number;
  hoverLift?: boolean;
}

export function AnimatedCard({
  delay = 0,
  hoverLift = true,
  className,
  children,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      whileHover={hoverLift ? { y: -2, transition: { duration: 0.15 } } : undefined}
    >
      <Card
        className={cn("transition-shadow hover:shadow-md", className)}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
}
