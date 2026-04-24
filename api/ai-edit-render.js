import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entryPoint = path.resolve(__dirname, "../src/remotion/index.ts");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RENDER_SHARED_TOKEN = process.env.AI_EDIT_RENDER_TOKEN;
const RENDER_BUCKET = "ai-edit-renders";

let bundlePromise;

const getServeUrl = () => {
  if (!bundlePromise) {
    bundlePromise = bundle({ entryPoint });
  }
  return bundlePromise;
};

const getCompositionId = (format) => {
  if (format === "1:1") return "AutoEditSquare";
  if (format === "16:9") return "AutoEditWide";
  return "AutoEdit";
};

const STYLE_MAP = {
  viral_hormozi: "viral",
  minimal_clean: "minimal",
  business_clinic: "business",
};

const mapStyle = (preset) => STYLE_MAP[preset] ?? "viral";
const mapLayoutTemplate = (template) =>
  template === "triple_demo_stack" ? "triple_demo_stack" : "split_demo_top";
const normalizeWord = (word) =>
  String(word || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}-]/gu, "");
const STRONG_WORDS = new Set([
  "главное",
  "важно",
  "ошибка",
  "решение",
  "результат",
  "рост",
  "прибыль",
  "деньги",
  "боль",
  "проблема",
  "заявка",
  "кейс",
  "секрет",
  "бесплатно",
  "скидка",
  "сейчас",
  "почему",
  "как",
  "нельзя",
  "нужно",
]);
const transitionForScene = (sceneType, emotion) => {
  if (sceneType === "hook") return "impact";
  if (sceneType === "cta") return "flash";
  return emotion === "high" ? "flash" : "swipe";
};
const rhythmForScene = (sceneType, emotion) => {
  if (sceneType === "hook") return "aggressive";
  if (sceneType === "cta") return "release";
  return emotion === "high" ? "aggressive" : "steady";
};
const zoomModeForScene = (sceneType, emotion) => {
  if (sceneType === "hook") return "punch";
  if (sceneType === "cta") return "settle";
  return emotion === "high" ? "punch" : "glide";
};

const buildImportantWords = (words, scenes) => {
  const sceneKeywords = scenes.flatMap((scene) => scene.keywords || []).map(normalizeWord);
  const keywordSet = new Set(sceneKeywords.filter(Boolean));

  return words.map((word, index) => {
    const clean = normalizeWord(word.word);
    const isSceneKeyword = keywordSet.has(clean);
    const isStrongWord = STRONG_WORDS.has(clean) || clean.length >= 8;
    const emphasis = isSceneKeyword || (isStrongWord && index % 2 === 0) ? "primary" : isStrongWord ? "secondary" : undefined;

    return {
      ...word,
      highlight: Boolean(emphasis),
      emphasis,
    };
  });
};

const buildCaptionBlocks = (words, scenes) => {
  const blocks = [];

  for (const scene of scenes) {
    const sceneWords = words.filter((word) => word.start >= scene.start && word.end <= scene.end + 0.12);
    if (sceneWords.length === 0) {
      continue;
    }

    let cursor = 0;
    while (cursor < sceneWords.length) {
      const preferredChunk =
        scene.type === "hook" ? 3 : scene.type === "cta" ? 3 : scene.emotion === "high" ? 4 : 5;
      const chunk = sceneWords.slice(cursor, cursor + preferredChunk);
      if (chunk.length === 0) break;
      const highlightWords = chunk.filter((word) => word.highlight).map((word) => word.word);
      const lineBreakAfter =
        chunk.length <= 2 ? chunk.length : scene.type === "explanation" ? Math.min(3, chunk.length - 1) : Math.ceil(chunk.length / 2);
      const dominantWord =
        chunk.find((word) => word.emphasis === "primary")?.word ||
        highlightWords[0] ||
        chunk[0]?.word ||
        null;

      blocks.push({
        id: `${scene.type}-${chunk[0].start.toFixed(2)}`,
        start: chunk[0].start,
        end: chunk[chunk.length - 1].end,
        words: chunk.map((word) => word.word),
        highlightWords,
        sceneType: scene.type,
        emphasis: scene.emotion,
        lineBreakAfter,
        dominantWord,
      });

      cursor += scene.type === "explanation" ? Math.max(3, chunk.length - 1) : chunk.length;
    }
  }

  if (blocks.length > 0) {
    return blocks;
  }

  return words.slice(0, 1).map((word) => ({
    id: `fallback-${word.start.toFixed(2)}`,
    start: word.start,
    end: word.end,
    words: [word.word],
    highlightWords: word.highlight ? [word.word] : [],
    sceneType: "explanation",
    emphasis: "normal",
    lineBreakAfter: 1,
    dominantWord: word.word,
  }));
};

