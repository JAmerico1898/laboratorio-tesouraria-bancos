import { useCurrentFrame, interpolate } from "remotion";

// Chart area in SVG viewBox units (0–100)
const CHART = { left: 10, right: 96, top: 10, bottom: 90 };

// Axis ranges
const RATE_MIN = -0.02; // -200bps
const RATE_MAX = 0.02;  // +200bps
const PU_MIN = -0.15;   // -15%
const PU_MAX = 0.15;    // +15%

// Duration and convexity parameters
const DURATION = 6;
const CONVEXITY = 50;

function rateToX(rate: number): number {
  return CHART.left + ((rate - RATE_MIN) / (RATE_MAX - RATE_MIN)) * (CHART.right - CHART.left);
}

function puToY(pu: number): number {
  return CHART.top + ((PU_MAX - pu) / (PU_MAX - PU_MIN)) * (CHART.bottom - CHART.top);
}

// Duration line: ΔPU = -duration × Δrate
function durationPU(rate: number): number {
  return -DURATION * rate;
}

// Convexity curve: ΔPU = -duration × Δrate + 0.5 × convexity × Δrate²
function convexityPU(rate: number): number {
  return -DURATION * rate + 0.5 * CONVEXITY * rate * rate;
}

// Build SVG path from a function sampled at many points
function buildFnPath(fn: (rate: number) => number, steps: number): string {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const rate = RATE_MIN + (i / steps) * (RATE_MAX - RATE_MIN);
    pts.push({ x: rateToX(rate), y: puToY(fn(rate)) });
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

// Build area path between duration line and convexity curve
function buildGainArea(steps: number): string {
  const convPts: { x: number; y: number }[] = [];
  const durPts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const rate = RATE_MIN + (i / steps) * (RATE_MAX - RATE_MIN);
    convPts.push({ x: rateToX(rate), y: puToY(convexityPU(rate)) });
    durPts.push({ x: rateToX(rate), y: puToY(durationPU(rate)) });
  }
  // Forward along convexity curve, backward along duration line
  let d = `M ${convPts[0].x} ${convPts[0].y}`;
  for (let i = 1; i < convPts.length; i++) {
    d += ` L ${convPts[i].x} ${convPts[i].y}`;
  }
  for (let i = durPts.length - 1; i >= 0; i--) {
    d += ` L ${durPts[i].x} ${durPts[i].y}`;
  }
  d += " Z";
  return d;
}

const GRID_RATES = [-0.02, -0.01, 0, 0.01, 0.02];
const GRID_RATE_LABELS = ["-200", "-100", "0", "+100", "+200"];
const GRID_PU = [-0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15];
const GRID_PU_LABELS = ["-15%", "-10%", "-5%", "0%", "+5%", "+10%", "+15%"];

// Animation timing
const DUR_START = 30;
const DUR_END = 90;
const CONV_START = 90;
const CONV_END = 150;

