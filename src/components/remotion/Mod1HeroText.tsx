import { useCurrentFrame, interpolate } from "remotion";
import { strings } from "@/lib/strings";

// Phase timing (frames at 30fps)
const TITLE_START = 180;     // 6s — after chart has been on screen
const SUBTITLE_START = 230;  // ~7.7s
const FADEOUT_START = 390;   // 13s
const FADEOUT_END = 450;     // 15s

export function Mod1HeroText() {
  const frame = useCurrentFrame();

  const eyebrowOpacity = interpolate(
    frame,
    [TITLE_START, TITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const titleText = strings.mod1Title;
  const titleStart = TITLE_START + 12;
  const titleTotalFrames = 35;
  const titleCharCount = Math.floor(
    interpolate(frame, [titleStart, titleStart + titleTotalFrames], [0, titleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const showCursor =
    frame >= titleStart && frame <= titleStart + titleTotalFrames + 10;
  const cursorOpacity = showCursor ? (Math.sin(frame * 0.4) > 0 ? 1 : 0) : 0;

  const subtitleOpacity = interpolate(
    frame,
    [SUBTITLE_START, SUBTITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const fadeOut = interpolate(
    frame,
    [FADEOUT_START, FADEOUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const slideIn = interpolate(
    frame,
    [TITLE_START - 10, TITLE_START + 20],
    [-30, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const containerOpacity = interpolate(
    frame,
    [TITLE_START - 10, TITLE_START],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "50%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 5%",
        gap: 8,
        zIndex: 2,
        opacity: fadeOut * containerOpacity,
        transform: `translateX(${slideIn}px)`,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          color: "#58f5d1",
          letterSpacing: "0.3em",
          fontSize: 14,
          textTransform: "uppercase",
          fontWeight: 500,
          opacity: eyebrowOpacity,
        }}
      >
        {strings.mod1Eyebrow}
      </span>

      <div style={{ marginTop: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 64,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {titleText.slice(0, titleCharCount)}
          {showCursor && (
            <span style={{ opacity: cursorOpacity, color: "#58f5d1" }}>|</span>
          )}
        </div>
      </div>

      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 18,
          color: "rgba(255,255,255,0.5)",
          fontStyle: "italic",
          fontWeight: 300,
          lineHeight: 1.6,
          maxWidth: 480,
          marginTop: 8,
          opacity: subtitleOpacity,
        }}
      >
        {strings.mod1Subtitle}
      </p>
    </div>
  );
}
