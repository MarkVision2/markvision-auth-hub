import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene } from "../types";

interface TransitionsProps {
  scenes: Scene[];
}

export const Transitions: React.FC<TransitionsProps> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const transitionWindow = 0.18;
  const boundary = scenes.find((scene) => Math.abs(currentTime - scene.start) <= transitionWindow && scene.start > 0);

  if (!boundary) {
    return null;
  }

  const localProgress = 1 - Math.min(Math.abs(currentTime - boundary.start) / transitionWindow, 1);
  const opacity = interpolate(localProgress, [0, 1], [0, 0.2]);

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

