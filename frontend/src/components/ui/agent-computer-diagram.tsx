"use client";

import { cn } from "@/lib/utils";

// ─── Animated flow dot along a path ──────────────────────────────────────────

function FlowDot({
  pathId,
  duration = 3,
  delay = 0,
  size = 2.5,
}: {
  pathId: string;
  duration?: number;
  delay?: number;
  size?: number;
}) {
  return (
    <circle r={size} fill="currentColor" opacity="0.6">
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  );
}

// ─── Mini waveform bars ──────────────────────────────────────────────────────

function WaveBars({
  x,
  y,
  count = 5,
  maxH = 14,
  gap = 3.5,
}: {
  x: number;
  y: number;
  count?: number;
  maxH?: number;
  gap?: number;
}) {
  const heights = [0.4, 0.85, 1, 0.7, 0.5, 0.9, 0.6];
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const h = maxH * (heights[i % heights.length] ?? 0.5);
        const bx = x + i * gap;
        return (
          <rect
            key={i}
            x={bx}
            y={y - h / 2}
            width="2"
            height={h}
            rx="1"
            fill="currentColor"
            opacity="0.35"
            style={{
              transformOrigin: `${bx + 1}px ${y}px`,
              animation: `waveform-bar ${1 + (i % 3) * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.08}s`,
              // @ts-expect-error CSS custom property
              "--wave-scale": heights[i % heights.length],
            }}
          />
        );
      })}
    </g>
  );
}

// ─── STT Module — Microphone + waveform → text lines ─────────────────────────

function STTModule({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Module container — rounded rect with subtle fill */}
      <rect x={x} y={y} width="90" height="70" rx="6"
        stroke="currentColor" strokeWidth="1" opacity="0.3"
        fill="currentColor" fillOpacity="0.04"
      />

      {/* Microphone icon */}
      <rect x={x + 12} y={y + 14} width="14" height="20" rx="7"
        stroke="currentColor" strokeWidth="1" opacity="0.5" fill="currentColor" fillOpacity="0.06"
      />
      <path d={`M ${x + 9},${y + 37} C ${x + 9},${y + 43} ${x + 14},${y + 47} ${x + 19},${y + 47} C ${x + 24},${y + 47} ${x + 29},${y + 43} ${x + 29},${y + 37}`}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35" fill="none"
      />
      <line x1={x + 19} y1={y + 47} x2={x + 19} y2={y + 52}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35"
      />

      {/* Arrow → */}
      <path d={`M ${x + 35},${y + 30} L ${x + 44},${y + 30}`}
        stroke="currentColor" strokeWidth="0.6" opacity="0.3" markerEnd="none"
      />
      <path d={`M ${x + 42},${y + 27} L ${x + 46},${y + 30} L ${x + 42},${y + 33}`}
        stroke="currentColor" strokeWidth="0.6" opacity="0.3" fill="none"
      />

      {/* Text lines output (representing transcribed text) */}
      <rect x={x + 50} y={y + 18} width="28" height="2.5" rx="1"
        fill="currentColor" opacity="0.3"
      />
      <rect x={x + 50} y={y + 24} width="22" height="2.5" rx="1"
        fill="currentColor" opacity="0.2"
      />
      <rect x={x + 50} y={y + 30} width="26" height="2.5" rx="1"
        fill="currentColor" opacity="0.25"
      />
      <rect x={x + 50} y={y + 36} width="18" height="2.5" rx="1"
        fill="currentColor" opacity="0.15"
      />
      {/* Blinking cursor */}
      <rect x={x + 50} y={y + 42} width="2" height="8" rx="0.5"
        fill="currentColor" opacity="0.4"
        style={{ animation: "core-glow 1.2s ease-in-out infinite" }}
      />

      {/* Label */}
      <text x={x + 45} y={y + 66} textAnchor="middle" className="diagram-label-text">LISTEN</text>
    </g>
  );
}

// ─── TTS Module — text lines → speaker + sound waves ─────────────────────────