const buildCutMoments = (scene, sceneWords) => {
  const emphasized = sceneWords
    .filter((word) => word.emphasis === "primary" || word.highlight)
    .map((word) => Number(word.start.toFixed(2)));

  const fallbackStep = scene.type === "hook" ? 2 : scene.type === "cta" ? 3 : 4;
  const fallback = sceneWords
    .filter((_, index) => index > 0 && index % fallbackStep === 0)
    .map((word) => Number(word.start.toFixed(2)));

  const unique = Array.from(new Set([...emphasized, ...fallback]))
    .filter((point) => point > scene.start + 0.08 && point < scene.end - 0.08)
    .sort((a, b) => a - b);

  return unique.slice(0, scene.type === "hook" ? 5 : 3);
};

const buildSfxCues = (scenes, words, project) => {
  const cues = [];

  scenes.forEach((scene, index) => {
    if (scene.start > 0.05) {
      cues.push({
        id: `scene-${index}`,
        start: scene.start,
        kind: scene.type === "hook" ? "impact" : "whoosh",
        volume: scene.emotion === "high" ? 0.45 : 0.28,
      });
    }

    const punchWord = words.find(
      (word) =>
        word.start >= scene.start &&
        word.start <= scene.end &&
        (word.emphasis === "primary" || normalizeWord(word.word) === normalizeWord(scene.keywords?.[0])),
    );

    if (punchWord) {
      cues.push({
        id: `word-${index}`,
        start: punchWord.start,
        kind: scene.type === "cta" ? "ding" : "impact",
        volume: scene.type === "cta" ? 0.34 : 0.24,
      });
    }

    if (project.custom_sfx_url && scene.emotion === "high") {
      cues.push({
        id: `custom-${index}`,
        start: scene.start + 0.08,
        kind: "custom",
        volume: 0.3,
        src: project.custom_sfx_url,
      });
    }
  });

  return cues;
};

const getFallbackDurationSec = (inputProps) => {
  const wordEnd = inputProps.words.length
    ? Math.max(...inputProps.words.map((word) => Number(word.end) || 0))
    : 0;
  const sceneEnd = inputProps.scenes.length
    ? Math.max(...inputProps.scenes.map((scene) => Number(scene.end) || 0))
    : 0;

  return Math.max(wordEnd, sceneEnd, 8);
};

