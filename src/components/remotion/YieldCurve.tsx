import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const VERTICES = [
  { label: "6M", x: 8, y: 75, rate: "10.50" },
  { label: "1Y", x: 24, y: 65, rate: "11.25" },
  { label: "2Y", x: 42, y: 50, rate: "12.40" },
  { label: "5Y", x: 68, y: 35, rate: "13.25" },
  { label: "10Y", x: 92, y: 22, rate: "13.80" },
];

const GRID_Y = [
  { y: 20, label: "14.0%" },
  { y: 40, label: "12.5%" },
  { y: 60, label: "11.0%" },
  { y: 80, label: "9.5%" },
];

const DRAW_DURATION = 150; // 0–5s at 30fps (slower, more cinematic)
const BADGE_LINGER = 30; // badges stay visible after appearing

function buildCurvePoints(): string {
  // Smooth cubic bezier through vertices
  const pts = VERTICES.map((v) => ({ x: v.x, y: v.y }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  return d;
}

function buildAreaPath(): string {
  const pts = VERTICES.map((v) => ({ x: v.x, y: v.y }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  // Close the area path down to the baseline and back
  const last = pts[pts.length - 1];
  const first = pts[0];
  d += ` L ${last.x} 88 L ${first.x} 88 Z`;
  return d;
}

export function YieldCurve() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Draw progress: 0 → 1 over DRAW_DURATION frames with easing
  const rawProgress = interpolate(frame, [0, DRAW_DURATION], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  // Ease-out for smoother feel
  const drawProgress = 1 - Math.pow(1 - rawProgress, 2);

  // Grid fade-in (first 30 frames)
  const gridOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Chart title fade
  const titleOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Pulse after drawing completes
  const pulseOpacity =
    frame > DRAW_DURATION
      ? 0.85 + 0.15 * Math.sin((frame - DRAW_DURATION) * 0.06)
      : 1;

  // Global fade-out for loop transition
  const fadeOut = interpolate(frame, [390, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const curvePath = buildCurvePoints();
  const areaPath = buildAreaPath();

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
          {/* Area gradient fill */}
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a853" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#d4a853" stopOpacity={0.03} />
          </linearGradient>
          {/* Glow filter for the line */}
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        <g opacity={gridOpacity}>
          {/* Horizontal grid */}
          {GRID_Y.map((g) => (
            <g key={g.label}>
              <line
                x1="5"
                y1={g.y}
                x2="96"
                y2={g.y}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.2"
              />
              <text
                x="3"
                y={g.y + 1.2}
                fill="rgba(255,255,255,0.45)"
                fontSize="2.5"
                fontFamily="var(--font-space-grotesk), monospace"
                textAnchor="end"
              >
                {g.label}
              </text>
            </g>
          ))}
          {/* Vertical grid at vertex x positions */}
          {VERTICES.map((v) => (
            <g key={`grid-${v.label}`}>
              <line
                x1={v.x}
                y1="15"
                x2={v.x}
                y2="88"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.2"
              />
              <text
                x={v.x}
                y="93"
                fill="rgba(255,255,255,0.45)"
                fontSize="2.5"
                fontFamily="var(--font-space-grotesk), monospace"
                textAnchor="middle"
              >
                {v.label}
              </text>
            </g>
          ))}
          {/* Baseline */}
          <line
            x1="5"
            y1="88"
            x2="96"
            y2="88"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.2"
          />
        </g>

        {/* Chart title */}
        <text
          x="6"
          y="13"
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          ETTJ PRÉ — DI Futuro
        </text>

        {/* Area fill (clipped by draw progress) */}
        <clipPath id="drawClip">
          <rect x="0" y="0" width={drawProgress * 100} height="100" />
        </clipPath>
        <path
          d={areaPath}
          fill="url(#areaGrad)"
          clipPath="url(#drawClip)"
        />

        {/* Main curve with glow */}
        <path
          d={curvePath}
          stroke="#d4a853"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          filter="url(#lineGlow)"
          style={{
            strokeDasharray: 200,
            strokeDashoffset: 200 * (1 - drawProgress),
          }}
        />

        {/* Vertices: dot + rate badge */}
        {VERTICES.map((v, i) => {
          const vertexNorm = (v.x - VERTICES[0].x) / (VERTICES[VERTICES.length - 1].x - VERTICES[0].x);
          const appearFrame = vertexNorm * DRAW_DURATION;

          const dotScale = spring({
            frame: frame - appearFrame,
            fps,
            config: { damping: 15, stiffness: 150 },
          });

          // Rate badge fades in, stays visible
          const badgeOpacity = interpolate(
            frame,
            [appearFrame, appearFrame + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <g key={v.label}>
              {/* Outer ring */}
              <circle
                cx={v.x}
                cy={v.y}
                r={1.8 * dotScale}
                fill="none"
                stroke="#d4a853"
                strokeWidth="0.2"
                opacity={0.3 * dotScale}
              />
              {/* Dot */}
              <circle
                cx={v.x}
                cy={v.y}
                r={0.8 * dotScale}
                fill="#d4a853"
              />
              {/* Rate badge */}
              <g opacity={badgeOpacity}>
                <rect
                  x={v.x - 5}
                  y={v.y - 7}
                  width="10"
                  height="4.5"
                  rx="1"
                  fill="rgba(212,168,83,0.2)"
                  stroke="rgba(212,168,83,0.5)"
                  strokeWidth="0.15"
                />
                <text
                  x={v.x}
                  y={v.y - 3.8}
                  fill="#d4a853"
                  fontSize="2.5"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                  opacity={1}
                >
                  {v.rate}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