function TTSModule({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Module container */}
      <rect x={x} y={y} width="90" height="70" rx="6"
        stroke="currentColor" strokeWidth="1" opacity="0.3"
        fill="currentColor" fillOpacity="0.04"
      />

      {/* Text lines input */}
      <rect x={x + 10} y={y + 18} width="22" height="2.5" rx="1"
        fill="currentColor" opacity="0.3"
      />
      <rect x={x + 10} y={y + 24} width="18" height="2.5" rx="1"
        fill="currentColor" opacity="0.2"
      />
      <rect x={x + 10} y={y + 30} width="24" height="2.5" rx="1"
        fill="currentColor" opacity="0.25"
      />
      <rect x={x + 10} y={y + 36} width="16" height="2.5" rx="1"
        fill="currentColor" opacity="0.15"
      />

      {/* Arrow → */}
      <path d={`M ${x + 38},${y + 30} L ${x + 47},${y + 30}`}
        stroke="currentColor" strokeWidth="0.6" opacity="0.3"
      />
      <path d={`M ${x + 45},${y + 27} L ${x + 49},${y + 30} L ${x + 45},${y + 33}`}
        stroke="currentColor" strokeWidth="0.6" opacity="0.3" fill="none"
      />

      {/* Speaker icon */}
      <path d={`M ${x + 54},${y + 22} L ${x + 54},${y + 38} L ${x + 60},${y + 34} L ${x + 66},${y + 34} L ${x + 66},${y + 26} L ${x + 60},${y + 26} Z`}
        stroke="currentColor" strokeWidth="0.8" opacity="0.5" fill="currentColor" fillOpacity="0.06"
      />
      {/* Sound waves */}
      <path d={`M ${x + 70},${y + 27} C ${x + 73},${y + 29} ${x + 73},${y + 31} ${x + 70},${y + 33}`}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35" fill="none"
      />
      <path d={`M ${x + 73},${y + 23} C ${x + 78},${y + 27} ${x + 78},${y + 33} ${x + 73},${y + 37}`}
        stroke="currentColor" strokeWidth="0.6" opacity="0.25" fill="none"
      />
      <path d={`M ${x + 76},${y + 19} C ${x + 82},${y + 25} ${x + 82},${y + 35} ${x + 76},${y + 41}`}
        stroke="currentColor" strokeWidth="0.5" opacity="0.15" fill="none"
      />

      {/* Label */}
      <text x={x + 45} y={y + 66} textAnchor="middle" className="diagram-label-text">SPEAK</text>
    </g>
  );
}

// ─── Tools Module — gear + webhook + code brackets ───────────────────────────

function ToolsModule({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Module container */}
      <rect x={x} y={y} width="90" height="74" rx="6"
        stroke="currentColor" strokeWidth="1" opacity="0.3"
        fill="currentColor" fillOpacity="0.04"
      />

      {/* Gear icon */}
      <circle cx={x + 22} cy={y + 22} r="8"
        stroke="currentColor" strokeWidth="0.7" opacity="0.4" fill="none"
      />
      <circle cx={x + 22} cy={y + 22} r="3.5"
        stroke="currentColor" strokeWidth="0.5" opacity="0.3" fill="currentColor" fillOpacity="0.05"
      />
      {/* Gear teeth */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const ix = x + 22 + Math.cos(rad) * 8;
        const iy = y + 22 + Math.sin(rad) * 8;
        const ox = x + 22 + Math.cos(rad) * 11;
        const oy = y + 22 + Math.sin(rad) * 11;
        return (
          <line key={angle} x1={ix} y1={iy} x2={ox} y2={oy}
            stroke="currentColor" strokeWidth="1.2" opacity="0.25"
          />
        );
      })}

      {/* Webhook icon — curved arrow */}
      <path d={`M ${x + 48},${y + 14} C ${x + 56},${y + 14} ${x + 56},${y + 24} ${x + 48},${y + 24} L ${x + 56},${y + 24}`}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35" fill="none"
      />
      <circle cx={x + 48} cy={y + 14} r="2"
        fill="currentColor" opacity="0.3"
      />

      {/* Code brackets { } */}
      <text x={x + 70} y={y + 24} textAnchor="middle"
        fill="currentColor" opacity="0.35" fontSize="14" fontFamily="monospace"
      >{`{ }`}</text>

      {/* Divider */}
      <line x1={x + 10} y1={y + 40} x2={x + 80} y2={y + 40}
        stroke="currentColor" strokeWidth="0.3" opacity="0.12"
      />

      {/* Sub-labels */}
      <text x={x + 45} y={y + 53} textAnchor="middle"
        fill="currentColor" opacity="0.3" fontSize="7.5" letterSpacing="0.05em"
      >Book · Send</text>
      <text x={x + 45} y={y + 63} textAnchor="middle"
        fill="currentColor" opacity="0.25" fontSize="7" letterSpacing="0.05em"
      >Check · Update</text>

      {/* Label */}
      <text x={x + 45} y={y + -6} textAnchor="middle" className="diagram-label-text">ACTIONS</text>
    </g>
  );
}

