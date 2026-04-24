import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { AiEditStyle, CaptionBlock, MontageLayoutTemplate, WordTiming } from "../types";

const STYLE_PRESETS: Record<AiEditStyle, { color: string; bg: string; fontSize: number }> = {
  viral: { color: "#fef08a", bg: "rgba(7, 23, 56, 0.82)", fontSize: 70 },
  minimal: { color: "#ffffff", bg: "rgba(15, 23, 42, 0.7)", fontSize: 54 },
  business: { color: "#dbeafe", bg: "rgba(12, 74, 110, 0.75)", fontSize: 58 },
};

interface CaptionsProps {
  words: WordTiming[];
  captionBlocks?: CaptionBlock[];
  style: AiEditStyle;
  layoutTemplate?: MontageLayoutTemplate;
}

const getCaptionLayout = (layoutTemplate: MontageLayoutTemplate | undefined, fontSize: number) => {
  if (layoutTemplate === "triple_demo_stack") {
    return {
      left: 64,
      right: 64,
      top: 842,
      bottom: "auto",
      minHeight: 168,
      fontSize: Math.min(fontSize, 52),
    };
  }

  return {
    left: 56,
    right: 56,
    top: 900,
    bottom: "auto",
    minHeight: 176,
    fontSize: Math.min(fontSize, 56),
  };
};

export const Captions: React.FC<CaptionsProps> = ({ words, captionBlocks = [], style, layoutTemplate }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const activeIndex = words.findIndex((word) => currentTime >= word.start && currentTime <= word.end);
  const activeBlock = captionBlocks.find((block) => currentTime >= block.start && currentTime <= block.end);

  if (activeIndex < 0) {
    return null;
  }

  const preset = STYLE_PRESETS[style];
  const layout = getCaptionLayout(layoutTemplate, preset.fontSize);
  const visibleWords = activeBlock
    ? words.filter((word) => word.start >= activeBlock.start && word.end <= activeBlock.end + 0.04)
    : words.slice(Math.max(0, activeIndex - 1), activeIndex + 2);
  const activeWord = words[activeIndex];
  const animationFrame = frame - Math.floor(activeWord.start * fps);
  const enter = spring({ frame: animationFrame, fps, config: { damping: 11, stiffness: 140 } });
  const scale = interpolate(enter, [0, 1], [0.88, 1]);
  const panelPop = interpolate(enter, [0, 1], [0.92, 1]);

  return (
    <AbsoluteFill pointerEvents="none">
      <div
        style={{
          position: "absolute",
          left: layout.left,
          right: layout.right,
          top: layout.top,
          bottom: layout.bottom,
          padding: "18px 20px",
          borderRadius: 34,
          background:
            activeBlock?.emphasis === "high"
              ? "linear-gradient(180deg, rgba(124, 58, 237, 0.18), rgba(2, 6, 23, 0.68))"
              : "linear-gradient(180deg, rgba(2,6,23,0.22), rgba(2,6,23,0.56))",
          backdropFilter: "blur(18px)",
          minHeight: layout.minHeight,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 48px rgba(2, 6, 23, 0.28)",
          transform: `scale(${panelPop})`,
        }}
      >
        {activeBlock ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              height: "100%",
            }}
          >
            {activeBlock.words.map((rawWord, index) => {
              const matchingWord = visibleWords[index] ?? visibleWords.find((word) => word.word === rawWord);
              const isActive = matchingWord?.start === activeWord.start && matchingWord?.end === activeWord.end;
              const isHighlight =
                activeBlock.highlightWords.includes(rawWord) || matchingWord?.highlight || isActive;
              return (
                <span
                  key={`${rawWord}-${index}-${activeBlock.start}`}
                  style={{
                    padding: isHighlight ? "14px 18px" : "12px 16px",
                    borderRadius: 18,
                    fontSize: isHighlight ? layout.fontSize : Math.max(layout.fontSize - 6, 38),
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    textTransform: "uppercase",
                    background: isHighlight ? preset.bg : "rgba(15, 23, 42, 0.46)",
                    color: isHighlight ? preset.color : "rgba(255,255,255,0.84)",
                    transform: isActive ? `scale(${scale})` : isHighlight ? "scale(1)" : "scale(0.96)",
                    boxShadow: isHighlight ? "0 18px 40px rgba(0, 0, 0, 0.28)" : "none",
                  }}
                >
                  {rawWord}
                </span>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              alignContent: "center",
              height: "100%",
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
                    fontSize: layout.fontSize,
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
        )}
      </div>
    </AbsoluteFill>
  );
};
