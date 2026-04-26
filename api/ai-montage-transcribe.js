// Шаг "Транскрибация" в n8n-пайплайне ИИ монтажа.
// Вход: { project_id }
// 1) скачивает source_video_url
// 2) Gemini 2.5-flash → words + segments + summary
// 3) сохраняет в ai_edit_projects.analysis_json
// 4) возвращает { project_id, words_count, segments_count, summary }
//
// Render-эндпоинт после этого использует analysis_json из БД и не зовёт Gemini повторно.

import { promises as fs, createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { createClient } from "@supabase/supabase-js";

export const config = {
  maxDuration: 120,
  memory: 1024,
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

const log = (...args) => console.log("[ai-transcribe]", ...args);

const downloadTo = async (url, destPath) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${url} failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
  return buf.length;
};

const LANG_NAME = { ru: "русском", en: "English", kk: "казахском", uz: "узбекском" };
const buildPrompt = ({ language = "ru", scriptHint = "" } = {}) => {
  const lang = LANG_NAME[language] || "русском";
  const hint = scriptHint
    ? `\nКонтекст эксперта:\n"""${String(scriptHint).slice(0, 600)}"""\n`
    : "";
  return `Ты — ассистент AI-монтажёра. Проанализируй это видео эксперта на ${lang}.${hint}
Верни СТРОГО JSON вида:
{
  "language": "${language}",
  "summary": "1-2 предложения о теме видео",
  "words": [{"t": 0.12, "d": 0.35, "w": "Привет"}],
  "segments": [{"start": 0.0, "end": 6.2, "text": "...", "broll_query": "business meeting", "emphasis": "normal"}]
}
Правила:
- words: каждое произнесённое слово, t — старт в сек, d — длительность в сек.
- segments: 4-8 секундные блоки; broll_query — английская фраза 2-4 слова для Pexels.
- emphasis: "high" для ключевых эмоциональных слов, иначе "normal".
- Никаких преамбул, только чистый JSON.`;
};

const callGeminiInline = async (buffer, prompt) => {
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

const callGeminiFileApi = async (videoPath, sizeBytes, prompt) => {
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
    tokens.forEach((tok, i) => {
      out.push({ t: +(start + slice * i).toFixed(3), d: +slice.toFixed(3), w: tok });
    });
  }
  return out;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const projectId = body.project_id || body.projectId;
  if (!projectId) return res.status(400).json({ error: "project_id is required" });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    return res.status(500).json({ error: "Supabase credentials missing" });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY missing" });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const workDir = await fs.mkdtemp(path.join(tmpdir(), "aim-trans-"));
  const userPath = path.join(workDir, "user.mp4");

  try {
    const { data: project, error: projectError } = await supabase
      .from("ai_edit_projects")
      .select("id, source_video_url, caption_language, script_hint, analysis_json")
      .eq("id", projectId)
      .single();
    if (projectError || !project) throw new Error(projectError?.message || "Project not found");
    if (!project.source_video_url) throw new Error("source_video_url is empty");

    // Если уже транскрибировано — возвращаем без перезапроса (idempotent для n8n).
    if (project.analysis_json && project.analysis_json.words?.length) {
      log("cached analysis_json found:", project.analysis_json.words.length, "words");
      return res.status(200).json({
        project_id: projectId,
        cached: true,
        words_count: project.analysis_json.words.length,
        segments_count: project.analysis_json.segments?.length || 0,
        summary: project.analysis_json.summary || "",
      });
    }

    await supabase.from("ai_edit_projects").update({
      status: "transcribing",
      stage: "transcription",
      progress: 25,
      progress_text: "Транскрибация через Gemini",
    }).eq("id", projectId);

    log("downloading source", project.source_video_url);
    const sourceSize = await downloadTo(project.source_video_url, userPath);
    log("source size:", sourceSize, "bytes");

    const prompt = buildPrompt({
      language: project.caption_language,
      scriptHint: project.script_hint,
    });
    const analysis =
      sourceSize < 18 * 1024 * 1024
        ? await callGeminiInline(await fs.readFile(userPath), prompt)
        : await callGeminiFileApi(userPath, sourceSize, prompt);

    if ((!Array.isArray(analysis.words) || analysis.words.length === 0) && Array.isArray(analysis.segments)) {
      analysis.words = wordsFromSegments(analysis.segments);
      log("derived", analysis.words.length, "words from segments");
    }

    log("analysis: words=", analysis.words?.length || 0, "segments=", analysis.segments?.length || 0);

    await supabase.from("ai_edit_projects").update({
      analysis_json: analysis,
      progress: 50,
      progress_text: `Транскрибация готова: ${analysis.words?.length || 0} слов`,
    }).eq("id", projectId);

    return res.status(200).json({
      project_id: projectId,
      cached: false,
      words_count: analysis.words?.length || 0,
      segments_count: analysis.segments?.length || 0,
      summary: analysis.summary || "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcribe failed";
    log("ERROR:", message);
    try {
      await supabase.from("ai_edit_projects").update({
        status: "failed",
        stage: "transcription",
        error_message: message,
      }).eq("id", projectId);
    } catch {}
    return res.status(500).json({ error: message });
  } finally {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch {}
  }
}