// ─── Memory Module — database cylinder + data rows ───────────────────────────

function MemoryModule({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Module container */}
      <rect x={x} y={y} width="90" height="74" rx="6"
        stroke="currentColor" strokeWidth="1" opacity="0.3"
        fill="currentColor" fillOpacity="0.04"
      />

      {/* Database cylinder */}
      <ellipse cx={x + 28} cy={y + 14} rx="16" ry="5"
        stroke="currentColor" strokeWidth="0.7" opacity="0.4" fill="currentColor" fillOpacity="0.04"
      />
      <line x1={x + 12} y1={y + 14} x2={x + 12} y2={y + 34}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35"
      />
      <line x1={x + 44} y1={y + 14} x2={x + 44} y2={y + 34}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35"
      />
      <ellipse cx={x + 28} cy={y + 34} rx="16" ry="5"
        stroke="currentColor" strokeWidth="0.7" opacity="0.3" fill="none"
      />
      {/* Middle ring */}
      <ellipse cx={x + 28} cy={y + 24} rx="16" ry="5"
        stroke="currentColor" strokeWidth="0.4" opacity="0.15" fill="none"
      />

      {/* Data rows */}
      <rect x={x + 52} y={y + 12} width="30" height="5" rx="1"
        stroke="currentColor" strokeWidth="0.4" opacity="0.2" fill="currentColor" fillOpacity="0.04"
      />
      <rect x={x + 54} y={y + 13.5} width="10" height="2" rx="0.5"
        fill="currentColor" opacity="0.25"
      />
      <rect x={x + 67} y={y + 13.5} width="12" height="2" rx="0.5"
        fill="currentColor" opacity="0.15"
      />

      <rect x={x + 52} y={y + 20} width="30" height="5" rx="1"
        stroke="currentColor" strokeWidth="0.4" opacity="0.2" fill="currentColor" fillOpacity="0.04"
      />
      <rect x={x + 54} y={y + 21.5} width="14" height="2" rx="0.5"
        fill="currentColor" opacity="0.2"
      />
      <rect x={x + 71} y={y + 21.5} width="8" height="2" rx="0.5"
        fill="currentColor" opacity="0.15"
      />

      <rect x={x + 52} y={y + 28} width="30" height="5" rx="1"
        stroke="currentColor" strokeWidth="0.4" opacity="0.2" fill="currentColor" fillOpacity="0.04"
      />
      <rect x={x + 54} y={y + 29.5} width="8" height="2" rx="0.5"
        fill="currentColor" opacity="0.2"
      />
      <rect x={x + 65} y={y + 29.5} width="14" height="2" rx="0.5"
        fill="currentColor" opacity="0.15"
      />

      {/* Divider */}
      <line x1={x + 10} y1={y + 42} x2={x + 80} y2={y + 42}
        stroke="currentColor" strokeWidth="0.3" opacity="0.12"
      />

      {/* Sub-labels */}
      <text x={x + 45} y={y + 55} textAnchor="middle"
        fill="currentColor" opacity="0.3" fontSize="7.5" letterSpacing="0.05em"
      >Past Conversations</text>
      <text x={x + 45} y={y + 65} textAnchor="middle"
        fill="currentColor" opacity="0.25" fontSize="7" letterSpacing="0.05em"
      >Preferences</text>

      {/* Label */}
      <text x={x + 45} y={y + -6} textAnchor="middle" className="diagram-label-text">MEMORY</text>
    </g>
  );
}

// ─── Telephony Module — phone icon + signal ──────────────────────────────────

