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
  const blockWords = activeBlock?.words ?? visibleWords.map((word) => word.word);
  const splitAt = activeBlock?.lineBreakAfter ?? Math.ceil(blockWords.length / 2);
  const lines = [blockWords.slice(0, splitAt), blockWords.slice(splitAt)].filter((line) => line.length > 0);
  const sceneTone =
    activeBlock?.sceneType === "hook"
      ? {
          panel: "linear-gradient(180deg, rgba(124, 58, 237, 0.22), rgba(2, 6, 23, 0.78))",
          border: "rgba(250, 204, 21, 0.24)",
        }
      : activeBlock?.sceneType === "cta"
        ? {
            panel: "linear-gradient(180deg, rgba(14, 165, 233, 0.18), rgba(2, 6, 23, 0.82))",
            border: "rgba(125, 211, 252, 0.22)",
          }
        : {
            panel:
              activeBlock?.emphasis === "high"
                ? "linear-gradient(180deg, rgba(124, 58, 237, 0.18), rgba(2, 6, 23, 0.68))"
                : "linear-gradient(180deg, rgba(2,6,23,0.22), rgba(2,6,23,0.56))",
            border: "rgba(255,255,255,0.08)",
          };

  const renderWord = (rawWord: string, key: string) => {
    const matchingWord = visibleWords.find((word) => word.word === rawWord) ?? visibleWords[0];
    const isActive = matchingWord?.start === activeWord.start && matchingWord?.end === activeWord.end;
    const isDominant = activeBlock?.dominantWord === rawWord;
    const isHighlight =
      activeBlock?.highlightWords.includes(rawWord) || matchingWord?.highlight || isActive;
    const isPrimary = matchingWord?.emphasis === "primary" || isDominant;

    return (
      <span
        key={key}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isPrimary ? "14px 18px" : isHighlight ? "13px 17px" : "10px 14px",
          borderRadius: isPrimary ? 20 : 16,
          fontSize: isPrimary ? layout.fontSize : isHighlight ? Math.max(layout.fontSize - 4, 40) : Math.max(layout.fontSize - 10, 34),
          lineHeight: 1,
          fontWeight: 950,
          letterSpacing: isPrimary ? "-0.06em" : "-0.045em",
          textTransform: "uppercase",
          background: isPrimary
            ? "#facc15"
            : isHighlight
              ? preset.bg
              : "rgba(15, 23, 42, 0.42)",
          color: isPrimary ? "#0f172a" : isHighlight ? preset.color : "rgba(255,255,255,0.86)",
          transform: isActive ? `scale(${scale}) translateY(-4px)` : isPrimary ? "scale(1.03)" : isHighlight ? "scale(1)" : "scale(0.96)",
          boxShadow: isPrimary
            ? "0 20px 44px rgba(250, 204, 21, 0.26)"
            : isHighlight
              ? "0 18px 40px rgba(0, 0, 0, 0.28)"
              : "none",
          border: isPrimary ? "1px solid rgba(255,255,255,0.28)" : "1px solid transparent",
          textShadow: isPrimary ? "none" : "0 2px 12px rgba(0,0,0,0.28)",
        }}
      >
        {rawWord}
      </span>
    );
  };

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
          background: sceneTone.panel,
          backdropFilter: "blur(18px)",
          minHeight: layout.minHeight,
          border: `1px solid ${sceneTone.border}`,
          boxShadow: "0 18px 48px rgba(2, 6, 23, 0.28)",
          transform: `scale(${panelPop})`,
        }}
      >
        {activeBlock ? (
          <div
            style={{
              display: "grid",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              height: "100%",
            }}
          >
            {lines.map((line, lineIndex) => (
              <div
                key={`${activeBlock.id}-line-${lineIndex}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {line.map((rawWord, index) =>
                  renderWord(rawWord, `${activeBlock.id}-${lineIndex}-${index}-${rawWord}`),
                )}
              </div>
            ))}
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
            {visibleWords.map((word, index) => renderWord(word.word, `${word.word}-${word.start}-${index}`))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
