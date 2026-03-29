import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const VERTICES = [
  { label: "6M", x: 8, spot: 10.75, fwd: 11.50 },
  { label: "1Y", x: 28, spot: 11.50, fwd: 13.00 },
  { label: "2Y", x: 48, spot: 12.25, fwd: 13.80 },
  { label: "5Y", x: 74, spot: 13.00, fwd: 13.20 },
  { label: "10Y", x: 94, spot: 13.40, fwd: 12.80 },
];

const GRID_Y = [
  { rate: 10.5, label: "10.5%" },
  { rate: 12.0, label: "12.0%" },
  { rate: 13.5, label: "13.5%" },
];

const CHART = { left: 8, right: 96, top: 15, bottom: 88 };
const RATE_MIN = 9.5;
const RATE_MAX = 14.5;

function rateToY(rate: number): number {
  return CHART.top + ((RATE_MAX - rate) / (RATE_MAX - RATE_MIN)) * (CHART.bottom - CHART.top);
}

function buildCurvePath(key: "spot" | "fwd"): string {
  const pts = VERTICES.map((v) => ({ x: v.x, y: rateToY(v[key]) }));
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
  const pts = VERTICES.map((v) => ({ x: v.x, y: rateToY(v.spot) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  const last = pts[pts.length - 1];
  const first = pts[0];
  d += ` L ${last.x} ${CHART.bottom} L ${first.x} ${CHART.bottom} Z`;
  return d;
}

const SPOT_START = 30;
const SPOT_END = 90;
const FWD_START = 90;
const FWD_END = 150;

export function Mod2SpotForward() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const gridOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const spotRaw = interpolate(frame, [SPOT_START, SPOT_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spotProgress = 1 - Math.pow(1 - spotRaw, 2);

  const fwdRaw = interpolate(frame, [FWD_START, FWD_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fwdProgress = 1 - Math.pow(1 - fwdRaw, 2);

  const barsOpacity = interpolate(frame, [FWD_START + 20, FWD_END], [0, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pulseOpacity =
    frame > FWD_END
      ? 0.85 + 0.15 * Math.sin((frame - FWD_END) * 0.06)
      : 1;

  const fadeOut = interpolate(frame, [390, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const spotPath = buildCurvePath("spot");
  const fwdPath = buildCurvePath("fwd");
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
          <linearGradient id="mod2SpotArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58f5d1" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#58f5d1" stopOpacity={0.02} />
          </linearGradient>
          <filter id="mod2Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid */}
        <g opacity={gridOpacity}>
          {GRID_Y.map((g) => {
            const y = rateToY(g.rate);
            return (
              <g key={g.label}>
                <line
                  x1={CHART.left}
                  y1={y}
                  x2={CHART.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.2"
                />
                <text
                  x={CHART.left - 1.5}
                  y={y + 1}
                  fill="rgba(255,255,255,0.45)"
                  fontSize="2.5"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="end"
                >
                  {g.label}
                </text>
              </g>
            );
          })}
          {VERTICES.map((v) => (
            <g key={`grid-${v.label}`}>
              <line
                x1={v.x}
                y1={CHART.top}
                x2={v.x}
                y2={CHART.bottom}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.2"
              />
              <text
                x={v.x}
                y={CHART.bottom + 4}
                fill="rgba(255,255,255,0.45)"
                fontSize="2.5"
                fontFamily="var(--font-space-grotesk), monospace"
                textAnchor="middle"
              >
                {v.label}
              </text>
            </g>
          ))}
          <line
            x1={CHART.left}
            y1={CHART.bottom}
            x2={CHART.right}
            y2={CHART.bottom}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.2"
          />
        </g>

        {/* Chart title */}
        <text
          x={CHART.left}
          y={CHART.top - 3}
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          Spot × Forward — DI Futuro
        </text>

        {/* Legend */}
        <g opacity={titleOpacity}>
          <line x1="68" y1={CHART.top - 4} x2="74" y2={CHART.top - 4} stroke="#58f5d1" strokeWidth="0.5" />
          <text x="75.5" y={CHART.top - 2.8} fill="rgba(255,255,255,0.45)" fontSize="2.2" fontFamily="var(--font-space-grotesk), monospace">
            Spot
          </text>
          <line x1="82" y1={CHART.top - 4} x2="88" y2={CHART.top - 4} stroke="#d4a853" strokeWidth="0.5" strokeDasharray="1.5,1" />
          <text x="89.5" y={CHART.top - 2.8} fill="rgba(255,255,255,0.45)" fontSize="2.2" fontFamily="var(--font-space-grotesk), monospace">
            Forward
          </text>
        </g>

        {/* Forward rate bars */}
        {VERTICES.slice(0, -1).map((v, i) => {
          const next = VERTICES[i + 1];
          const fwdY = rateToY(next.fwd);
          const barX = v.x + (next.x - v.x) * 0.15;
          const barW = (next.x - v.x) * 0.7;
          return (
            <rect
              key={`bar-${v.label}`}
              x={barX}
              y={fwdY}
              width={barW}
              height={CHART.bottom - fwdY}
              rx="0.5"
              fill="#d4a853"
              opacity={barsOpacity * 0.08}
            />
          );
        })}

        {/* Spot clip */}
        <clipPath id="mod2SpotClip">
          <rect x="0" y="0" width={spotProgress * 100} height="100" />
        </clipPath>

        {/* Spot area fill */}
        <path
          d={areaPath}
          fill="url(#mod2SpotArea)"
          clipPath="url(#mod2SpotClip)"
        />

        {/* Spot curve */}
        <path
          d={spotPath}
          stroke="#58f5d1"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          filter="url(#mod2Glow)"
          style={{
            strokeDasharray: 200,
            strokeDashoffset: 200 * (1 - spotProgress),
          }}
        />

        {/* Forward curve clip for draw animation */}
        <clipPath id="mod2FwdClip">
          <rect x="0" y="0" width={fwdProgress * 100} height="100" />
        </clipPath>

        {/* Forward curve (dashed, traced via clipPath) */}
        <path
          d={fwdPath}
          stroke="#d4a853"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="2,1.2"
          filter="url(#mod2Glow)"
          clipPath="url(#mod2FwdClip)"
        />

        {/* Spot vertex dots + rate badges */}
        {VERTICES.map((v) => {
          const spotY = rateToY(v.spot);
          const vertexNorm = (v.x - VERTICES[0].x) / (VERTICES[VERTICES.length - 1].x - VERTICES[0].x);
          const appearFrame = SPOT_START + vertexNorm * (SPOT_END - SPOT_START);
          const dotScale = spring({
            frame: frame - appearFrame,
            fps,
            config: { damping: 15, stiffness: 150 },
          });
          const badgeOpacity = interpolate(
            frame,
            [SPOT_END - 5, SPOT_END + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <g key={`spot-${v.label}`}>
              <circle cx={v.x} cy={spotY} r={0.8 * dotScale} fill="#58f5d1" />
              <circle
                cx={v.x}
                cy={spotY}
                r={1.8 * dotScale}
                fill="none"
                stroke="#58f5d1"
                strokeWidth="0.15"
                opacity={0.3 * dotScale}
              />
              <g opacity={badgeOpacity}>
                <rect
                  x={v.x - 4.5}
                  y={spotY + 2}
                  width="9"
                  height="4"
                  rx="0.8"
                  fill="rgba(88,245,209,0.15)"
                  stroke="rgba(88,245,209,0.4)"
                  strokeWidth="0.12"
                />
                <text
                  x={v.x}
                  y={spotY + 4.8}
                  fill="#58f5d1"
                  fontSize="2.2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                >
                  {v.spot.toFixed(2)}
                </text>
              </g>
            </g>
          );
        })}

        {/* Forward vertex dots + rate badges */}
        {VERTICES.map((v) => {
          const fwdY = rateToY(v.fwd);
          const spotY = rateToY(v.spot);
          const vertexNorm = (v.x - VERTICES[0].x) / (VERTICES[VERTICES.length - 1].x - VERTICES[0].x);
          const appearFrame = FWD_START + vertexNorm * (FWD_END - FWD_START);
          const dotScale = spring({
            frame: frame - appearFrame,
            fps,
            config: { damping: 15, stiffness: 150 },
          });
          const badgeOpacity = interpolate(
            frame,
            [FWD_END - 5, FWD_END + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          // Place badge above dot normally, but if too close to spot badge below,
          // push it further up to avoid overlap
          const gap = Math.abs(fwdY - spotY);
          const badgeOffsetY = gap < 10 ? -9 : -6;
          return (
            <g key={`fwd-${v.label}`}>
              <circle cx={v.x} cy={fwdY} r={0.8 * dotScale} fill="#d4a853" />
              <g opacity={badgeOpacity}>
                <rect
                  x={v.x - 4.5}
                  y={fwdY + badgeOffsetY}
                  width="9"
                  height="4"
                  rx="0.8"
                  fill="rgba(212,168,83,0.15)"
                  stroke="rgba(212,168,83,0.4)"
                  strokeWidth="0.12"
                />
                <text
                  x={v.x}
                  y={fwdY + badgeOffsetY + 2.8}
                  fill="#d4a853"
                  fontSize="2.2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                >
                  {v.fwd.toFixed(2)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
