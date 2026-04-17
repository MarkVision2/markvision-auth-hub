export type AiEditStyle = "viral" | "minimal" | "business";
export type SceneType = "hook" | "explanation" | "cta";
export type EmotionLevel = "high" | "normal";
export type IntensityLevel = "low" | "medium" | "high";

export interface Scene {
  start: number;
  end: number;
  type: SceneType;
  keywords: string[];
  emotion: EmotionLevel;
}

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface BrollAsset {
  url: string;
  start: number;
  end: number;
  opacity?: number;
  mode?: "overlay" | "cutaway";
}

export interface AutoEditCompositionProps extends Record<string, unknown> {
  videoUrl: string;
  scenes: Scene[];
  words: WordTiming[];
  brollAssets: BrollAsset[];
  style: AiEditStyle;
  intensity?: IntensityLevel;
}
