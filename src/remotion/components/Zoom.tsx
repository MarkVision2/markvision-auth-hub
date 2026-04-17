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
  const sceneStrength = currentScene?.emotion === "high" ? INTENSITY_SCALE[intensity] : INTENSITY_SCALE[intensity] / 2;
  const wave = Math.sin(frame / 18) * sceneStrength;
  const scale = interpolate(wave, [-sceneStrength, sceneStrength], [1, 1 + sceneStrength]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};

