"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TextRotateProps {
  words: string[];
  interval?: number;
  className?: string;
}

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export function TextRotate({
  words,
  interval = 3500,
  className,
}: TextRotateProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[currentIndex]}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className={className}
        style={{ display: "inline-block" }}
      >
        {words[currentIndex]}
      </motion.span>
    </AnimatePresence>
  );
}