const buildInputProps = (project, segments, assets) => {
  const words = [];
  const scenes = [];
  const brollAssets = [];
  const demoVideos = [];
  const brollByQuery = new Map(
    assets.filter((a) => a.kind === "broll").map((a) => [String(a.prompt || "").toLowerCase(), a]),
  );

  for (const seg of segments) {
    const data = seg.data || {};
    const start = (Number(seg.start_ms) || 0) / 1000;
    const end = (Number(seg.end_ms) || 0) / 1000;

    if (seg.type === "caption") {
      words.push({
        word: data.text ?? data.word ?? "",
        start,
        end,
      });
    } else if (seg.type === "broll") {
      const query = String(data.query || "").toLowerCase();
      const asset = brollByQuery.get(query) || assets.find((a) => a.kind === "broll");
      const url = asset?.url;
      if (url) {
        const sceneForBroll = scenes.find((scene) => start >= scene.start && start <= scene.end);
        brollAssets.push({
          url,
          start,
          end,
          mode:
            data.mode === "cutaway" || sceneForBroll?.type === "hook" || sceneForBroll?.type === "cta"
              ? "cutaway"
              : "overlay",
          opacity: typeof data.opacity === "number" ? data.opacity : sceneForBroll?.emotion === "high" ? 0.94 : 0.78,
          emphasis: sceneForBroll?.emotion === "high" ? "impact" : "soft",
          anchor: sceneForBroll?.type === "cta" ? "bottom" : sceneForBroll?.type === "hook" ? "top" : "full",
        });
      }
    } else if (seg.type === "scene" || seg.type === "cut") {
      scenes.push({
        start,
        end,
        type: data.scene_type ?? data.type ?? "explanation",
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        emotion: data.emotion === "high" ? "high" : "normal",
        transition: transitionForScene(data.scene_type ?? data.type ?? "explanation", data.emotion === "high" ? "high" : "normal"),
        punchWords: Array.isArray(data.keywords) ? data.keywords.slice(0, 2) : [],
      });
    }
  }

  if (scenes.length === 0 && words.length > 0) {
    scenes.push({
      start: words[0].start,
      end: words[words.length - 1].end,
      type: "explanation",
      keywords: [],
      emotion: "normal",
      transition: "swipe",
      punchWords: [],
    });
  }

  const enrichedWords = buildImportantWords(words, scenes);
  const enrichedScenes = scenes.map((scene) => {
    const sceneWords = enrichedWords.filter((word) => word.start >= scene.start && word.end <= scene.end + 0.12);
    return {
      ...scene,
      rhythm: rhythmForScene(scene.type, scene.emotion),
      zoomMode: zoomModeForScene(scene.type, scene.emotion),
      cutMoments: buildCutMoments(scene, sceneWords),
    };
  });
  const captionBlocks = buildCaptionBlocks(enrichedWords, enrichedScenes);
  const sfxCues = buildSfxCues(enrichedScenes, enrichedWords, project);

  const topDemoAsset =
    assets.find((asset) => asset.kind === "layout_demo_top" && asset.url) ||
    assets.find((asset) => asset.kind === "broll" && asset.url);
  const bottomDemoAsset =
    assets.find((asset) => asset.kind === "layout_demo_bottom" && asset.url) ||
    assets.filter((asset) => asset.kind === "broll" && asset.url)[1] ||
    topDemoAsset;

  if (topDemoAsset?.url) {
    demoVideos.push({ slot: "top", url: topDemoAsset.url });
  }

  if (bottomDemoAsset?.url) {
    demoVideos.push({ slot: "bottom", url: bottomDemoAsset.url });
  }

  return {
    videoUrl: project.source_video_url,
    style: mapStyle(project.style),
    intensity: project.intensity || "medium",
    layoutTemplate: mapLayoutTemplate(project.business_template),
    words: enrichedWords,
    scenes: enrichedScenes,
    brollAssets,
    demoVideos,
    captionBlocks,
    sfxCues,
    customSfxUrl: project.custom_sfx_url || null,
  };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { projectId, taskToken } = req.body || {};

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  if (RENDER_SHARED_TOKEN && taskToken !== RENDER_SHARED_TOKEN) {
    return res.status(401).json({ error: "Invalid task token" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Supabase service credentials missing" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    const { data: project, error: projectError } = await supabase
      .from("ai_edit_projects")
      .select("id, owner_id, source_video_url, format, style, intensity, source_duration_sec, business_template, custom_sfx_url")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: projectError?.message || "Project not found" });
    }

    const [{ data: segments = [] }, { data: assets = [] }] = await Promise.all([
      supabase
        .from("ai_edit_segments")
        .select("id, type, start_ms, end_ms, data")
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        .order("order_index", { ascending: true }),
      supabase
        .from("ai_edit_assets")
        .select("id, kind, prompt, url")
        .eq("project_id", projectId)
        .eq("status", "ready"),
    ]);

    const inputProps = buildInputProps(project, segments, assets);
    const serveUrl = await getServeUrl();
    const composition = await selectComposition({
      serveUrl,
      id: getCompositionId(project.format),
      inputProps,
    });

    const safeDurationSec = project.source_duration_sec || getFallbackDurationSec(inputProps);
    const durationInFrames = Math.max(
      composition.durationInFrames,
      Math.ceil(safeDurationSec * composition.fps),
    );

    const { buffer } = await renderMedia({
      serveUrl,
      composition: { ...composition, durationInFrames },
      codec: "h264",
      audioCodec: "aac",
      outputLocation: null,
      inputProps,
      concurrency: 1,
    });

    const storagePath = `${project.owner_id}/${projectId}/${Date.now()}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from(RENDER_BUCKET)
      .upload(storagePath, buffer, { contentType: "video/mp4", upsert: false });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrl } = supabase.storage.from(RENDER_BUCKET).getPublicUrl(storagePath);

    const { data: render, error: renderError } = await supabase
      .from("ai_edit_renders")
      .insert({
        project_id: projectId,
        version: 1,
        output_url: publicUrl.publicUrl,
        duration_sec: project.source_duration_sec,
        size_bytes: buffer.length,
        status: "completed",
        variant_name: "default",
        variant_notes: "Remotion render",
      })
      .select()
      .single();

    if (renderError) {
      throw new Error(`Render row insert failed: ${renderError.message}`);
    }

    await supabase
      .from("ai_edit_projects")
      .update({ status: "completed", stage: "completed", progress: 100, progress_text: "Монтаж готов" })
      .eq("id", projectId);

    return res.status(200).json({ success: true, renderId: render.id, url: publicUrl.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    await supabase
      .from("ai_edit_projects")
      .update({ status: "failed", stage: "failed", progress_text: "Ошибка рендера", error_message: message })
      .eq("id", projectId);
    return res.status(500).json({ error: message });
  }
}
