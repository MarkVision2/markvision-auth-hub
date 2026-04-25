import { spawn } from "node:child_process";
import { promises as fs, createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import ffmpegPath from "ffmpeg-static";
import { createClient } from "@supabase/supabase-js";

export const config = {
  maxDuration: 300,
  memory: 1024,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_AI_MONTAGE_BOT_TOKEN;
const TELEGRAM_DEFAULT_CHAT_ID = process.env.TELEGRAM_AI_MONTAGE_CHAT_ID;
const RENDER_BUCKET = "ai-edit-renders";
const GEMINI_MODEL = "gemini-2.0-flash";

const log = (...args) => console.log("[ai-montage]", ...args);

const downloadTo = async (url, destPath) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${url} failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(arrayBuffer));
  const stat = await fs.stat(destPath);
  return stat.size;
};

const runFfmpeg = (args, { label = "ffmpeg" } = {}) =>
  new Promise((resolve, reject) => {
    log(label, "args:", args.slice(0, 12).join(" "), "...");
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} exited ${code}: ${stderr.slice(-800)}`));
    });
  });

const ffprobeDuration = (filePath) =>
  new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ["-i", filePath], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += c.toString();
    });
    proc.on("close", () => {
      const match = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (!match) return resolve(0);
      const [, h, m, s, cs] = match;
      resolve(Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(cs) / 100);
    });
  });

const PROMPT = `Ты — ассистент AI-монтажёра. Проанализируй это видео эксперта на русском.

Верни СТРОГО JSON вида:
{
  "language": "ru",
  "summary": "1-2 предложения о теме видео",
  "words": [{"t": 0.12, "d": 0.35, "w": "Привет"}],
  "segments": [
    {"start": 0.0, "end": 6.2, "text": "...", "broll_query": "business meeting", "emphasis": "normal"}
  ]
}

Правила:
- words: каждое произнесённое слово с временем t (старт в сек) и длительностью d в секундах
- segments: логические смысловые блоки по 4-8 секунд; broll_query — английское поисковое выражение для Pexels (2-4 слова)
- emphasis: "high" для ключевых эмоциональных слов, иначе "normal"
- Никаких преамбул, только чистый JSON.`;

const geminiTranscribeInline = async (buffer) => {
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: "video/mp4", data: buffer.toString("base64") } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: { response_mime_type: "application/json", temperature: 0.2 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`Gemini inline ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text);
};

