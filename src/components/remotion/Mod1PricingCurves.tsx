import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

// PU = 1000 / (1 + rate)^(du/252)
function calcPU(rate: number, du: number): number {
  return 1000 / Math.pow(1 + rate, du / 252);
}

const RATES = [
  { rate: 0.07, color: "#2E8B57", label: "7%" },
  { rate: 0.10, color: "#58f5d1", label: "10%" },
  { rate: 0.13, color: "#d4a853", label: "13%" },
];

const DU_POINTS = [0, 63, 126, 189, 252, 378, 504, 630, 756];

const GRID_X_LABELS = [
  { du: 0, label: "0" },
  { du: 126, label: "126" },
  { du: 252, label: "252" },
  { du: 504, label: "504" },
  { du: 756, label: "756" },
];

const GRID_Y = [
  { pu: 1000, label: "1000" },
  { pu: 850, label: "850" },
  { pu: 700, label: "700" },
];

const CHART = { left: 8, right: 96, top: 15, bottom: 88 };

function duToX(du: number): number {
  return CHART.left + ((du / 756) * (CHART.right - CHART.left));
}

function puToY(pu: number): number {
  const puMax = 1050;
  const puMin = 650;
  return CHART.top + ((puMax - pu) / (puMax - puMin)) * (CHART.bottom - CHART.top);
}

function buildCurvePath(rate: number): string {
  const points = DU_POINTS.map((du) => ({
    x: duToX(du),
    y: puToY(calcPU(rate, du)),
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  return d;
}

function buildAreaPath(rate: number): string {
  const points = DU_POINTS.map((du) => ({
    x: duToX(du),
    y: puToY(calcPU(rate, du)),
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1];
    const c = points[i];
    const cp1x = p.x + (c.x - p.x) * 0.4;
    const cp2x = p.x + (c.x - p.x) * 0.6;
    d += ` C ${cp1x} ${p.y}, ${cp2x} ${c.y}, ${c.x} ${c.y}`;
  }
  const last = points[points.length - 1];
  const first = points[0];
  d += ` L ${last.x} ${CHART.bottom} L ${first.x} ${CHART.bottom} Z`;
  return d;
}

const DRAW_START = 30;
const DRAW_END = 150;
const DRAW_DURATION = DRAW_END - DRAW_START;

export function Mod1PricingCurves() {
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

  const rawProgress = interpolate(frame, [DRAW_START, DRAW_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drawProgress = 1 - Math.pow(1 - rawProgress, 2);

  const crosshairDU = drawProgress * 756;
  const crosshairX = duToX(crosshairDU);
  const crosshairPU = calcPU(0.10, crosshairDU);
  const crosshairY = puToY(crosshairPU);
  const crosshairVisible = frame >= DRAW_START && frame <= DRAW_END + 15;
  const crosshairFade = crosshairVisible
    ? interpolate(
        frame,
        [DRAW_END, DRAW_END + 15],
        [1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  const pulseOpacity =
    frame > DRAW_END
      ? 0.85 + 0.15 * Math.sin((frame - DRAW_END) * 0.06)
      : 1;

  const fadeOut = interpolate(frame, [390, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
          <linearGradient id="mod1AreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58f5d1" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#58f5d1" stopOpacity={0.02} />
          </linearGradient>
          <filter id="mod1Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity={gridOpacity}>
          {GRID_Y.map((g) => {
            const y = puToY(g.pu);
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
          {GRID_X_LABELS.map((g) => {
            const x = duToX(g.du);
            return (
              <g key={g.label}>
                <line
                  x1={x}
                  y1={CHART.top}
                  x2={x}
                  y2={CHART.bottom}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.2"
                />
                <text
                  x={x}
                  y={CHART.bottom + 4}
                  fill="rgba(255,255,255,0.45)"
                  fontSize="2.5"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                >
                  {g.label}
                </text>
              </g>
            );
          })}
          <line
            x1={CHART.left}
            y1={CHART.bottom}
            x2={CHART.right}
            y2={CHART.bottom}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.2"
          />
          <text
            x={(CHART.left + CHART.right) / 2}
            y={CHART.bottom + 8}
            fill="rgba(255,255,255,0.3)"
            fontSize="2.2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="middle"
          >
            Dias Úteis (DU)
          </text>
        </g>

        <text
          x={CHART.left}
          y={CHART.top - 3}
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          {"PU = 1000 / (1 + taxa)"}
          <tspan dy="-2" fontSize="2">(DU/252)</tspan>
        </text>

        <clipPath id="mod1DrawClip">
          <rect x="0" y="0" width={drawProgress * 100} height="100" />
        </clipPath>

        <path
          d={buildAreaPath(0.10)}
          fill="url(#mod1AreaGrad)"
          clipPath="url(#mod1DrawClip)"
        />

        {RATES.map((r) => (
          <path
            key={r.label}
            d={buildCurvePath(r.rate)}
            stroke={r.color}
            strokeWidth="0.6"
            fill="none"
            strokeLinecap="round"
            filter="url(#mod1Glow)"
            style={{
              strokeDasharray: 200,
              strokeDashoffset: 200 * (1 - drawProgress),
            }}
          />
        ))}

        {RATES.map((r) => {
          const endX = duToX(756);
          const endY = puToY(calcPU(r.rate, 756));
          const labelOpacity = interpolate(
            frame,
            [DRAW_END - 10, DRAW_END + 5],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <g key={`label-${r.label}`} opacity={labelOpacity}>
              <rect
                x={endX + 1}
                y={endY - 2.5}
                width="6"
                height="4.5"
                rx="0.8"
                fill="rgba(0,0,0,0.4)"
                stroke={r.color}
                strokeWidth="0.15"
                strokeOpacity={0.5}
              />
              <text
                x={endX + 4}
                y={endY + 0.5}
                fill={r.color}
                fontSize="2.5"
                fontFamily="var(--font-space-grotesk), monospace"
                textAnchor="middle"
              >
                {r.label}
              </text>
            </g>
          );
        })}

        {crosshairVisible && (
          <g opacity={crosshairFade}>
            <line
              x1={crosshairX}
              y1={CHART.top}
              x2={crosshairX}
              y2={CHART.bottom}
              stroke="#58f5d1"
              strokeWidth="0.2"
              strokeDasharray="1,1"
              opacity={0.4}
            />
            <line
              x1={CHART.left}
              y1={crosshairY}
              x2={CHART.right}
              y2={crosshairY}
              stroke="#58f5d1"
              strokeWidth="0.2"
              strokeDasharray="1,1"
              opacity={0.3}
            />
            <circle
              cx={crosshairX}
              cy={crosshairY}
              r="1.5"
              fill="none"
              stroke="#58f5d1"
              strokeWidth="0.2"
              opacity={0.4}
            />
            <circle
              cx={crosshairX}
              cy={crosshairY}
              r="0.7"
              fill="#58f5d1"
            />
            <rect
              x={crosshairX + 1.5}
              y={crosshairY - 4}
              width="12"
              height="4.5"
              rx="0.8"
              fill="rgba(88,245,209,0.15)"
              stroke="rgba(88,245,209,0.4)"
              strokeWidth="0.15"
            />
            <text
              x={crosshairX + 7.5}
              y={crosshairY - 1}
              fill="#58f5d1"
              fontSize="2.5"
              fontFamily="var(--font-space-grotesk), monospace"
              textAnchor="middle"
            >
              {`R$ ${crosshairPU.toFixed(0)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
