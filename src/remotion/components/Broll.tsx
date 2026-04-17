import { AbsoluteFill, OffthreadVideo, Sequence } from "remotion";
import type { BrollAsset } from "../types";

interface BrollProps {
  brollAssets: BrollAsset[];
  fps: number;
}

export const Broll: React.FC<BrollProps> = ({ brollAssets, fps }) => {
  return (
    <>
      {brollAssets.map((asset, index) => (
        <Sequence
          key={`${asset.url}-${asset.start}-${index}`}
          from={Math.floor(asset.start * fps)}
          durationInFrames={Math.max(1, Math.floor((asset.end - asset.start) * fps))}
        >
          <AbsoluteFill
            style={{
              opacity: asset.opacity ?? 0.72,
              overflow: "hidden",
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
          </AbsoluteFill>
        </Sequence>
      ))}
    </>
  );
};

