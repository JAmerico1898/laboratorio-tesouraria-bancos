import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { strings } from "@/lib/strings";

// Phase timing (frames at 30fps)
const TITLE_START = 90;   // 3s — after curve draws
const TITLE_END = 150;    // 5s
const SUBTITLE_START = 150; // 5s
const SUBTITLE_END = 195;   // 6.5s
const FADEOUT_START = 270;   // 9s
const FADEOUT_END = 300;     // 10s

export function HeroText() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Eyebrow: fade in at TITLE_START ---
  const eyebrowOpacity = interpolate(
    frame,
    [TITLE_START, TITLE_START + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // --- Headline 1: type letter by letter ---
  const h1Text = strings.heroHeadline1;
  const h1TotalFrames = 30; // 1 second to type
  const h1Start = TITLE_START + 15;
  const h1CharCount = Math.floor(
    interpolate(frame, [h1Start, h1Start + h1TotalFrames], [0, h1Text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // --- Headline 2: type letter by letter after h1 ---
  const h2Text = strings.heroHeadline2;
  const h2Start = h1Start + h1TotalFrames + 5;
  const h2TotalFrames = 35;
  const h2CharCount = Math.floor(
    interpolate(frame, [h2Start, h2Start + h2TotalFrames], [0, h2Text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // --- Typing cursor blink ---
  const showCursor =
    frame >= h1Start && frame <= h2Start + h2TotalFrames + 10;
  const cursorOpacity = showCursor ? (Math.sin(frame * 0.4) > 0 ? 1 : 0) : 0;

  // --- Subtitle: word by word ---
  const subtitleWords = strings.heroSubtitle.split(" ");
  const wordDuration = (SUBTITLE_END - SUBTITLE_START) / subtitleWords.length;

  // --- Global fade-out for loop ---
  const fadeOut = interpolate(
    frame,
    [FADEOUT_START, FADEOUT_END],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "55%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 5%",
        gap: 8,
        zIndex: 1,
        opacity: fadeOut,
      }}
    >
      {/* Eyebrow */}
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
        {strings.eyebrow}
      </span>

      {/* Headline */}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {h1Text.slice(0, h1CharCount)}
          {frame >= h1Start && frame < h2Start && (
            <span style={{ opacity: cursorOpacity, color: "#58f5d1" }}>|</span>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            background: "linear-gradient(to right, #58f5d1, #1cd0ad)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {h2Text.slice(0, h2CharCount)}
          {frame >= h2Start && frame < h2Start + h2TotalFrames + 10 && (
            <span
              style={{
                opacity: cursorOpacity,
                WebkitTextFillColor: "#58f5d1",
              }}
            >
              |
            </span>
          )}
        </div>
      </div>

      {/* Subtitle — word by word */}
      <p
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          fontSize: 18,
          color: "rgba(255,255,255,0.5)",
          fontStyle: "italic",
          fontWeight: 300,
          lineHeight: 1.6,
          maxWidth: 480,
          marginTop: 12,
        }}
      >
        {subtitleWords.map((word, i) => {
          const wordStart = SUBTITLE_START + i * wordDuration;
          const wordOpacity = interpolate(
            frame,
            [wordStart, wordStart + 8],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <span key={i} style={{ opacity: wordOpacity }}>
              {word}{" "}
            </span>
          );
        })}
      </p>
    </div>
  );
}
