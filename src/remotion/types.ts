export type AiEditStyle = "viral" | "minimal" | "business";
export type SceneType = "hook" | "explanation" | "cta";
export type EmotionLevel = "high" | "normal";
export type IntensityLevel = "low" | "medium" | "high";
export type MontageLayoutTemplate = "split_demo_top" | "triple_demo_stack";
export type TransitionKind = "flash" | "swipe" | "impact";
export type SfxKind = "whoosh" | "ding" | "impact" | "custom";

export interface Scene {
  start: number;
  end: number;
  type: SceneType;
  keywords: string[];
  emotion: EmotionLevel;
  transition?: TransitionKind;
  punchWords?: string[];
}

export interface WordTiming {
  word: string;
  start: number;
  end: number;
  highlight?: boolean;
  emphasis?: "primary" | "secondary";
}

export interface BrollAsset {
  url: string;
  start: number;
  end: number;
  opacity?: number;
  mode?: "overlay" | "cutaway";
  emphasis?: "soft" | "impact";
  anchor?: "top" | "bottom" | "full";
}

export interface DemoVideoAsset {
  url: string;
  slot: "top" | "bottom";
}

export interface CaptionBlock {
  id: string;
  start: number;
  end: number;
  words: string[];
  highlightWords: string[];
  sceneType: SceneType;
  emphasis: EmotionLevel;
}

export interface SfxCue {
  id: string;
  start: number;
  kind: SfxKind;
  volume: number;
  src?: string;
}

export interface AutoEditCompositionProps extends Record<string, unknown> {
  videoUrl: string;
  scenes: Scene[];
  words: WordTiming[];
  brollAssets: BrollAsset[];
  demoVideos?: DemoVideoAsset[];
  captionBlocks?: CaptionBlock[];
  sfxCues?: SfxCue[];
  customSfxUrl?: string | null;
  style: AiEditStyle;
  intensity?: IntensityLevel;
  layoutTemplate?: MontageLayoutTemplate;
}
