// Direct AI montage endpoint — без зависимости от ai_edit_projects.
// Вход:  POST { videoUrl, scriptHint?, style?, format?, captionLanguage?,
//                autoBroll?, customBrollUrl?, intensity?, telegramChatId?, sendTelegram? }
// Выход: { success, output_url, duration_sec, words, overlays }
// Движок идентичен api/ai-montage-render.js (Gemini transcribe → Pexels broll →
// пословные SRT-титры → ffmpeg zoom-fill + overlay), но читает параметры из тела
// запроса и пишет результат прямо в Storage, возвращая публичную ссылку.

import { spawn } from "node:child_process";
import { promises as fs, createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import ffmpegPath from "ffmpeg-static";
import { createClient } from "@supabase/supabase-js";

export const config = { maxDuration: 300, memory: 1024 };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_AI_MONTAGE_BOT_TOKEN;
const RENDER_BUCKET = "ai-edit-renders";
// Отдельное хранилище для результатов (чтобы не зависеть от квоты основного проекта)
const RENDER_SUPABASE_URL = process.env.RENDER_SUPABASE_URL;
const RENDER_SUPABASE_KEY = process.env.RENDER_SUPABASE_SERVICE_KEY;
const RENDER_BUCKET_DIRECT = process.env.RENDER_BUCKET_DIRECT || "renders";
const GEMINI_MODEL = "gemini-1.5-flash";

const log = (...a) => console.log("[ai-montage-direct]", ...a);

const downloadTo = async (url, destPath) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${url} failed: ${res.status}`);
  await fs.writeFile(destPath, Buffer.from(await res.arrayBuffer()));
  return (await fs.stat(destPath)).size;
};

const runFfmpeg = (args, { label = "ffmpeg", env } = {}) =>
  new Promise((resolve, reject) => {
    log(label, "args:", args.slice(0, 12).join(" "), "...");
    const proc = spawn(ffmpegPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: env ? { ...process.env, ...env } : process.env,
    });
    let stderr = "";
    proc.stderr.on("data", (c) => { stderr += c.toString(); });
    proc.on("error", reject);
    proc.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} exited ${code}: ${stderr.slice(-800)}`)),
    );
  });

const ffprobeDuration = (filePath) =>
  new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ["-i", filePath], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => { stderr += c.toString(); });
    proc.on("close", () => {
      const m = stderr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (!m) return resolve(0);
      resolve(Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 100);
    });
  });

const LANG_NAME = { ru: "русском", en: "English", kk: "казахском", uz: "узбекском" };
const buildPrompt = ({ language = "ru", scriptHint = "" } = {}) => {
  const lang = LANG_NAME[language] || "русском";
  const hint = scriptHint
    ? `\nКонтекст эксперта (учитывай при сегментации и выборе ключевых слов):\n"""${scriptHint.slice(0, 600)}"""\n`
    : "";
  return `Ты — ассистент AI-монтажёра. Проанализируй это видео эксперта на ${lang}.${hint}
Верни СТРОГО JSON вида:
{
  "language": "${language}",
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
};

const geminiTranscribeInline = async (buffer, prompt) => {
  const body = {
    contents: [{ parts: [
      { inline_data: { mime_type: "video/mp4", data: buffer.toString("base64") } },
      { text: prompt },
    ] }],
    generationConfig: { response_mime_type: "application/json", temperature: 0.2 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`Gemini inline ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
};

