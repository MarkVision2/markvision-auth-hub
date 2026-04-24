import { spawn } from "node:child_process";
import { createWriteStream, createReadStream, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { createClient } from "@supabase/supabase-js";

export const config = {
  maxDuration: 300,
  memory: 3009,
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_AI_MONTAGE_BOT_TOKEN;
const TELEGRAM_DEFAULT_CHAT_ID = process.env.TELEGRAM_AI_MONTAGE_CHAT_ID;
const RENDER_BUCKET = "ai-edit-renders";

const downloadTo = async (url, destPath) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${url} failed: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  await fs.writeFile(destPath, Buffer.from(arrayBuffer));
};

const runFfmpeg = (args) =>
  new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
  });

const pickPexelsClips = async (keyword, limit = 3) => {
  if (!PEXELS_API_KEY) return [];
  const url = `https://api.pexels.com/videos/search?per_page=8&query=${encodeURIComponent(keyword)}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = await res.json();
  const urls = [];
  for (const v of data.videos || []) {
    if (urls.length >= limit) break;
    const files = (v.video_files || [])
      .filter((f) => f.width >= 1280 && f.width <= 1920 && f.height >= 720 && f.height <= 1080)
      .sort((a, b) => a.width - b.width);
    if (files[0]) urls.push(files[0].link);
  }
  return urls;
};

const progressPatch = async (supabase, projectId, patch) => {
  await supabase.from("ai_edit_projects").update(patch).eq("id", projectId);
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
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`,
    { method: "POST", body: form },
  );
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram sendVideo: ${data.description}`);
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
  const outPath = path.join(workDir, "montage.mp4");

  try {
    const { data: project, error: projectError } = await supabase
      .from("ai_edit_projects")
      .select("id, owner_id, source_video_url, format, style, script_hint")
      .eq("id", projectId)
      .single();

    if (projectError || !project) throw new Error(projectError?.message || "Project not found");
    if (!project.source_video_url) throw new Error("source_video_url is empty");

    await progressPatch(supabase, projectId, {
      status: "rendering",
      stage: "rendering",
      progress: 30,
      progress_text: "Загрузка исходников",
    });

    const userPath = path.join(workDir, "user.mp4");
    await downloadTo(project.source_video_url, userPath);

    const keyword = (project.script_hint || project.style || "business").toString().slice(0, 40);
    const brollUrls = await pickPexelsClips(keyword, 3);
    const brollPaths = [];
    for (let i = 0; i < brollUrls.length; i += 1) {
      const p = path.join(workDir, `broll${i + 1}.mp4`);
      await downloadTo(brollUrls[i], p);
      brollPaths.push(p);
    }

    await progressPatch(supabase, projectId, {
      progress: 55,
      progress_text: "Склейка монтажа",
    });

    const isVertical = project.format === "9:16";
    const [outW, outH] = isVertical ? [720, 1280] : [1280, 720];
    const normFilter = `scale=${outW}:${outH}:force_original_aspect_ratio=increase,crop=${outW}:${outH},fps=30,setsar=1`;

    const inputs = [userPath, ...brollPaths, userPath];
    const normalized = [];
    for (let i = 0; i < inputs.length; i += 1) {
      const src = inputs[i];
      const dst = path.join(workDir, `n${i}.mp4`);
      const ss = i === 0 ? "5" : "0";
      const duration = i === inputs.length - 1 ? "3" : "4";
      await runFfmpeg([
        "-y",
        "-ss", ss,
        "-t", duration,
        "-i", src,
        "-vf", normFilter,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "24",
        "-pix_fmt", "yuv420p",
        "-an",
        dst,
      ]);
      normalized.push(dst);
    }

    const listPath = path.join(workDir, "list.txt");
    await fs.writeFile(listPath, normalized.map((p) => `file '${p}'`).join("\n"));
    await runFfmpeg([
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", listPath,
      "-c", "copy",
      outPath,
    ]);

    await progressPatch(supabase, projectId, {
      progress: 80,
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
      variant_name: "ffmpeg-pexels",
      variant_notes: `keyword=${keyword}, format=${project.format || "9:16"}`,
    });

    let telegramMessageId = null;
    try {
      const caption = `🎬 AI Montage готов\nПроект: ${projectId}\nСтиль: ${project.style || "-"} / ${project.format || "-"}\nB-roll: ${brollPaths.length}× Pexels (${keyword})\nURL: ${publicUrl.publicUrl}`;
      telegramMessageId = await sendTelegramVideo(telegramChatId, outPath, caption);
    } catch (tgErr) {
      console.warn("Telegram delivery failed:", tgErr.message);
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
      size_bytes: buffer.length,
      telegram_message_id: telegramMessageId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    await progressPatch(supabase, projectId, {
      status: "failed",
      stage: "rendering",
      error_message: message,
    });
    return res.status(500).json({ error: message });
  } finally {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch {}
  }
}
