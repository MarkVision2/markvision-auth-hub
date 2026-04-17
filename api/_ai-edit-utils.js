const STAGE_WINDOWS_MS = {
  transcription: 1500,
  analysis: 3500,
  broll: 5500,
  rendering: 8000,
};

const DEFAULT_TRANSCRIPT =
  "Мы разбираем главную ошибку бизнеса, показываем решение, усиливаем доверие и закрываем зрителя на действие.";

const VARIANT_PRESETS = [
  {
    id: "aggressive",
    name: "Агрессивный",
    intensity: "high",
    styleBias: "impact",
    notes: "Больше jump cuts, акцентный zoom и более частые caption-анимации.",
  },
  {
    id: "balanced",
    name: "Умеренный",
    intensity: "medium",
    styleBias: "balanced",
    notes: "Сбалансированный монтаж для ежедневного продакшна.",
  },
  {
    id: "minimal",
    name: "Минимал",
    intensity: "low",
    styleBias: "clean",
    notes: "Чистый монтаж с минимальным количеством эффектов.",
  },
];

export const createTaskId = () =>
  `ai-edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const encodeTaskToken = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

export const decodeTaskToken = (token) => {
  const json = Buffer.from(token, "base64url").toString("utf8");
  return JSON.parse(json);
};

const safeWords = (sourceText) => {
  const text = (sourceText || DEFAULT_TRANSCRIPT).trim();
  return text
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter(Boolean);
};

export const buildTranscript = (sourceText) => {
  const words = safeWords(sourceText);
  let cursor = 0;

  const timedWords = words.map((word, index) => {
    const duration = index % 4 === 0 ? 0.42 : 0.3;
    const start = Number(cursor.toFixed(2));
    const end = Number((cursor + duration).toFixed(2));
    cursor = end + 0.06;
    return { word, start, end };
  });

  return {
    text: words.join(" "),
    words: timedWords,
    durationSec: Number(Math.max(cursor, 8).toFixed(2)),
  };
};

export const buildScenes = (transcript) => {
  const totalDuration = transcript.durationSec || 9;
  const third = totalDuration / 3;
  const topKeywords = transcript.words
    .map((item) => item.word.toLowerCase())
    .filter((word, index, arr) => arr.indexOf(word) === index)
    .slice(0, 6);

  return [
    {
      start: 0,
      end: Number(third.toFixed(2)),
      type: "hook",
      keywords: topKeywords.slice(0, 2),
      emotion: "high",
    },
    {
      start: Number(third.toFixed(2)),
      end: Number((third * 2).toFixed(2)),
      type: "explanation",
      keywords: topKeywords.slice(2, 4),
      emotion: "normal",
    },
    {
      start: Number((third * 2).toFixed(2)),
      end: Number(totalDuration.toFixed(2)),
      type: "cta",
      keywords: topKeywords.slice(4, 6),
      emotion: "high",
    },
  ];
};

export const buildBrollAssets = (request, scenes) => {
  if (!request.options?.autoBroll) {
    return [];
  }

  const requested = request.assets?.brollUrl
    ? [
        {
          url: request.assets.brollUrl,
          start: scenes[1]?.start ?? 1.5,
          end: Math.min((scenes[1]?.start ?? 1.5) + 2, scenes[1]?.end ?? 3.5),
          opacity: 0.7,
          mode: "overlay",
        },
      ]
    : [];

  return requested;
};

export const getVariantPresets = () => {
  return VARIANT_PRESETS.map((variant) => ({
    id: variant.id,
    name: variant.name,
    notes: variant.notes,
    intensity: variant.intensity,
    styleBias: variant.styleBias,
  }));
};

export const getVariantPreset = (variantId) => {
  return getVariantPresets().find((variant) => variant.id === variantId) || getVariantPresets()[0];
};

const toVariantUrl = (taskToken, variantId) => {
  return `/api/ai-edit-render?token=${encodeURIComponent(taskToken)}&variant=${encodeURIComponent(variantId)}`;
};

export const buildRenderInputProps = (request, transcript, scenes, brollAssets, variantId) => {
  const variant = getVariantPreset(variantId);

  return {
    videoUrl: request.videoUrl,
    scenes,
    words: transcript.words,
    brollAssets,
    style: request.style,
    intensity: variant.intensity,
  };
};

export const buildVariants = (request, transcript, scenes, brollAssets, taskToken = "") => {
  return getVariantPresets().map((variant) => ({
    id: variant.id,
    name: variant.name,
    url: taskToken ? toVariantUrl(taskToken, variant.id) : null,
    notes: variant.notes,
    renderSpec: {
      compositionId: "AutoEdit",
      style: request.style,
      aspectRatio: request.format,
      businessTemplate: request.businessTemplate,
      autoZoom: request.options?.autoZoom ?? true,
      autoBroll: request.options?.autoBroll ?? true,
      intensity: variant.intensity,
      transcript,
      scenes,
      brollAssets,
      assets: request.assets,
      inputProps: buildRenderInputProps(request, transcript, scenes, brollAssets, variant.id),
    },
  }));
};

export const buildStatus = (request, now = Date.now(), taskToken = "") => {
  const elapsed = now - request.createdAt;
  const transcript = buildTranscript(request.scriptHint);
  const scenes = buildScenes(transcript);
  const brollAssets = buildBrollAssets(request, scenes);
  const variants = buildVariants(request, transcript, scenes, brollAssets, taskToken);

  if (elapsed < STAGE_WINDOWS_MS.transcription) {
    return {
      taskId: request.taskId,
      status: "processing",
      stage: "transcription",
      progress: 20,
      progressText: "Whisper: транскрипция и тайминги слов",
    };
  }

  if (elapsed < STAGE_WINDOWS_MS.analysis) {
    return {
      taskId: request.taskId,
      status: "processing",
      stage: "analysis",
      progress: 45,
      progressText: "GPT: разметка сцен, ключевых слов и эмоций",
      transcript,
    };
  }

  if (elapsed < STAGE_WINDOWS_MS.broll) {
    return {
      taskId: request.taskId,
      status: "processing",
      stage: "broll",
      progress: 70,
      progressText: "AI Director: подбор контекстного B-roll и шаблона монтажа",
      transcript,
      scenes,
    };
  }

  if (elapsed < STAGE_WINDOWS_MS.rendering) {
    return {
      taskId: request.taskId,
      status: "processing",
      stage: "rendering",
      progress: 90,
      progressText: "Remotion: сборка и рендер 3 вариантов",
      transcript,
      scenes,
      brollAssets,
    };
  }

  return {
    taskId: request.taskId,
    status: "completed",
    stage: "completed",
    progress: 100,
    progressText: "Готово",
    transcript,
    scenes,
    brollAssets,
    videos: variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      url: variant.url,
      notes: variant.notes,
    })),
    variants,
  };
};