export function Mod4Sensitivity() {
  const frame = useCurrentFrame();

  // Grid fade-in
  const gridOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title fade
  const titleOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Duration line draw (from center outward)
  const durProgress = interpolate(frame, [DUR_START, DUR_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const durEased = 1 - Math.pow(1 - durProgress, 2);

  // Convexity curve draw (from center outward)
  const convProgress = interpolate(frame, [CONV_START, CONV_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const convEased = 1 - Math.pow(1 - convProgress, 2);

  // Gain area fade
  const gainOpacity = interpolate(frame, [CONV_START + 30, CONV_END + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Labels fade
  const labelOpacity = interpolate(frame, [CONV_END - 10, CONV_END + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse after drawn
  const pulseOpacity =
    frame > CONV_END
      ? 0.85 + 0.15 * Math.sin((frame - CONV_END) * 0.06)
      : 1;

  // Fade-out for loop
  const fadeOut = interpolate(frame, [390, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const durationPath = buildFnPath(durationPU, 50);
  const convexityPath = buildFnPath(convexityPU, 50);
  const gainAreaPath = buildGainArea(50);

  // Center coordinates
  const centerX = rateToX(0);
  const centerY = puToY(0);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: fadeOut * pulseOpacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: "96%",
          height: "90%",
          overflow: "visible",
        }}
      >
        <defs>
          <filter id="mod4Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="mod4GainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a853" stopOpacity={0.2} />
            <stop offset="50%" stopColor="#d4a853" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#d4a853" stopOpacity={0.2} />
          </linearGradient>
        </defs>

        {/* Grid */}
        <g opacity={gridOpacity}>
          {/* Horizontal grid lines */}
          {GRID_PU.map((pu, i) => {
            const y = puToY(pu);
            const isCenter = pu === 0;
            return (
              <g key={`gy-${i}`}>
                <line
                  x1={CHART.left}
                  y1={y}
                  x2={CHART.right}
                  y2={y}
                  stroke={isCenter ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}
                  strokeWidth={isCenter ? "0.25" : "0.15"}
                />
                <text
                  x={CHART.left - 1.5}
                  y={y + 0.8}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="end"
                >
                  {GRID_PU_LABELS[i]}
                </text>
              </g>
            );
          })}
          {/* Vertical grid lines */}
          {GRID_RATES.map((rate, i) => {
            const x = rateToX(rate);
            const isCenter = rate === 0;
            return (
              <g key={`gx-${i}`}>
                <line
                  x1={x}
                  y1={CHART.top}
                  x2={x}
                  y2={CHART.bottom}
                  stroke={isCenter ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}
                  strokeWidth={isCenter ? "0.25" : "0.15"}
                />
                <text
                  x={x}
                  y={CHART.bottom + 3.5}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                >
                  {GRID_RATE_LABELS[i]}
                </text>
              </g>
            );
          })}
          {/* Axis labels */}
          <text
            x={(CHART.left + CHART.right) / 2}
            y={CHART.bottom + 7}
            fill="rgba(255,255,255,0.3)"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="middle"
          >
            Δ Taxa (bps)
          </text>
          <text
            x={CHART.left - 1}
            y={CHART.top - 2}
            fill="rgba(255,255,255,0.3)"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="end"
          >
            ΔPU
          </text>
        </g>

        {/* Chart title */}
        <text
          x={CHART.left}
          y={CHART.top - 5}
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          {"Sensibilidade — ΔPU vs ΔTaxa"}
        </text>

        {/* Convexity gain area (between the two curves) */}
        <path
          d={gainAreaPath}
          fill="url(#mod4GainGrad)"
          opacity={gainOpacity}
        />

        {/* Duration line (dashed teal) — clip from center outward */}
        <clipPath id="mod4DurClip">
          <rect
            x={centerX - durEased * (centerX - CHART.left)}
            y="0"
            width={durEased * (CHART.right - CHART.left)}
            height="100"
          />
        </clipPath>
        <path
          d={durationPath}
          stroke="#58f5d1"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="1.5,1"
          filter="url(#mod4Glow)"
          clipPath="url(#mod4DurClip)"
        />

        {/* Convexity curve (solid amber) — clip from center outward */}
        <clipPath id="mod4ConvClip">
          <rect
            x={centerX - convEased * (centerX - CHART.left)}
            y="0"
            width={convEased * (CHART.right - CHART.left)}
            height="100"
          />
        </clipPath>
        <path
          d={convexityPath}
          stroke="#d4a853"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          filter="url(#mod4Glow)"
          clipPath="url(#mod4ConvClip)"
        />

        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="0.8"
          fill="white"
          opacity={gridOpacity * 0.6}
        />

        {/* Labels */}
        <g opacity={labelOpacity}>
          <text
            x={rateToX(0.019)}
            y={puToY(durationPU(0.02)) + 3}
            fill="#58f5d1"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="end"
            opacity={0.8}
          >
            Duration
          </text>
          <text
            x={rateToX(0.019)}
            y={puToY(convexityPU(0.02)) - 2}
            fill="#d4a853"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="end"
          >
            Duration + Convexidade
          </text>
        </g>
      </svg>
    </div>
  );
}