const geminiTranscribeFileApi = async (videoPath, sizeBytes, prompt) => {
  const upload = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "raw",
        "Content-Type": "video/mp4",
        "Content-Length": String(sizeBytes),
      },
      body: Readable.toWeb(createReadStream(videoPath)),
      duplex: "half",
    },
  );
  if (!upload.ok) throw new Error(`Gemini upload ${upload.status}`);
  const fileUri = (await upload.json())?.file?.uri;
  if (!fileUri) throw new Error("Gemini upload: no uri");
  for (let i = 0; i < 30; i += 1) {
    const j = await (await fetch(`${fileUri}?key=${GEMINI_API_KEY}`)).json();
    if (j.state === "ACTIVE") break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  const body = {
    contents: [{ parts: [{ file_data: { mime_type: "video/mp4", file_uri: fileUri } }, { text: prompt }] }],
    generationConfig: { response_mime_type: "application/json", temperature: 0.2 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`Gemini analyze ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
};

const wordsFromSegments = (segments) => {
  if (!Array.isArray(segments)) return [];
  const out = [];
  for (const seg of segments) {
    const start = Number(seg?.start ?? 0);
    const end = Number(seg?.end ?? start + 1);
    const text = String(seg?.text ?? "").trim();
    if (!text || end <= start) continue;
    const tokens = text.split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const slice = (end - start) / tokens.length;
    tokens.forEach((tok, i) =>
      out.push({ t: +(start + slice * i).toFixed(3), d: +slice.toFixed(3), w: tok }),
    );
  }
  return out;
};

const geminiTranscribe = async (videoPath, options = {}) => {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const prompt = buildPrompt(options);
  const stat = await fs.stat(videoPath);
  const result =
    stat.size < 18 * 1024 * 1024
      ? await geminiTranscribeInline(await fs.readFile(videoPath), prompt)
      : await geminiTranscribeFileApi(videoPath, stat.size, prompt);
  if ((!Array.isArray(result.words) || result.words.length === 0) && Array.isArray(result.segments)) {
    result.words = wordsFromSegments(result.segments);
  }
  return result;
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

const sendTelegramVideo = async (chatId, videoPath, caption) => {
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

  // Диагностика сборки ffmpeg: какие фильтры доступны на этом рантайме.
  if (body.diag) {
    const capture = (a) =>
      new Promise((resolve) => {
        const p = spawn(ffmpegPath, a, { stdio: ["ignore", "pipe", "pipe"] });
        let out = "";
        p.stdout.on("data", (c) => (out += c));
        p.stderr.on("data", (c) => (out += c));
        p.on("close", () => resolve(out));
        p.on("error", (e) => resolve("ERR " + e.message));
      });
    const ver = (await capture(["-hide_banner", "-version"])).split("\n")[0];
    const filtersOut = await capture(["-hide_banner", "-filters"]);
    const has = (name) => new RegExp(`\\b${name}\\b`).test(filtersOut);
    return res.status(200).json({
      ffmpeg_version: ver,
      ffmpegPath,
      filters: { drawtext: has("drawtext"), subtitles: has("subtitles"), ass: has("ass"), overlay: has("overlay"), zoompan: has("zoompan"), amix: has("amix"), sidechaincompress: has("sidechaincompress") },
    });
  }

  const videoUrl = body.videoUrl || body.source_video_url;
  if (!videoUrl) return res.status(400).json({ error: "videoUrl is required" });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: "Supabase credentials missing" });

  const format = body.format || "9:16";
  const isVertical = format === "9:16";
  const isSquare = format === "1:1";
  const [outW, outH] = isVertical ? [1080, 1920] : isSquare ? [1080, 1080] : [1920, 1080];
  const orientation = isVertical ? "portrait" : isSquare ? "square" : "landscape";
  const style = (body.style || "viral").toLowerCase();
  const captionLanguage = body.captionLanguage || "ru";
  const scriptHint = body.scriptHint || "";
  const autoBroll = body.autoBroll !== false;
  const intensity = (body.intensity || "medium").toLowerCase();
  const intensityCap = intensity === "low" ? 1 : intensity === "high" ? 5 : 3;
  const telegramChatId = body.telegramChatId || body.telegram_chat_id || null;
  // expert-монтаж: фоновая музыка + SFX-вжухи на склейках
  const musicUrl = body.musicUrl || null;
  const musicVolume = Number.isFinite(Number(body.musicVolume)) ? Number(body.musicVolume) : 0.1;
  const sfxUrl = body.sfxUrl || null; // короткий whoosh, проигрывается на каждой склейке broll

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const workDir = await fs.mkdtemp(path.join(tmpdir(), "aimd-"));
  const userPath = path.join(workDir, "user.mp4");
  const outPath = path.join(workDir, "montage.mp4");
  const srtPath = path.join(workDir, "captions.srt");

  try {
    await downloadTo(videoUrl, userPath);
    const sourceDur = await ffprobeDuration(userPath);
    log("duration", sourceDur, "sec");

    // Слова можно передать готовыми (например, из OpenAI Whisper в n8n) — тогда Gemini не нужен.
    // Форматы: {t,d,w} | {word,start,end} | {w,start,end}.
    const normalizeWord = (x) => {
      if (!x || typeof x !== "object") return null;
      const w = x.w ?? x.word ?? x.text;
      const startRaw = x.t ?? x.start;
      const t = Number(startRaw);
      let d = x.d ?? (x.end != null && startRaw != null ? x.end - startRaw : undefined);
      d = Number(d);
      if (!w || !Number.isFinite(t)) return null;
      return { w: String(w), t, d: Number.isFinite(d) && d > 0 ? d : 0.3 };
    };
    const providedWords = Array.isArray(body.words) ? body.words.map(normalizeWord).filter(Boolean) : [];

    let analysis = { words: [], segments: [], summary: "" };
    if (providedWords.length) {
      analysis = {
        words: providedWords,
        segments: Array.isArray(body.segments) ? body.segments : [],
        summary: body.summary || "",
      };
      log("using provided words:", providedWords.length);
    } else {
      try {
        analysis = await geminiTranscribe(userPath, { language: captionLanguage, scriptHint });
        log("gemini:", analysis.words?.length, "words", analysis.segments?.length, "segments");
      } catch (e) {
        log("Gemini failed, continuing without captions:", e.message);
      }
    }

    const segments = (analysis.segments || []).filter((s) => s && s.end > s.start);

    // подбор B-roll из Pexels
    const pickedOverlaySegs = [];
    if (autoBroll) {
      const uniqueQueries = [...new Set(segments.map((s) => s.broll_query).filter(Boolean))].slice(0, intensityCap + 2);
      const brollByQuery = new Map();
      for (const q of uniqueQueries) {
        const url = await pickPexelsVideo(q, orientation);
        if (url) {
          const p = path.join(workDir, `broll_${brollByQuery.size}.mp4`);
          try { await downloadTo(url, p); brollByQuery.set(q, p); }
          catch (e) { log("broll dl fail", q, e.message); }
        }
      }
      for (let i = 1; i < segments.length - 1 && pickedOverlaySegs.length < intensityCap; i += 1) {
        const seg = segments[i];
        if (seg.end - seg.start < 2.5) continue;
        const p = brollByQuery.get(seg.broll_query);
        if (p) {
          const overlayDur = Math.min(3.5, seg.end - seg.start - 0.3);
          pickedOverlaySegs.push({ path: p, start: seg.start + 0.2, end: seg.start + 0.2 + overlayDur });
        }
      }
    }
    log("overlays:", pickedOverlaySegs.length);

    // expert-монтаж: качаем музыку и SFX (если заданы)
    let musicPath = null;
    if (musicUrl) {
      musicPath = path.join(workDir, "music.mp3");
      try { await downloadTo(musicUrl, musicPath); } catch (e) { log("music dl fail:", e.message); musicPath = null; }
    }
    let sfxPath = null;
    if (sfxUrl) {
      sfxPath = path.join(workDir, "sfx.mp3");
      try { await downloadTo(sfxUrl, sfxPath); } catch (e) { log("sfx dl fail:", e.message); sfxPath = null; }
    }

    const srt = buildSrtFromWords(analysis.words || [], { chunkWords: 3 });
    if (srt) await fs.writeFile(srtPath, srt);

    // шрифт
    const fontCandidates = [
      path.resolve(__dirname, "fonts/Montserrat.ttf"),
      path.resolve(__dirname, "../public/fonts/Montserrat.ttf"),
    ];
    let fontRel = path.join(workDir, "Montserrat.ttf");
    let hasFont = false;
    let fontSrc = "none";
    for (const candidate of fontCandidates) {
      const sz = await fs.stat(candidate).then((s) => s.size).catch(() => 0);
      if (sz > 50000) { fontRel = candidate; hasFont = true; fontSrc = "bundled:" + candidate; break; }
    }
    if (!hasFont) {
      // надёжный фолбэк: статический Montserrat с GitHub google/fonts (валидный ttf, libass его ест)
      const fontUrls = [
        "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Bold.ttf",
        "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/static/Montserrat-Bold.ttf",
        "https://www.markvision.kz/fonts/Montserrat.ttf",
      ];
      for (const u of fontUrls) {
        try {
          await downloadTo(u, fontRel);
          const sz = await fs.stat(fontRel).then((s) => s.size).catch(() => 0);
          if (sz > 50000) { hasFont = true; fontSrc = "cdn:" + u + " (" + sz + "b)"; break; }
          log("font too small from", u, sz);
        } catch (e) { log("font dl failed:", u, e.message); }
      }
    }
    log("font:", fontSrc, "hasFont:", hasFont, "srtLen:", srt.length);

    // ===== ffmpeg: видео (zoom-fill + биролы с переходами) + аудио (голос+музыка+SFX) =====
    const args = ["-y", "-i", userPath];
    for (const ov of pickedOverlaySegs) args.push("-i", ov.path);

    // индексы доп. аудио-входов
    let inputIdx = 1 + pickedOverlaySegs.length;
    let musicIdx = -1;
    if (musicPath) { args.push("-stream_loop", "-1", "-i", musicPath); musicIdx = inputIdx; inputIdx += 1; }
    const sfxIdx = [];
    if (sfxPath) {
      for (let i = 0; i < pickedOverlaySegs.length; i += 1) { args.push("-i", sfxPath); sfxIdx.push(inputIdx); inputIdx += 1; }
    }

    const filter = [];
    const zoomW = Math.round(outW * 1.18);
    const zoomH = Math.round(outH * 1.18);
    filter.push(
      `[0:v]scale=${zoomW}:${zoomH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},fps=30,setsar=1[base0]`,
    );
    let cur = "base0";
    const autoZoom = body.autoZoom !== false;
    pickedOverlaySegs.forEach((ov, i) => {
      const inIdx = i + 1;
      const od = Math.max(0.6, ov.end - ov.start);
      const fadeD = Math.min(0.3, od / 3);
      const zoomFilter = autoZoom ? `,zoompan=z='min(zoom+0.0015,1.10)':d=1:s=${outW}x${outH}:fps=30` : "";
      // переход: trim до длины оверлея + fade in/out на склейках
      filter.push(
        `[${inIdx}:v]scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH}${zoomFilter},fps=30,trim=0:${od.toFixed(2)},` +
        `fade=t=in:st=0:d=${fadeD.toFixed(2)},fade=t=out:st=${(od - fadeD).toFixed(2)}:d=${fadeD.toFixed(2)},` +
        `setsar=1,setpts=PTS-STARTPTS+${ov.start.toFixed(2)}/TB[ov${i}]`,
      );
      const next = `v${i}`;
      filter.push(
        `[${cur}][ov${i}]overlay=enable='between(t,${ov.start.toFixed(2)},${ov.end.toFixed(2)})':shortest=0[${next}]`,
      );
      cur = next;
    });

    // Титры через subtitles/libass. На serverless fontconfig без writable-кэша
    // и конфига не находит шрифт → текст не рисуется. Чиним: свой fonts.conf
    // (папка со шрифтом + cachedir в /tmp) и env HOME/XDG_CACHE_HOME/FONTCONFIG_FILE.
    const fontDir = path.dirname(fontRel);
    const fontsConf = path.join(workDir, "fonts.conf");
    const fcCache = path.join(workDir, "fc-cache");
    await fs.mkdir(fcCache, { recursive: true }).catch(() => {});
    await fs.writeFile(
      fontsConf,
      `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n` +
        `<dir>${fontDir}</dir>\n<cachedir>${fcCache}</cachedir>\n` +
        `<match target="pattern"><test name="family"><string>sans-serif</string></test>` +
        `<edit name="family" mode="assign" binding="strong"><string>Montserrat</string></edit></match>\n` +
        `</fontconfig>\n`,
    );
    const ffEnv = { HOME: workDir, XDG_CACHE_HOME: workDir, FONTCONFIG_FILE: fontsConf, FONTCONFIG_PATH: fontDir };

    let captionsDrawn = 0;
    if (srt && hasFont) {
      const preset =
        style === "calm" || style === "minimal"
          ? { primary: "&H00FFFFFF", back: "&H60000000", outline: 2, bold: 0 }
          : { primary: "&H0000FFFF", back: "&HA0000000", outline: 4, bold: 1 };
      const fontSize = Math.round(outH * 0.034);
      const marginV = Math.round(outH * 0.22);
      const styled =
        `FontName=Montserrat,FontSize=${fontSize},PrimaryColour=${preset.primary},` +
        `OutlineColour=&H00000000,BackColour=${preset.back},BorderStyle=3,` +
        `Outline=${preset.outline},Shadow=0,Alignment=2,MarginV=${marginV},Bold=${preset.bold}`;
      const escSrt = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
      const fontsDir = fontDir.replace(/\\/g, "/").replace(/:/g, "\\:");
      filter.push(`[${cur}]subtitles='${escSrt}':fontsdir='${fontsDir}':force_style='${styled}'[vout]`);
      cur = "vout";
      captionsDrawn = (srt.match(/-->/g) || []).length;
    }

    // ----- аудио-граф -----
    const useAudio = musicIdx >= 0 || sfxIdx.length > 0;
    let audioMap = "0:a?";
    if (useAudio) {
      const mix = [];
      if (musicIdx >= 0) {
        // голос делим: основной + сайдчейн для duck'инга музыки
        filter.push(`[0:a]aresample=44100,asplit=2[va][vsc]`);
        filter.push(`[${musicIdx}:a]aresample=44100,volume=${musicVolume}[mraw]`);
        filter.push(`[mraw][vsc]sidechaincompress=threshold=0.05:ratio=8:attack=20:release=300[mduck]`);
        mix.push("[va]", "[mduck]");
      } else {
        filter.push(`[0:a]aresample=44100[va]`);
        mix.push("[va]");
      }
      sfxIdx.forEach((idx, i) => {
        const ms = Math.round(pickedOverlaySegs[i].start * 1000);
        filter.push(`[${idx}:a]adelay=${ms}|${ms},volume=0.6[sfx${i}]`);
        mix.push(`[sfx${i}]`);
      });
      if (mix.length > 1) {
        filter.push(`${mix.join("")}amix=inputs=${mix.length}:normalize=0:dropout_transition=0,alimiter=limit=0.95[aout]`);
        audioMap = "[aout]";
      } else {
        audioMap = "[va]";
      }
    }

    args.push("-filter_complex", filter.join(";"));
    args.push("-map", `[${cur}]`, "-map", audioMap);
    args.push(
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
      "-t", String(sourceDur), outPath,
    );

    await runFfmpeg(args, { label: "render", env: ffEnv });

    const buffer = await fs.readFile(outPath);
    const storagePath = `direct/${Date.now()}.mp4`;

    // Хранилище рендеров: предпочитаем выделенный проект (RENDER_SUPABASE_*),
    // иначе основной. Сбой аплоада не должен ронять весь монтаж.
    const storageClient =
      RENDER_SUPABASE_URL && RENDER_SUPABASE_KEY
        ? createClient(RENDER_SUPABASE_URL, RENDER_SUPABASE_KEY, { auth: { persistSession: false } })
        : supabase;
    const storageBucket = RENDER_SUPABASE_URL && RENDER_SUPABASE_KEY ? RENDER_BUCKET_DIRECT : RENDER_BUCKET;

    let outputUrl = null;
    let uploadError = null;
    try {
      const { error } = await storageClient.storage
        .from(storageBucket)
        .upload(storagePath, buffer, { contentType: "video/mp4", upsert: true });
      if (error) throw new Error(error.message);
      outputUrl = storageClient.storage.from(storageBucket).getPublicUrl(storagePath).data.publicUrl;
    } catch (e) {
      uploadError = e.message;
      log("upload failed (non-fatal):", e.message);
    }

    // Telegram отправляем из локального файла — работает даже если хранилище недоступно
    let telegramMessageId = null;
    if (body.sendTelegram !== false && telegramChatId) {
      try {
        telegramMessageId = await sendTelegramVideo(
          telegramChatId, outPath,
          `🎬 AI Montage готов\nО чём: ${(analysis.summary || "видео").slice(0, 120)}\nДлит.: ${Math.round(sourceDur)} сек · B-roll: ${pickedOverlaySegs.length}× · Титры: ${analysis.words?.length || 0} слов`,
        );
      } catch (e) { log("telegram failed:", e.message); }
    }

    return res.status(200).json({
      success: true,
      output_url: outputUrl,
      upload_error: uploadError,
      duration_sec: sourceDur,
      words: analysis.words?.length || 0,
      overlays: pickedOverlaySegs.length,
      summary: analysis.summary || "",
      telegram_message_id: telegramMessageId,
      debug: { hasFont, fontSrc, srtLen: srt.length, captionsDrawn },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    log("ERROR:", message);
    return res.status(500).json({ error: message });
  } finally {
    try { await fs.rm(workDir, { recursive: true, force: true }); } catch {}
  }
}