function TelephonyModule({ x, y }: { x: number; y: number }) {
  return (
    <g className="diagram-peripheral">
      {/* Module container */}
      <rect x={x} y={y} width="80" height="55" rx="5"
        stroke="currentColor" strokeWidth="0.6" opacity="0.2"
        fill="currentColor" fillOpacity="0.02"
      />

      {/* Phone handset icon */}
      <path d={`M ${x + 18},${y + 14} C ${x + 14},${y + 14} ${x + 12},${y + 18} ${x + 12},${y + 22} C ${x + 12},${y + 26} ${x + 14},${y + 30} ${x + 18},${y + 30} L ${x + 20},${y + 28} L ${x + 20},${y + 24} L ${x + 16},${y + 22} L ${x + 20},${y + 20} L ${x + 20},${y + 16} Z`}
        stroke="currentColor" strokeWidth="0.6" opacity="0.35" fill="currentColor" fillOpacity="0.05"
      />
      {/* Phone body */}
      <rect x={x + 22} y={y + 16} width="8" height="12" rx="1.5"
        stroke="currentColor" strokeWidth="0.5" opacity="0.25" fill="none"
      />
      {/* Signal bars */}
      <rect x={x + 36} y={y + 26} width="2.5" height="5" rx="0.5"
        fill="currentColor" opacity="0.2"
      />
      <rect x={x + 40} y={y + 23} width="2.5" height="8" rx="0.5"
        fill="currentColor" opacity="0.25"
      />
      <rect x={x + 44} y={y + 20} width="2.5" height="11" rx="0.5"
        fill="currentColor" opacity="0.3"
      />

      {/* Phone detail labels */}
      <text x={x + 58} y={y + 22} textAnchor="middle"
        fill="currentColor" opacity="0.2" fontSize="6.5" letterSpacing="0.05em"
      >Real</text>
      <text x={x + 58} y={y + 30} textAnchor="middle"
        fill="currentColor" opacity="0.15" fontSize="5.5"
      >Calls</text>

      {/* Label */}
      <text x={x + 40} y={y + 50} textAnchor="middle" className="diagram-label-text" style={{ fontSize: "9px" }}>PHONE</text>
    </g>
  );
}

// ─── Agents Module — multiple bot icons ──────────────────────────────────────

function AgentsModule({ x, y }: { x: number; y: number }) {
  return (
    <g className="diagram-peripheral">
      {/* Module container */}
      <rect x={x} y={y} width="80" height="55" rx="5"
        stroke="currentColor" strokeWidth="0.6" opacity="0.2"
        fill="currentColor" fillOpacity="0.02"
      />

      {/* Agent 1 (front, larger) */}
      <circle cx={x + 26} cy={y + 16} r="6"
        stroke="currentColor" strokeWidth="0.6" opacity="0.35" fill="currentColor" fillOpacity="0.05"
      />
      <rect x={x + 18} y={y + 24} width="16" height="10" rx="3"
        stroke="currentColor" strokeWidth="0.5" opacity="0.25" fill="none"
      />
      {/* Eyes */}
      <circle cx={x + 24} cy={y + 15} r="1" fill="currentColor" opacity="0.3" />
      <circle cx={x + 28} cy={y + 15} r="1" fill="currentColor" opacity="0.3" />

      {/* Agent 2 (behind, smaller, offset) */}
      <circle cx={x + 42} cy={y + 14} r="5"
        stroke="currentColor" strokeWidth="0.5" opacity="0.25" fill="currentColor" fillOpacity="0.03"
      />
      <rect x={x + 35.5} y={y + 21} width="13" height="8" rx="2.5"
        stroke="currentColor" strokeWidth="0.4" opacity="0.18" fill="none"
      />
      {/* Eyes */}
      <circle cx={x + 40.5} cy={y + 13} r="0.8" fill="currentColor" opacity="0.2" />
      <circle cx={x + 43.5} cy={y + 13} r="0.8" fill="currentColor" opacity="0.2" />

      {/* Agent 3 (ghost, far back) */}
      <circle cx={x + 56} cy={y + 17} r="4"
        stroke="currentColor" strokeWidth="0.4" opacity="0.15" fill="none"
      />
      <rect x={x + 50.5} y={y + 23} width="11" height="6" rx="2"
        stroke="currentColor" strokeWidth="0.3" opacity="0.1" fill="none"
      />

      {/* Transfer arrows between agents */}
      <path d={`M ${x + 34},${y + 20} L ${x + 37},${y + 20}`}
        stroke="currentColor" strokeWidth="0.5" opacity="0.2"
      />
      <path d={`M ${x + 49},${y + 22} L ${x + 52},${y + 22}`}
        stroke="currentColor" strokeWidth="0.4" opacity="0.15"
      />

      {/* Label */}
      <text x={x + 40} y={y + 50} textAnchor="middle" className="diagram-label-text" style={{ fontSize: "9px" }}>TEAM</text>
    </g>
  );
}

