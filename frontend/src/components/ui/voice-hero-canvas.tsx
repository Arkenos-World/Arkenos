"use client";

import { useEffect, useRef, useCallback } from "react";

interface VoiceHeroCanvasProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
}

export function VoiceHeroCanvas({ className }: VoiceHeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const isDarkRef = useRef(true);

  const draw = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const dpr = window.devicePixelRatio || 1;
    const isDark = isDarkRef.current;

    // Colors
    const baseColor = isDark ? "255,255,255" : "0,0,0";
    const accentColor = isDark ? "180,220,255" : "40,80,140";

    ctx.clearRect(0, 0, w, h);

    const t = time * 0.001;
    const mouseInfluence = mouseRef.current.active ? 1.2 : 1.0;

    // ─── Central orb with glow ────────────────────────────────────
    const orbRadius = 28 * dpr * mouseInfluence;

    // Outer glow layers
    for (let i = 4; i >= 0; i--) {
      const r = orbRadius + i * 18 * dpr;
      const alpha = 0.015 - i * 0.003;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `rgba(${accentColor},${alpha + 0.02})`);
      grad.addColorStop(0.5, `rgba(${accentColor},${alpha})`);
      grad.addColorStop(1, `rgba(${accentColor},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core orb
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbRadius);
    coreGrad.addColorStop(0, `rgba(${baseColor},0.9)`);
    coreGrad.addColorStop(0.6, `rgba(${baseColor},0.4)`);
    coreGrad.addColorStop(1, `rgba(${baseColor},0.0)`);
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
    ctx.fill();

    // Bright inner core
    const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbRadius * 0.5);
    innerGrad.addColorStop(0, `rgba(${baseColor},1)`);
    innerGrad.addColorStop(1, `rgba(${baseColor},0)`);
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, orbRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // ─── Concentric wave rings ────────────────────────────────────
    const numRings = 6;
    const maxRingRadius = Math.min(w, h) * 0.42;

    for (let i = 0; i < numRings; i++) {
      const progress = (i + 1) / numRings;
      const baseRadius = orbRadius + progress * (maxRingRadius - orbRadius);
      const alpha = (0.18 - progress * 0.14) * mouseInfluence;

      ctx.strokeStyle = `rgba(${baseColor},${alpha})`;
      ctx.lineWidth = (2.5 - progress * 1.5) * dpr;
      ctx.beginPath();

      const segments = 128;
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        // Multiple sine waves for organic feel
        const wave1 = Math.sin(angle * 3 + t * 1.2 + i * 0.8) * 8 * dpr * progress;
        const wave2 = Math.sin(angle * 5 - t * 0.8 + i * 1.2) * 4 * dpr * progress;
        const wave3 = Math.sin(angle * 7 + t * 2.0 + i * 0.5) * 2 * dpr * progress;
        const breathe = Math.sin(t * 0.6 + i * 0.4) * 6 * dpr;
        const displacement = (wave1 + wave2 + wave3 + breathe) * mouseInfluence;

        const r = baseRadius + displacement;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.stroke();
    }

    // ─── Radial lines (subtle) ────────────────────────────────────
    const numLines = 24;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2 + t * 0.05;
      const len = orbRadius * 1.5 + Math.sin(t * 0.8 + i * 0.5) * 20 * dpr;
      const outerLen = maxRingRadius * (0.6 + Math.sin(t * 0.3 + i * 0.8) * 0.15);
      const alpha = 0.03 + Math.sin(t + i * 0.4) * 0.015;

      ctx.strokeStyle = `rgba(${baseColor},${alpha})`;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.lineTo(cx + Math.cos(angle) * outerLen, cy + Math.sin(angle) * outerLen);
      ctx.stroke();
    }

    // ─── Floating particles ───────────────────────────────────────
    // Spawn new particles
    if (Math.random() < 0.15) {
      const angle = Math.random() * Math.PI * 2;
      const dist = orbRadius * 2 + Math.random() * maxRingRadius * 0.6;
      particlesRef.current.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.3 * dpr,
        vy: (Math.random() - 0.5) * 0.3 * dpr,
        radius: (1 + Math.random() * 2) * dpr,
        alpha: 0.2 + Math.random() * 0.3,
        decay: 0.997,
      });
    }

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha *= p.decay;

      // Subtle orbit pull toward center
      const dx = cx - p.x;
      const dy = cy - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      p.vx += (dx / dist) * 0.01 * dpr;
      p.vy += (dy / dist) * 0.01 * dpr;

      if (p.alpha < 0.01) return false;

      ctx.fillStyle = `rgba(${baseColor},${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    // ─── Orbiting dots on ring paths ──────────────────────────────
    for (let i = 0; i < 8; i++) {
      const ringIdx = i % numRings;
      const progress = (ringIdx + 1) / numRings;
      const radius = orbRadius + progress * (maxRingRadius - orbRadius);
      const speed = 0.2 + i * 0.08;
      const angle = t * speed + (i * Math.PI * 2) / 8;
      const wave = Math.sin(angle * 3 + t) * 6 * dpr * progress;
      const r = radius + wave;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const dotAlpha = 0.4 + Math.sin(t * 2 + i) * 0.2;
      const dotSize = (2 + Math.sin(t + i) * 1) * dpr;

      // Dot glow
      const dotGrad = ctx.createRadialGradient(x, y, 0, x, y, dotSize * 3);
      dotGrad.addColorStop(0, `rgba(${accentColor},${dotAlpha * 0.5})`);
      dotGrad.addColorStop(1, `rgba(${accentColor},0)`);
      ctx.fillStyle = dotGrad;
      ctx.beginPath();
      ctx.arc(x, y, dotSize * 3, 0, Math.PI * 2);
      ctx.fill();

      // Dot core
      ctx.fillStyle = `rgba(${baseColor},${dotAlpha})`;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check dark mode
    const checkDark = () => {
      isDarkRef.current = document.documentElement.classList.contains("dark");
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Resize handler
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const handleLeave = () => {
      mouseRef.current.active = false;
    };
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);

    // Animation loop
    const loop = (time: number) => {
      draw(ctx, time);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      observer.disconnect();
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
