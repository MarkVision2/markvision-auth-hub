import { Composition } from "remotion";
import { z } from "zod";
import { AutoEdit } from "./compositions/AutoEdit";
import type { AutoEditCompositionProps } from "./types";

const autoEditSchema = z.object({}).passthrough();

const defaultProps: AutoEditCompositionProps = {
  videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  style: "viral",
  intensity: "medium",
  layoutTemplate: "split_demo_top",
  demoVideos: [
    {
      slot: "top",
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    },
    {
      slot: "bottom",
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    },
  ],
  words: [
    { word: "ИИ", start: 0, end: 0.4 },
    { word: "монтаж", start: 0.45, end: 0.95 },
    { word: "готов", start: 1, end: 1.45 },
  ],
  scenes: [
    { start: 0, end: 2.5, type: "hook", keywords: ["рост", "видео"], emotion: "high" },
    { start: 2.5, end: 5.5, type: "explanation", keywords: ["кейсы", "монтаж"], emotion: "normal" },
    { start: 5.5, end: 8, type: "cta", keywords: ["заявка", "результат"], emotion: "high" },
  ],
  brollAssets: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<typeof autoEditSchema, AutoEditCompositionProps>
        id="AutoEdit"
        component={AutoEdit}
        schema={autoEditSchema}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={240}
        defaultProps={defaultProps}
      />
      <Composition<typeof autoEditSchema, AutoEditCompositionProps>
        id="AutoEditSquare"
        component={AutoEdit}
        schema={autoEditSchema}
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={240}
        defaultProps={defaultProps}
      />
      <Composition<typeof autoEditSchema, AutoEditCompositionProps>
        id="AutoEditWide"
        component={AutoEdit}
        schema={autoEditSchema}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={240}
        defaultProps={defaultProps}
      />
    </>
  );
};

export default RemotionRoot;