// ─── Central LLM Core — substantial multi-layer cylinder ─────────────────────

function LLMCore({ cx, cy }: { cx: number; cy: number }) {
  const w = 52; // half-width of cylinder
  const h = 85; // height of cylinder
  const ry = 16; // ellipse ry for caps

  return (
    <g>
      {/* Outer glow */}
      <ellipse cx={cx} cy={cy} rx="80" ry="80"
        fill="currentColor" opacity="0.03"
        style={{ animation: "core-glow 4s ease-in-out infinite" }}
      />
      <ellipse cx={cx} cy={cy} rx="55" ry="55"
        fill="currentColor" opacity="0.04"
        style={{ animation: "core-glow 4s ease-in-out infinite", animationDelay: "1s" }}
      />

      {/* Cylinder body — filled side walls */}
      <path
        d={`M ${cx - w},${cy - h / 2 + ry * 0.3} L ${cx - w},${cy + h / 2 - ry * 0.3} A ${w} ${ry} 0 0 0 ${cx + w},${cy + h / 2 - ry * 0.3} L ${cx + w},${cy - h / 2 + ry * 0.3}`}
        stroke="currentColor" strokeWidth="1" opacity="0.3"
        fill="currentColor" fillOpacity="0.04"
      />

      {/* Bottom cap */}
      <ellipse cx={cx} cy={cy + h / 2 - ry * 0.3} rx={w} ry={ry}
        stroke="currentColor" strokeWidth="0.7" opacity="0.2" fill="none"
      />

      {/* Middle ring details — the "disc platters" inside the cylinder */}
      {[-18, 0, 18].map((offset, i) => (
        <ellipse key={i} cx={cx} cy={cy + offset} rx={w - 4} ry={ry - 3}
          stroke="currentColor" strokeWidth="0.4" opacity={0.12 - i * 0.02}
          fill="none"
          strokeDasharray={i === 1 ? "none" : "3 3"}
        />
      ))}

      {/* Top cap — slightly brighter, filled */}
      <ellipse cx={cx} cy={cy - h / 2 + ry * 0.3} rx={w} ry={ry}
        stroke="currentColor" strokeWidth="1.2" opacity="0.4"
        fill="currentColor" fillOpacity="0.06"
      />

      {/* Inner ring on top (processor detail) */}
      <ellipse cx={cx} cy={cy - h / 2 + ry * 0.3} rx={w * 0.55} ry={ry * 0.55}
        stroke="currentColor" strokeWidth="0.6" opacity="0.25" fill="currentColor" fillOpacity="0.03"
      />
      {/* Center dot on top */}
      <circle cx={cx} cy={cy - h / 2 + ry * 0.3} r="4"
        fill="currentColor" opacity="0.15"
        style={{ animation: "core-glow 2s ease-in-out infinite" }}
      />

      {/* Vertical detail lines on body */}
      {[-0.8, -0.4, 0.4, 0.8].map((frac, i) => (
        <line
          key={i}
          x1={cx + w * frac} y1={cy - h / 2 + ry + 2}
          x2={cx + w * frac} y2={cy + h / 2 - ry - 2}
          stroke="currentColor" strokeWidth="0.3" opacity="0.08"
        />
      ))}

      {/* Horizontal circuit traces on body */}
      {[-12, 12].map((offset, i) => (
        <line key={i}
          x1={cx - w + 3} y1={cy + offset}
          x2={cx + w - 3} y2={cy + offset}
          stroke="currentColor" strokeWidth="0.3" opacity="0.06"
          strokeDasharray="2 4"
        />
      ))}

      {/* Core label */}
      <text x={cx} y={cy + 6} textAnchor="middle" className="diagram-core-label">
        AI
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle"
        fill="currentColor" opacity="0.25" fontSize="7.5" letterSpacing="0.08em"
      >BRAIN</text>
    </g>
  );
}

// ─── Voice In Indicator ──────────────────────────────────────────────────────

