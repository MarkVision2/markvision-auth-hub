import { AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { BrollAsset } from "../types";

interface BrollProps {
  brollAssets: BrollAsset[];
  fps: number;
}

const BrollLayer: React.FC<{ asset: BrollAsset }> = ({ asset }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps: 30, config: { damping: 18, stiffness: 160 } });
  const exitProgress = interpolate(frame, [Math.max(0, durationInFrames - 8), durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });
  const opacity = (asset.opacity ?? 0.82) * enter * exitProgress;
  const cardScale = asset.emphasis === "impact" ? interpolate(enter, [0, 1], [1.08, 1]) : interpolate(enter, [0, 1], [0.96, 1]);
  const driftX =
    asset.emphasis === "impact"
      ? interpolate(frame, [0, durationInFrames], [24, -12], { extrapolateRight: "clamp" })
      : interpolate(frame, [0, durationInFrames], [10, -8], { extrapolateRight: "clamp" });

  if (asset.mode === "cutaway") {
    const anchorStyle =
      asset.anchor === "bottom"
        ? { left: 54, right: 54, bottom: 124, height: 360 }
        : asset.anchor === "top"
          ? { left: 54, right: 54, top: 92, height: 360 }
          : { left: 64, right: 64, top: 132, height: 420 };

    return (
      <AbsoluteFill pointerEvents="none">
        <div
          style={{
            position: "absolute",
            ...anchorStyle,
            borderRadius: 30,
            overflow: "hidden",
            opacity,
            transform: `translateX(${driftX}px) scale(${cardScale})`,
            boxShadow: "0 32px 90px rgba(2, 6, 23, 0.38)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <OffthreadVideo
            src={asset.url}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        opacity,
        overflow: "hidden",
        mixBlendMode: asset.emphasis === "impact" ? "screen" : "normal",
      }}
    >
      <OffthreadVideo
        src={asset.url}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translateX(${driftX}px) scale(${cardScale})`,
          filter: asset.emphasis === "impact" ? "saturate(1.1) contrast(1.08)" : "saturate(0.95)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Broll: React.FC<BrollProps> = ({ brollAssets, fps }) => {
  return (
    <>
      {brollAssets.map((asset, index) => (
        <Sequence
          key={`${asset.url}-${asset.start}-${index}`}
          from={Math.floor(asset.start * fps)}
          durationInFrames={Math.max(1, Math.floor((asset.end - asset.start) * fps))}
        >
          <BrollLayer asset={asset} />
        </Sequence>
      ))}
    </>
  );
};
