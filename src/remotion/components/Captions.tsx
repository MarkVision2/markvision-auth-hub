import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { AiEditStyle, WordTiming } from "../types";

const STYLE_PRESETS: Record<AiEditStyle, { color: string; bg: string; fontSize: number }> = {
  viral: { color: "#fef08a", bg: "rgba(7, 23, 56, 0.82)", fontSize: 70 },
  minimal: { color: "#ffffff", bg: "rgba(15, 23, 42, 0.7)", fontSize: 54 },
  business: { color: "#dbeafe", bg: "rgba(12, 74, 110, 0.75)", fontSize: 58 },
};

interface CaptionsProps {
  words: WordTiming[];
  style: AiEditStyle;
}

export const Captions: React.FC<CaptionsProps> = ({ words, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const activeIndex = words.findIndex((word) => currentTime >= word.start && currentTime <= word.end);

  if (activeIndex < 0) {
    return null;
  }

  const preset = STYLE_PRESETS[style];
  const visibleWords = words.slice(Math.max(0, activeIndex - 1), activeIndex + 2);
  const activeWord = words[activeIndex];
  const animationFrame = frame - Math.floor(activeWord.start * fps);
  const enter = spring({ frame: animationFrame, fps, config: { damping: 11, stiffness: 140 } });
  const scale = interpolate(enter, [0, 1], [0.88, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        bottom: 180,
        display: "flex",
        justifyContent: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {visibleWords.map((word, index) => {
        const isActive = activeIndex === Math.max(0, activeIndex - 1) + index;
        return (
          <span
            key={`${word.word}-${word.start}`}
            style={{
              padding: "14px 18px",
              borderRadius: 18,
              fontSize: preset.fontSize,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              background: isActive ? preset.bg : "rgba(15, 23, 42, 0.46)",
              color: isActive ? preset.color : "rgba(255,255,255,0.82)",
              transform: isActive ? `scale(${scale})` : "scale(0.94)",
              boxShadow: isActive ? "0 18px 40px rgba(0, 0, 0, 0.28)" : "none",
            }}
          >
            {word.word}
          </span>
        );
      })}
    </div>
  );
};