function VoiceInIndicator({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Background circle */}
      <circle cx={x} cy={y} r="22"
        stroke="currentColor" strokeWidth="0.5" opacity="0.12" fill="currentColor" fillOpacity="0.02"
      />

      {/* Microphone icon (detailed) */}
      <rect x={x - 5} y={y - 12} width="10" height="16" rx="5"
        stroke="currentColor" strokeWidth="0.9" opacity="0.5" fill="currentColor" fillOpacity="0.06"
      />
      {/* Mic grille lines */}
      <line x1={x - 3} y1={y - 7} x2={x + 3} y2={y - 7}
        stroke="currentColor" strokeWidth="0.3" opacity="0.2"
      />
      <line x1={x - 3} y1={y - 4} x2={x + 3} y2={y - 4}
        stroke="currentColor" strokeWidth="0.3" opacity="0.2"
      />
      {/* Mic arm */}
      <path d={`M ${x - 9},${y + 7} C ${x - 9},${y + 14} ${x - 3},${y + 18} ${x},${y + 18} C ${x + 3},${y + 18} ${x + 9},${y + 14} ${x + 9},${y + 7}`}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35" fill="none"
      />
      <line x1={x} y1={y + 18} x2={x} y2={y + 22}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35"
      />

      {/* Animated waveform coming out */}
      <WaveBars x={x + 26} y={y} count={5} maxH={16} gap={4} />

      {/* Label */}
      <text x={x} y={y + 38} textAnchor="middle" className="diagram-voice-label">
        CALLER
      </text>
      <text x={x} y={y + 48} textAnchor="middle"
        fill="currentColor" opacity="0.2" fontSize="6.5"
      >Speaks</text>
    </g>
  );
}

// ─── Voice Out Indicator ─────────────────────────────────────────────────────

function VoiceOutIndicator({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* Background circle */}
      <circle cx={x} cy={y} r="22"
        stroke="currentColor" strokeWidth="0.5" opacity="0.12" fill="currentColor" fillOpacity="0.02"
      />

      {/* Speaker icon (detailed) */}
      <path
        d={`M ${x - 6},${y - 5} L ${x - 6},${y + 5} L ${x - 1},${y + 3} L ${x + 5},${y + 8} L ${x + 5},${y - 8} L ${x - 1},${y - 3} Z`}
        stroke="currentColor" strokeWidth="0.9" opacity="0.5" fill="currentColor" fillOpacity="0.06"
      />
      {/* Sound waves (animated opacity) */}
      <path d={`M ${x + 8},${y - 4} C ${x + 11},${y - 1} ${x + 11},${y + 1} ${x + 8},${y + 4}`}
        stroke="currentColor" strokeWidth="0.7" opacity="0.35" fill="none"
      />
      <path d={`M ${x + 11},${y - 7} C ${x + 15},${y - 3} ${x + 15},${y + 3} ${x + 11},${y + 7}`}
        stroke="currentColor" strokeWidth="0.6" opacity="0.25" fill="none"
      />
      <path d={`M ${x + 14},${y - 10} C ${x + 19},${y - 5} ${x + 19},${y + 5} ${x + 14},${y + 10}`}
        stroke="currentColor" strokeWidth="0.5" opacity="0.15" fill="none"
      />

      {/* Waveform going into speaker */}
      <WaveBars x={x - 50} y={y} count={5} maxH={16} gap={4} />

      {/* Label */}
      <text x={x} y={y + 38} textAnchor="middle" className="diagram-voice-label">
        AGENT
      </text>
      <text x={x} y={y + 48} textAnchor="middle"
        fill="currentColor" opacity="0.2" fontSize="6.5"
      >Responds</text>
    </g>
  );
}

// ─── Main Diagram Component ─────────────────────────────────────────────────

interface AgentComputerDiagramProps {
  className?: string;
}

