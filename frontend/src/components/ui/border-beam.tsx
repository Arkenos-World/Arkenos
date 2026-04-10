"use client"

import { useEffect, type CSSProperties } from "react"
import { motion, useMotionValue, useTransform, animate, type Transition } from "framer-motion"

import { cn } from "@/lib/utils"

interface BorderBeamProps {
  /**
   * The size of the border beam (controls arc width).
   */
  size?: number
  /**
   * The duration of the border beam.
   */
  duration?: number
  /**
   * The delay of the border beam.
   */
  delay?: number
  /**
   * The color of the border beam from.
   */
  colorFrom?: string
  /**
   * The color of the border beam to.
   */
  colorTo?: string
  /**
   * The motion transition of the border beam.
   */
  transition?: Transition
  /**
   * The class name of the border beam.
   */
  className?: string
  /**
   * The style of the border beam.
   */
  style?: CSSProperties
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number
  /**
   * The border width of the beam.
   */
  borderWidth?: number
}

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5,
}: BorderBeamProps) => {
  // Map size prop to arc width in degrees (50→18°, 80→29°, 250→90°)
  const arcDeg = Math.max(18, Math.min(size * 0.36, 90))
  const angle = useMotionValue(initialOffset * 3.6)

  useEffect(() => {
    const controls = animate(angle, reverse ? [360, 0] : [0, 360], {
      repeat: Infinity,
      ease: "linear",
      duration,
      delay: -delay,
      ...(transition as Record<string, unknown>),
    })
    return () => controls.stop()
  }, [angle, duration, delay, reverse, transition])

  const background = useTransform(
    angle,
    (a) =>
      `conic-gradient(from ${a}deg at 50% 50%, transparent 0deg, ${colorTo} ${arcDeg * 0.4}deg, ${colorFrom} ${arcDeg * 0.8}deg, transparent ${arcDeg}deg, transparent 360deg)`
  )

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        className
      )}
      style={style}
    >
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background,
          padding: borderWidth,
          WebkitMaskImage:
            "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
          WebkitMaskClip: "content-box, border-box",
          WebkitMaskComposite: "xor" as string,
          maskImage:
            "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
          maskClip: "content-box, border-box",
          maskComposite: "exclude" as string,
        }}
      />
    </div>
  )
}
