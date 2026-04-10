"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  const opacity = useTransform(scrollYProgress, [0, 0.02], [0, 1]);

  return (
    <motion.div
      style={{
        scaleX,
        opacity,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 9999,
        background: "rgb(24, 24, 27)",
        transformOrigin: "0%",
      }}
    />
  );
}
