import { AbsoluteFill, Audio, OffthreadVideo, Sequence } from "remotion";
import { Broll } from "../components/Broll";
import { Captions } from "../components/Captions";
import { Transitions } from "../components/Transitions";
import { Zoom } from "../components/Zoom";
import type { AutoEditCompositionProps } from "../types";

const SFX_MAP = {
  whoosh: "https://remotion.media/whoosh.wav",
  ding: "https://remotion.media/ding.wav",
  impact: "https://remotion.media/vine-boom.wav",
};

const cardShell = {
  position: "absolute" as const,
  left: 36,
  right: 36,
  overflow: "hidden" as const,
  borderRadius: 34,
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.38)",
  backgroundColor: "rgba(2, 6, 23, 0.78)",
};

const labelStyle = {
  position: "absolute" as const,
  left: 20,
  top: 18,
  zIndex: 3,
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "white",
  background: "rgba(2, 6, 23, 0.68)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const FrameLabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={labelStyle}>{text}</div>
);

const LayerVideo: React.FC<{
  src: string;
  fit?: "cover" | "contain";
  muted?: boolean;
  zoom?: boolean;
  scenes: AutoEditCompositionProps["scenes"];
  intensity: AutoEditCompositionProps["intensity"];
}> = ({ src, fit = "cover", muted = true, zoom = false, scenes, intensity = "medium" }) => {
  const videoNode = (
    <OffthreadVideo
      src={src}
      muted={muted}
      style={{
        width: "100%",
        height: "100%",
        objectFit: fit,
      }}
    />
  );

  if (!zoom) {
    return videoNode;
  }

  return (
    <Zoom scenes={scenes} intensity={intensity}>
      {videoNode}
    </Zoom>
  );
};

export const AutoEdit: React.FC<AutoEditCompositionProps> = ({
  videoUrl,
  scenes,
  words,
  brollAssets,
  demoVideos = [],
  captionBlocks = [],
  sfxCues = [],
  customSfxUrl = null,
  style,
  intensity = "medium",
  layoutTemplate = "split_demo_top",
}) => {
  const topDemoUrl = demoVideos.find((clip) => clip.slot === "top")?.url ?? videoUrl;
  const bottomDemoUrl =
    demoVideos.find((clip) => clip.slot === "bottom")?.url ??
    demoVideos.find((clip) => clip.slot === "top")?.url ??
    videoUrl;

  return (
    <AbsoluteFill style={{ backgroundColor: "#020617", overflow: "hidden" }}>
      <OffthreadVideo
        src={videoUrl}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(28px) brightness(0.45)",
          transform: "scale(1.08)",
        }}
      />

      {layoutTemplate === "triple_demo_stack" ? (
        <>
          <div
            style={{
              ...cardShell,
              top: 34,
              height: 452,
            }}
          >
            <FrameLabel text="Демонстрация 1" />
            <LayerVideo src={topDemoUrl} scenes={scenes} intensity={intensity} />
          </div>

          <div
            style={{
              ...cardShell,
              top: 532,
              height: 712,
              left: 72,
              right: 72,
            }}
          >
            <FrameLabel text="Эксперт" />
            <LayerVideo
              src={videoUrl}
              fit="contain"
              muted={false}
              zoom
              scenes={scenes}
              intensity={intensity}
            />
          </div>

          <div
            style={{
              ...cardShell,
              bottom: 34,
              height: 452,
            }}
          >
            <FrameLabel text="Демонстрация 2" />
            <LayerVideo src={bottomDemoUrl} scenes={scenes} intensity={intensity} />
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              ...cardShell,
              top: 34,
              height: 842,
            }}
          >
            <FrameLabel text="Демонстрация" />
            <LayerVideo src={topDemoUrl} scenes={scenes} intensity={intensity} />
          </div>

          <div
            style={{
              ...cardShell,
              bottom: 36,
              left: 92,
              right: 92,
              height: 520,
            }}
          >
            <FrameLabel text="Эксперт" />
            <LayerVideo
              src={videoUrl}
              fit="contain"
              muted={false}
              zoom
              scenes={scenes}
              intensity={intensity}
            />
          </div>
        </>
      )}
      <Broll brollAssets={brollAssets} fps={30} />
      <Transitions scenes={scenes} />
      <Captions
        words={words}
        captionBlocks={captionBlocks}
        style={style}
        layoutTemplate={layoutTemplate}
      />
      {sfxCues.map((cue) => {
        const src = cue.kind === "custom" ? cue.src || customSfxUrl || undefined : SFX_MAP[cue.kind];
        if (!src) {
          return null;
        }
        return (
          <Sequence key={cue.id} from={Math.max(0, Math.floor(cue.start * 30))}>
            <Audio src={src} volume={cue.volume} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