const geminiTranscribeFileApi = async (videoPath, sizeBytes) => {
  const stream = createReadStream(videoPath);
  const upload = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "raw",
        "Content-Type": "video/mp4",
        "Content-Length": String(sizeBytes),
      },
      body: Readable.toWeb(stream),
      duplex: "half",
    },
  );
  if (!upload.ok) throw new Error(`Gemini upload ${upload.status}`);
  const uploaded = await upload.json();
  const fileUri = uploaded?.file?.uri;
  if (!fileUri) throw new Error("Gemini upload: no uri");
  for (let i = 0; i < 30; i += 1) {
    const info = await fetch(`${fileUri}?key=${GEMINI_API_KEY}`);
    const j = await info.json();
    if (j.state === "ACTIVE") break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  const body = {
    contents: [{ parts: [{ file_data: { mime_type: "video/mp4", file_uri: fileUri } }, { text: PROMPT }] }],
    generationConfig: { response_mime_type: "application/json", temperature: 0.2 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`Gemini analyze ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text);
};

const geminiTranscribe = async (videoPath) => {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const stat = await fs.stat(videoPath);
  if (stat.size < 18 * 1024 * 1024) {
    const buffer = await fs.readFile(videoPath);
    return geminiTranscribeInline(buffer);
  }
  return geminiTranscribeFileApi(videoPath, stat.size);
};

const pickPexelsVideo = async (query, orientation) => {
  if (!PEXELS_API_KEY) return null;
  const url = `https://api.pexels.com/videos/search?per_page=5&orientation=${orientation}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) return null;
  const data = await res.json();
  for (const v of data.videos || []) {
    const files = (v.video_files || [])
      .filter((f) =>
        orientation === "portrait"
          ? f.height >= 1280 && f.width <= 1080
          : f.width >= 1280 && f.width <= 1920 && f.height >= 720,
      )
      .sort((a, b) => a.width - b.width);
    if (files[0]) return files[0].link;
  }
  return null;
};

const tc = (sec) => {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  const ms = String(Math.floor((sec - Math.floor(sec)) * 1000)).padStart(3, "0");
  return `${h}:${m}:${s},${ms}`;
};

const buildSrtFromWords = (words, { chunkWords = 3 } = {}) => {
  if (!Array.isArray(words) || words.length === 0) return "";
  const lines = [];
  for (let i = 0, idx = 1; i < words.length; i += chunkWords, idx += 1) {
    const group = words.slice(i, i + chunkWords);
    const start = group[0].t || 0;
    const last = group[group.length - 1];
    const end = (last.t || 0) + (last.d || 0.3);
    const text = group.map((w) => (w.w || "").toUpperCase()).join(" ");
    lines.push(`${idx}\n${tc(start)} --> ${tc(end)}\n${text}\n`);
  }
  return lines.join("\n");
};

const progressPatch = async (supabase, projectId, patch) => {
  await supabase.from("ai_edit_projects").update(patch).eq("id", projectId);
};

const sendTelegramVideo = async (chatId, videoPath, caption) => {
  log("tg.sendVideo: token=", TELEGRAM_BOT_TOKEN ? "set" : "MISSING", "chatId=", chatId || "MISSING");
  if (!TELEGRAM_BOT_TOKEN || !chatId) return null;
  const { Blob } = await import("node:buffer");
  const fileBuffer = await fs.readFile(videoPath);
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("supports_streaming", "true");
  form.append("video", new Blob([fileBuffer], { type: "video/mp4" }), "montage.mp4");
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram: ${data.description}`);
  return data.result.message_id;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const projectId = body.project_id || body.projectId;
  const telegramChatId = body.telegram_chat_id || body.telegramChatId || TELEGRAM_DEFAULT_CHAT_ID;

  if (!projectId) return res.status(400).json({ error: "project_id is required" });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: "Supabase credentials missing" });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const workDir = await fs.mkdtemp(path.join(tmpdir(), "aim-"));
  const userPath = path.join(workDir, "user.mp4");
  const outPath = path.join(workDir, "montage.mp4");
  const srtPath = path.join(workDir, "captions.srt");

  try {
    const { data: project, error: projectError } = await supabase
      .from("ai_edit_projects")
      .select("id, owner_id, source_video_url, format, style, script_hint, caption_language")
      .eq("id", projectId)
      .single();
    if (projectError || !project) throw new Error(projectError?.message || "Project not found");
    if (!project.source_video_url) throw new Error("source_video_url is empty");

    const format = project.format || "9:16";
    const isVertical = format === "9:16";
    const isSquare = format === "1:1";
    const [outW, outH] = isVertical ? [1080, 1920] : isSquare ? [1080, 1080] : [1920, 1080];
    const orientation = isVertical ? "portrait" : isSquare ? "square" : "landscape";

    await progressPatch(supabase, projectId, {
      status: "transcribing",
      stage: "transcription",
      progress: 15,
      progress_text: "Загрузка исходника",
    });
    const sourceSize = await downloadTo(project.source_video_url, userPath);
    log("user.mp4", sourceSize, "bytes");
    const sourceDur = await ffprobeDuration(userPath);
    log("duration", sourceDur, "sec");

    await progressPatch(supabase, projectId, {
      progress: 30,
      progress_text: "Транскрибация через Gemini",
    });

    let analysis = { words: [], segments: [], summary: "" };
    try {
      analysis = await geminiTranscribe(userPath);
      log("gemini words:", analysis.words?.length, "segments:", analysis.segments?.length);
    } catch (e) {
      log("Gemini failed, continuing without captions:", e.message);
    }

    await progressPatch(supabase, projectId, {
      status: "analyzing",
      stage: "analysis",
      progress: 50,
      progress_text: "Подбор B-roll",
    });

    const segments = (analysis.segments || []).filter((s) => s && s.end > s.start);
    const uniqueQueries = [...new Set(segments.map((s) => s.broll_query).filter(Boolean))].slice(0, 5);
    const brollByQuery = new Map();
    for (const q of uniqueQueries) {
      const url = await pickPexelsVideo(q, orientation);
      if (url) {
        const p = path.join(workDir, `broll_${brollByQuery.size}.mp4`);
        try {
          await downloadTo(url, p);
          brollByQuery.set(q, p);
        } catch (e) {
          log("broll dl fail", q, e.message);
        }
      }
    }

    const pickedOverlaySegs = [];
    for (let i = 1; i < segments.length - 1 && pickedOverlaySegs.length < 3; i += 1) {
      const seg = segments[i];
      if (seg.end - seg.start < 2.5) continue;
      const p = brollByQuery.get(seg.broll_query);
      if (p) {
        const overlayDur = Math.min(3.5, seg.end - seg.start - 0.3);
        pickedOverlaySegs.push({
          path: p,
          start: seg.start + 0.2,
          end: seg.start + 0.2 + overlayDur,
        });
      }
    }
    log("overlays:", pickedOverlaySegs.length);

    const srt = buildSrtFromWords(analysis.words || [], { chunkWords: 3 });
    if (srt) await fs.writeFile(srtPath, srt);

    await progressPatch(supabase, projectId, {
      status: "rendering",
      stage: "rendering",
      progress: 70,
      progress_text: `Рендер ${outW}×${outH}`,
    });

    const fontRel = path.resolve(__dirname, "../public/fonts/Montserrat.ttf");
    const hasFont = await fs.access(fontRel).then(() => true).catch(() => false);

    const args = ["-y", "-i", userPath];
    for (const ov of pickedOverlaySegs) args.push("-i", ov.path);

    const filter = [];
    filter.push(
      `[0:v]scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},fps=30,setsar=1[base0]`,
    );
    let cur = "base0";
    pickedOverlaySegs.forEach((ov, i) => {
      const inIdx = i + 1;
      filter.push(
        `[${inIdx}:v]scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},fps=30,setsar=1,setpts=PTS-STARTPTS+${ov.start.toFixed(2)}/TB[ov${i}]`,
      );
      const next = `v${i}`;
      filter.push(
        `[${cur}][ov${i}]overlay=enable='between(t,${ov.start.toFixed(2)},${ov.end.toFixed(2)})':shortest=0[${next}]`,
      );
      cur = next;
    });

    if (srt && hasFont) {
      const styled =
        `FontName=Montserrat,FontSize=16,PrimaryColour=&H00FFFFFF,` +
        `OutlineColour=&H00000000,BackColour=&HA0000000,BorderStyle=3,` +
        `Outline=3,Shadow=0,Alignment=2,MarginV=${Math.round(outH * 0.12)},Bold=1`;
      const escSrt = srtPath.replace(/:/g, "\\:").replace(/'/g, "\\'");
      const fontsDir = path.dirname(fontRel).replace(/:/g, "\\:");
      filter.push(`[${cur}]subtitles='${escSrt}':fontsdir='${fontsDir}':force_style='${styled}'[vout]`);
      cur = "vout";
    }

    args.push("-filter_complex", filter.join(";"));
    args.push("-map", `[${cur}]`);
    args.push("-map", "0:a?");
    args.push(
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "21",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ar", "44100",
      "-shortest",
      outPath,
    );

    await runFfmpeg(args, { label: "render" });

    await progressPatch(supabase, projectId, {
      progress: 88,
      progress_text: "Загрузка результата",
    });

    const buffer = await fs.readFile(outPath);
    const storagePath = `${project.owner_id || "anon"}/${projectId}/${Date.now()}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from(RENDER_BUCKET)
      .upload(storagePath, buffer, { contentType: "video/mp4", upsert: false });
    if (uploadError) throw new Error(`Upload: ${uploadError.message}`);

    const { data: publicUrl } = supabase.storage.from(RENDER_BUCKET).getPublicUrl(storagePath);

    await supabase.from("ai_edit_renders").insert({
      project_id: projectId,
      version: 1,
      output_url: publicUrl.publicUrl,
      size_bytes: buffer.length,
      status: "completed",
      variant_name: "ffmpeg-ai-v2",
      variant_notes: `gemini+pexels+captions, format=${format}, overlays=${pickedOverlaySegs.length}, words=${analysis.words?.length || 0}`,
    });

    let telegramMessageId = null;
    let telegramError = null;
    try {
      const caption =
        `🎬 AI Montage готов\n` +
        `О чём: ${(analysis.summary || "видео").slice(0, 120)}\n` +
        `Длительность: ${Math.round(sourceDur)} сек · Формат: ${format}\n` +
        `B-roll: ${pickedOverlaySegs.length}× · Титры: ${analysis.words?.length || 0} слов\n` +
        `URL: ${publicUrl.publicUrl}`;
      telegramMessageId = await sendTelegramVideo(telegramChatId, outPath, caption);
      if (!telegramMessageId) {
        telegramError = !TELEGRAM_BOT_TOKEN
          ? "TELEGRAM_AI_MONTAGE_BOT_TOKEN missing"
          : !telegramChatId
            ? "telegram_chat_id missing"
            : "unknown silent skip";
      }
    } catch (tgErr) {
      telegramError = tgErr.message;
      log("telegram failed:", tgErr.message);
    }

    await progressPatch(supabase, projectId, {
      status: "completed",
      stage: "completed",
      progress: 100,
      progress_text: "Готово",
    });

    return res.status(200).json({
      success: true,
      output_url: publicUrl.publicUrl,
      duration_sec: sourceDur,
      words: analysis.words?.length || 0,
      overlays: pickedOverlaySegs.length,
      telegram_message_id: telegramMessageId,
      telegram_error: telegramError,
      env: {
        gemini: Boolean(GEMINI_API_KEY),
        pexels: Boolean(PEXELS_API_KEY),
        tg_token: Boolean(TELEGRAM_BOT_TOKEN),
        tg_default_chat: Boolean(TELEGRAM_DEFAULT_CHAT_ID),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    log("ERROR:", message);
    try {
      await progressPatch(supabase, projectId, {
        status: "failed",
        stage: "rendering",
        error_message: message,
      });
    } catch {}
    return res.status(500).json({ error: message });
  } finally {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch {}
  }
}
