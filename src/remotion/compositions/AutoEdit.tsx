import { AbsoluteFill, OffthreadVideo } from "remotion";
import { Broll } from "../components/Broll";
import { Captions } from "../components/Captions";
import { Transitions } from "../components/Transitions";
import { Zoom } from "../components/Zoom";
import type { AutoEditCompositionProps } from "../types";

export const AutoEdit: React.FC<AutoEditCompositionProps> = ({
  videoUrl,
  scenes,
  words,
  brollAssets,
  style,
  intensity = "medium",
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020617", overflow: "hidden" }}>
      <Zoom scenes={scenes} intensity={intensity}>
        <OffthreadVideo
          src={videoUrl}
          muted={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Zoom>
      <Broll brollAssets={brollAssets} fps={30} />
      <Transitions scenes={scenes} />
      <Captions words={words} style={style} />
    </AbsoluteFill>
  );
};
