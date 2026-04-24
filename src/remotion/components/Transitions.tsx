import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types";

interface TransitionsProps {
  scenes: Scene[];
}

export const Transitions: React.FC<TransitionsProps> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const transitionWindow = 0.22;
  const boundary = scenes.find((scene) => Math.abs(currentTime - scene.start) <= transitionWindow && scene.start > 0);

  if (!boundary) {
    return null;
  }

  const localProgress = 1 - Math.min(Math.abs(currentTime - boundary.start) / transitionWindow, 1);
  const opacity = interpolate(localProgress, [0, 1], [0, boundary.transition === "impact" ? 0.46 : 0.24]);

  if (boundary.transition === "swipe") {
    const translateX = interpolate(localProgress, [0, 1], [380, 0]);
    return (
      <AbsoluteFill
        style={{
          background: "linear-gradient(90deg, rgba(14,165,233,0.32), rgba(255,255,255,0.0))",
          opacity,
          transform: `translateX(${translateX}px)`,
          mixBlendMode: "screen",
        }}
      />
    );
  }

  if (boundary.transition === "impact") {
    const scale = interpolate(localProgress, [0, 1], [1.12, 1]);
    return (
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at center, rgba(250,204,21,0.42), rgba(255,255,255,0.02) 58%)",
          opacity,
          transform: `scale(${scale})`,
          mixBlendMode: "screen",
        }}
      />
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(59,130,246,0.45))",
        opacity,
        mixBlendMode: "screen",
      }}
    />
  );
};
