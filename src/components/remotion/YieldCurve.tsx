import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const VERTICES = [
  { label: "6M", x: 15, y: 78 },
  { label: "1Y", x: 30, y: 65 },
  { label: "2Y", x: 50, y: 50 },
  { label: "5Y", x: 75, y: 35 },
  { label: "10Y", x: 95, y: 22 },
];

// Duration of the curve drawing phase in frames
const DRAW_DURATION = 90; // 0–3s at 30fps
const LABEL_VISIBLE_FRAMES = 15; // ~0.5s

function buildPathD(): string {
  const points = VERTICES.map((v) => ({ x: v.x, y: v.y }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    const cpY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${cpX} ${cpY}`;
  }
  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  d += ` Q ${(secondLast.x + last.x) / 2 + 5} ${last.y + 5}, ${last.x} ${last.y}`;
  return d;
}

export function YieldCurve() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drawProgress = interpolate(frame, [0, DRAW_DURATION], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pulseOpacity =
    frame > DRAW_DURATION
      ? 0.7 + 0.3 * Math.sin((frame - DRAW_DURATION) * 0.08)
      : 1;

  const pathD = buildPathD();

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: "65%",
        height: "100%",
        opacity: pulseOpacity,
      }}
    >
      <path
        d={pathD}
        stroke="#d4a853"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        style={{
          strokeDasharray: 300,
          strokeDashoffset: 300 * (1 - drawProgress),
        }}
      />

      {VERTICES.map((v, i) => {
        const vertexProgress = (i + 1) / VERTICES.length;
        const appearFrame = vertexProgress * DRAW_DURATION;

        const dotScale = spring({
          frame: frame - appearFrame,
          fps,
          config: { damping: 12, stiffness: 200 },
        });

        const labelOpacity = interpolate(
          frame,
          [
            appearFrame,
            appearFrame + 5,
            appearFrame + LABEL_VISIBLE_FRAMES,
            appearFrame + LABEL_VISIBLE_FRAMES + 10,
          ],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <g key={v.label}>
            <circle
              cx={v.x}
              cy={v.y}
              r={1.2 * dotScale}
              fill="#d4a853"
            />
            <circle
              cx={v.x}
              cy={v.y}
              r={2.5 * dotScale}
              fill="#d4a853"
              opacity={0.2 * dotScale}
            />
            <text
              x={v.x}
              y={v.y - 4}
              textAnchor="middle"
              fill="#d4a853"
              fontSize="3.5"
              fontFamily="var(--font-space-grotesk), monospace"
              opacity={labelOpacity}
            >
              {v.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
