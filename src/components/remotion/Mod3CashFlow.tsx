import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const COUPON = 48.81;
const FINAL = 1048.81;

const FLOWS = [
  { date: "Jul/25", amount: COUPON, isFinal: false },
  { date: "Jan/26", amount: COUPON, isFinal: false },
  { date: "Jul/26", amount: COUPON, isFinal: false },
  { date: "Jan/27", amount: COUPON, isFinal: false },
  { date: "Jul/27", amount: COUPON, isFinal: false },
  { date: "Jan/28", amount: COUPON, isFinal: false },
  { date: "Jul/28", amount: COUPON, isFinal: false },
  { date: "Jan/29", amount: FINAL, isFinal: true },
];

const CHART = { left: 8, right: 96, top: 12, bottom: 85 };
const MAX_AMOUNT = 1100; // for y-axis scaling

const GRID_Y = [
  { amount: 200, label: "200" },
  { amount: 500, label: "500" },
  { amount: 1000, label: "1000" },
];

function amountToHeight(amount: number): number {
  return (amount / MAX_AMOUNT) * (CHART.bottom - CHART.top);
}

function amountToY(amount: number): number {
  return CHART.bottom - amountToHeight(amount);
}

// Bar positions evenly spaced
function barX(index: number): number {
  const totalBars = FLOWS.length;
  const usableWidth = CHART.right - CHART.left - 10; // padding
  const spacing = usableWidth / totalBars;
  return CHART.left + 5 + index * spacing;
}

const BAR_WIDTH = 7;

// Animation timing
const GRID_FADE_END = 30;
const BARS_START = 30;
const BAR_INTERVAL = 12; // frames between each bar appearing
const FINAL_BAR_START = BARS_START + 7 * BAR_INTERVAL; // after 7 coupon bars
const PU_BADGE_START = 140;

export function Mod3CashFlow() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Grid fade-in
  const gridOpacity = interpolate(frame, [0, GRID_FADE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title fade
  const titleOpacity = interpolate(frame, [5, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // PU badge fade
  const puBadgeOpacity = interpolate(frame, [PU_BADGE_START, PU_BADGE_START + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse after all bars drawn
  const allDrawn = frame > FINAL_BAR_START + 30;
  const pulseOpacity = allDrawn
    ? 0.85 + 0.15 * Math.sin((frame - FINAL_BAR_START - 30) * 0.06)
    : 1;

  // Fade-out for loop
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
          <filter id="mod3Glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="mod3CouponGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#58f5d1" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#58f5d1" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient id="mod3FinalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a853" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#d4a853" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        {/* Grid */}
        <g opacity={gridOpacity}>
          {GRID_Y.map((g) => {
            const y = amountToY(g.amount);
            return (
              <g key={g.label}>
                <line
                  x1={CHART.left}
                  y1={y}
                  x2={CHART.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.15"
                />
                <text
                  x={CHART.left - 1}
                  y={y + 0.8}
                  fill="rgba(255,255,255,0.35)"
                  fontSize="2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="end"
                >
                  {g.label}
                </text>
              </g>
            );
          })}
          {/* Baseline */}
          <line
            x1={CHART.left}
            y1={CHART.bottom}
            x2={CHART.right}
            y2={CHART.bottom}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="0.2"
          />
          {/* Y-axis label */}
          <text
            x={CHART.left - 1}
            y={CHART.top}
            fill="rgba(255,255,255,0.25)"
            fontSize="1.8"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="end"
          >
            R$
          </text>
        </g>

        {/* Chart title */}
        <text
          x={CHART.left}
          y={CHART.top - 2}
          fill="rgba(255,255,255,0.5)"
          fontSize="3"
          fontFamily="var(--font-space-grotesk), monospace"
          opacity={titleOpacity}
        >
          Fluxo de Caixa — NTN-F 2029
        </text>

        {/* Cash flow bars */}
        {FLOWS.map((flow, i) => {
          const x = barX(i);
          const barAppearFrame = flow.isFinal ? FINAL_BAR_START : BARS_START + i * BAR_INTERVAL;
          const barScale = spring({
            frame: frame - barAppearFrame,
            fps,
            config: { damping: 12, stiffness: 120 },
          });
          const h = amountToHeight(flow.amount) * barScale;
          const y = CHART.bottom - h;

          return (
            <g key={`bar-${i}`}>
              {/* Bar */}
              <rect
                x={x - BAR_WIDTH / 2}
                y={y}
                width={BAR_WIDTH}
                height={h}
                rx="0.5"
                fill={flow.isFinal ? "url(#mod3FinalGrad)" : "url(#mod3CouponGrad)"}
                filter="url(#mod3Glow)"
              />
              {/* Amount label above bar */}
              {barScale > 0.5 && (
                <text
                  x={x}
                  y={y - 1.5}
                  fill={flow.isFinal ? "#d4a853" : "#58f5d1"}
                  fontSize="2"
                  fontFamily="var(--font-space-grotesk), monospace"
                  textAnchor="middle"
                  opacity={interpolate(barScale, [0.5, 1], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })}
                >
                  {flow.amount.toFixed(0) === "49" ? "48.81" : flow.amount.toFixed(0) === "1049" ? "1048.81" : flow.amount.toFixed(2)}
                </text>
              )}
              {/* Date label below baseline */}
              <text
                x={x}
                y={CHART.bottom + 3.5}
                fill="rgba(255,255,255,0.4)"
                fontSize="1.8"
                fontFamily="var(--font-space-grotesk), monospace"
                textAnchor="middle"
                opacity={gridOpacity}
              >
                {flow.date}
              </text>
            </g>
          );
        })}

        {/* PU Result Badge */}
        <g opacity={puBadgeOpacity}>
          <rect
            x="35"
            y={CHART.top + 2}
            width="30"
            height="10"
            rx="1.5"
            fill="rgba(88,245,209,0.1)"
            stroke="rgba(88,245,209,0.35)"
            strokeWidth="0.15"
          />
          <text
            x="50"
            y={CHART.top + 7}
            fill="#58f5d1"
            fontSize="2.8"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="middle"
            fontWeight="bold"
          >
            PU = R$ 987,32
          </text>
          <text
            x="50"
            y={CHART.top + 10.5}
            fill="rgba(255,255,255,0.4)"
            fontSize="2"
            fontFamily="var(--font-space-grotesk), monospace"
            textAnchor="middle"
          >
            Taxa: 12.50% a.a.
          </text>
        </g>
      </svg>
    </div>
  );
}