export function AgentComputerDiagram({ className }: AgentComputerDiagramProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 620 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* ── Defs ──────────────────────────────────────────────────── */}
        <defs>
          {/* Flow paths for animateMotion */}
          <path id="path-vin-stt" d="M 75,265 C 100,265 120,250 155,235" />
          <path id="path-stt-core" d="M 245,235 C 260,245 275,255 290,268" />
          <path id="path-core-tts" d="M 330,268 C 345,255 360,245 375,235" />
          <path id="path-tts-vout" d="M 465,235 C 500,250 520,265 545,265" />
          <path id="path-core-tools" d="M 270,300 C 240,310 200,320 165,330" />
          <path id="path-core-memory" d="M 350,300 C 380,310 420,320 455,330" />
        </defs>

        {/* ── Styles ────────────────────────────────────────────────── */}
        <style>{`
          .diagram-label-text {
            font-size: 12px;
            font-weight: 700;
            fill: currentColor;
            letter-spacing: 0.14em;
          }
          .diagram-label-sub {
            font-size: 9px;
            fill: currentColor;
            opacity: 0.45;
          }
          .diagram-core-label {
            font-size: 20px;
            font-weight: 800;
            fill: currentColor;
            letter-spacing: 0.25em;
          }
          .diagram-voice-label {
            font-size: 11px;
            font-weight: 600;
            fill: currentColor;
            opacity: 0.6;
            letter-spacing: 0.1em;
          }
          @media (max-width: 640px) {
            .diagram-label-sub { display: none; }
            .diagram-peripheral { display: none; }
            .diagram-orbit-2, .diagram-orbit-3 { display: none; }
          }
          @media (min-width: 641px) and (max-width: 1023px) {
            .diagram-orbit-3 { display: none; }
          }
        `}</style>

        {/* ── Layer 1: Base Platform (disc with grid) ──────────────── */}
        <ellipse cx="310" cy="420" rx="260" ry="68"
          stroke="currentColor" strokeWidth="0.6" opacity="0.12"
          fill="currentColor" fillOpacity="0.015"
        />
        <ellipse cx="310" cy="420" rx="220" ry="58"
          stroke="currentColor" strokeWidth="0.4" opacity="0.08"
          strokeDasharray="4 3"
        />
        <ellipse cx="310" cy="420" rx="175" ry="46"
          stroke="currentColor" strokeWidth="0.3" opacity="0.06"
          strokeDasharray="2 4"
        />
        {/* Grid lines on platform */}
        {[-120, -60, 0, 60, 120].map((offset) => (
          <line key={`vgrid-${offset}`}
            x1={310 + offset} y1={420 - 40}
            x2={310 + offset} y2={420 + 40}
            stroke="currentColor" strokeWidth="0.2" opacity="0.04"
          />
        ))}
        {[-25, 0, 25].map((offset) => (
          <ellipse key={`hgrid-${offset}`}
            cx="310" cy={420 + offset} rx={200 - Math.abs(offset) * 2} ry={50 - Math.abs(offset)}
            stroke="currentColor" strokeWidth="0.2" opacity="0.03"
            fill="none"
          />
        ))}

        {/* ── Layer 2: Orbital Rings ──────────────────────────────── */}
        <g className="diagram-orbit-1">
          <ellipse cx="310" cy="290" rx="195" ry="58"
            stroke="currentColor" strokeWidth="0.5" opacity="0.1"
            strokeDasharray="6 4"
            style={{ transformOrigin: "310px 290px", animation: "orbit-rotate 80s linear infinite" }}
          />
        </g>
        <g className="diagram-orbit-2">
          <ellipse cx="310" cy="300" rx="235" ry="72"
            stroke="currentColor" strokeWidth="0.4" opacity="0.06"
            strokeDasharray="8 6"
            style={{ transformOrigin: "310px 300px", animation: "orbit-rotate 120s linear infinite reverse" }}
          />
        </g>
        <g className="diagram-orbit-3">
          <ellipse cx="310" cy="280" rx="160" ry="44"
            stroke="currentColor" strokeWidth="0.3" opacity="0.05"
            strokeDasharray="3 5"
            style={{ transformOrigin: "310px 280px", animation: "orbit-rotate 100s linear infinite" }}
          />
        </g>

        {/* ── Layer 3: Central LLM Core ───────────────────────────── */}
        <LLMCore cx={310} cy={270} />

        {/* ── Layer 4: Capability Modules ─────────────────────────── */}
        {/* STT — top left */}
        <STTModule x={155} y={195} />
        {/* TTS — top right */}
        <TTSModule x={375} y={195} />
        {/* Tools — mid left */}
        <ToolsModule x={80} y={310} />
        {/* Memory — mid right */}
        <MemoryModule x={450} y={310} />
        {/* Telephony — bottom left */}
        <TelephonyModule x={130} y={415} />
        {/* Agents — bottom right */}
        <AgentsModule x={410} y={415} />

        {/* ── Layer 5: Connection Paths ────────────────────────────── */}
        {/* Main pipeline: Voice In → STT → LLM → TTS → Voice Out */}
        <path d="M 75,265 C 100,265 120,250 155,235"
          stroke="currentColor" strokeWidth="1" opacity="0.22"
          strokeDasharray="4 3"
          style={{ animation: "flow-dash 2s linear infinite" }}
        />
        <path d="M 245,235 C 260,245 275,255 290,268"
          stroke="currentColor" strokeWidth="1" opacity="0.22"
          strokeDasharray="4 3"
          style={{ animation: "flow-dash 2s linear infinite", animationDelay: "0.3s" }}
        />
        <path d="M 330,268 C 345,255 360,245 375,235"
          stroke="currentColor" strokeWidth="1" opacity="0.22"
          strokeDasharray="4 3"
          style={{ animation: "flow-dash 2s linear infinite", animationDelay: "0.6s" }}
        />
        <path d="M 465,235 C 500,250 520,265 545,265"
          stroke="currentColor" strokeWidth="1" opacity="0.22"
          strokeDasharray="4 3"
          style={{ animation: "flow-dash 2s linear infinite", animationDelay: "0.9s" }}
        />

        {/* Side connections: LLM ↔ Tools, LLM ↔ Memory */}
        <path d="M 270,300 C 240,310 200,320 165,330"
          stroke="currentColor" strokeWidth="0.8" opacity="0.18"
          strokeDasharray="3 4"
          style={{ animation: "flow-dash 2.5s linear infinite" }}
        />
        <path d="M 350,300 C 380,310 420,320 455,330"
          stroke="currentColor" strokeWidth="0.8" opacity="0.18"
          strokeDasharray="3 4"
          style={{ animation: "flow-dash 2.5s linear infinite", animationDelay: "0.5s" }}
        />

        {/* Peripheral connections */}
        <g className="diagram-peripheral">
          <path d="M 165,385 C 165,405 155,415 150,420"
            stroke="currentColor" strokeWidth="0.4" opacity="0.08"
            strokeDasharray="2 3"
          />
          <path d="M 455,385 C 455,405 465,415 470,420"
            stroke="currentColor" strokeWidth="0.4" opacity="0.08"
            strokeDasharray="2 3"
          />
        </g>

        {/* ── Layer 5b: Flow Dots ──────────────────────────────────── */}
        <FlowDot pathId="path-vin-stt" duration={3} delay={0} size={2.5} />
        <FlowDot pathId="path-stt-core" duration={2.5} delay={0.8} size={3} />
        <FlowDot pathId="path-core-tts" duration={2.5} delay={1.6} size={3} />
        <FlowDot pathId="path-tts-vout" duration={3} delay={2.4} size={2.5} />
        <FlowDot pathId="path-core-tools" duration={3.5} delay={0.5} size={2} />
        <FlowDot pathId="path-core-memory" duration={3.5} delay={1.5} size={2} />

        {/* ── Layer 6: Pulse Nodes ─────────────────────────────────── */}
        {[
          { cx: 155, cy: 235 },
          { cx: 290, cy: 268 },
          { cx: 330, cy: 268 },
          { cx: 465, cy: 235 },
        ].map((node, i) => (
          <circle key={i} cx={node.cx} cy={node.cy} r="3"
            fill="currentColor" opacity="0.3"
            style={{
              transformOrigin: `${node.cx}px ${node.cy}px`,
              animation: "pulse-node 2.5s ease-in-out infinite",
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}

        {/* ── Layer 7: Voice In / Voice Out ─────────────────────────── */}
        <VoiceInIndicator x={48} y={262} />
        <VoiceOutIndicator x={572} y={262} />

        {/* ── Decorative corner brackets ────────────────────────────── */}
        <path d="M 12,12 L 12,38" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
        <path d="M 12,12 L 38,12" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
        <path d="M 608,12 L 608,38" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
        <path d="M 608,12 L 582,12" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
        <path d="M 12,508 L 12,482" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
        <path d="M 12,508 L 38,508" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
        <path d="M 608,508 L 608,482" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />
        <path d="M 608,508 L 582,508" stroke="currentColor" strokeWidth="0.4" opacity="0.1" />

        {/* ── Bottom Title ──────────────────────────────────────────── */}
        <text x="310" y="498" textAnchor="middle"
          fill="currentColor" opacity="0.2" fontSize="9" letterSpacing="0.35em" fontWeight="600"
        >YOUR AI AGENT</text>
      </svg>
    </div>
  );
}
