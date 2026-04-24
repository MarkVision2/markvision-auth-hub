import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { IntensityLevel, Scene } from "../types";

const INTENSITY_SCALE: Record<IntensityLevel, number> = {
  low: 0.03,
  medium: 0.07,
  high: 0.12,
};

interface ZoomProps {
  scenes: Scene[];
  intensity: IntensityLevel;
  children: React.ReactNode;
}

export const Zoom: React.FC<ZoomProps> = ({ scenes, intensity, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const currentScene = scenes.find((scene) => currentTime >= scene.start && currentTime <= scene.end);
  const baseStrength = currentScene?.emotion === "high" ? INTENSITY_SCALE[intensity] : INTENSITY_SCALE[intensity] / 2;
  const rhythmBoost =
    currentScene?.rhythm === "aggressive"
      ? 1.28
      : currentScene?.rhythm === "release"
        ? 0.82
        : 1;
  const sceneStrength = baseStrength * rhythmBoost;
  const frequency =
    currentScene?.rhythm === "aggressive" ? 10 : currentScene?.rhythm === "release" ? 24 : 18;
  const wave = Math.sin(frame / frequency) * sceneStrength;
  const cutPulse = (currentScene?.cutMoments ?? []).reduce((max, point) => {
    const delta = Math.abs(currentTime - point);
    if (delta > 0.16) return max;
    return Math.max(max, interpolate(delta, [0, 0.16], [1, 0], { extrapolateRight: "clamp" }));
  }, 0);
  const punchScale =
    currentScene?.zoomMode === "punch"
      ? interpolate(cutPulse, [0, 1], [1, 1 + sceneStrength * 1.45])
      : currentScene?.zoomMode === "settle"
        ? interpolate(cutPulse, [0, 1], [1, 1 + sceneStrength * 0.8])
        : interpolate(cutPulse, [0, 1], [1, 1 + sceneStrength]);
  const scale = interpolate(wave, [-sceneStrength, sceneStrength], [1, 1 + sceneStrength]) * punchScale;
  const translateX = (currentScene?.rhythm === "aggressive" ? Math.sin(frame / 7) : Math.sin(frame / 18)) * sceneStrength * 140;
  const translateY = cutPulse * (currentScene?.zoomMode === "punch" ? -18 : -10);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};
