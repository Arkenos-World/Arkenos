"use client";

import { useMotionValue, useSpring, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function useCounter(
  target: number,
  options?: { decimals?: number; delay?: number }
) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 });
  const decimals = options?.decimals ?? 0;
  const [display, setDisplay] = useState((0).toFixed(decimals));

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => {
        motionValue.set(target);
      }, (options?.delay ?? 0) * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, target, motionValue, options?.delay]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplay(latest.toFixed(decimals));
    });
    return unsubscribe;
  }, [springValue, decimals]);

  return { ref, display };
}
