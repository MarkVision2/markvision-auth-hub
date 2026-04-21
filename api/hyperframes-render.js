/**
 * POST /api/hyperframes-render
 *
 * Рендерит видео через HyperFrames (HTML → MP4) вместо Remotion.
 * Требует запущенного HyperFrames producer-сервера на HYPERFRAMES_SERVER_URL.
 *
 * Body: { projectId: string, taskToken?: string }
 * Response: { success: true, renderId: string, url: string }
 */

import { createClient } from "@supabase/supabase-js";
import { generateHyperframesComposition } from "./_hyperframes-compose.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RENDER_SHARED_TOKEN = process.env.AI_EDIT_RENDER_TOKEN;
const HYPERFRAMES_URL = process.env.HYPERFRAMES_SERVER_URL || "http://n8n.zapoinov.com:9847";
const RENDER_BUCKET = "ai-edit-renders";

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
    return res.status(500).json({ error: "Supabase credentials missing" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // 1. Загрузить данные проекта
    const { data: project, error: projectError } = await supabase
      .from("ai_edit_projects")
      .select(
        "id, owner_id, source_video_url, format, style, intensity, source_duration_sec, caption_language"
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: projectError?.message || "Project not found" });
    }

    // 2. Загрузить сегменты и ассеты
    const [{ data: segments = [] }, { data: assets = [] }] = await Promise.all([
      supabase
        .from("ai_edit_segments")
        .select("id, type, start_ms, end_ms, order_index, data")
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        .order("order_index", { ascending: true }),
      supabase
        .from("ai_edit_assets")
        .select("id, kind, prompt, url, status")
        .eq("project_id", projectId)
        .eq("status", "ready"),
    ]);

    // 3. Сгенерировать HTML-композицию
    const html = generateHyperframesComposition({ project, segments, assets });

    // 4. Отправить на HyperFrames сервер
    const hfRes = await fetch(`${HYPERFRAMES_URL}/render`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        html,
        fps: 30,
        quality: "high",
        format: "mp4",
      }),
      signal: AbortSignal.timeout(600_000), // 10 мин
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text().catch(() => "");
      throw new Error(`HyperFrames render failed HTTP ${hfRes.status}: ${errText.slice(0, 400)}`);
    }

    const hfJson = await hfRes.json();
    const downloadToken = hfJson?.token || hfJson?.outputToken || hfJson?.id;

    if (!downloadToken) {
      throw new Error(`HyperFrames: нет токена в ответе: ${JSON.stringify(hfJson).slice(0, 300)}`);
    }

    // 5. Скачать готовое MP4
    const mp4Res = await fetch(`${HYPERFRAMES_URL}/outputs/${downloadToken}`, {
      signal: AbortSignal.timeout(120_000),
    });

    if (!mp4Res.ok) {
      throw new Error(`HyperFrames: не удалось скачать MP4 (HTTP ${mp4Res.status})`);
    }

    const arrayBuffer = await mp4Res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Загрузить в Supabase Storage
    const storagePath = `${project.owner_id}/${projectId}/${Date.now()}-hf.mp4`;
    const { error: uploadError } = await supabase.storage
      .from(RENDER_BUCKET)
      .upload(storagePath, buffer, { contentType: "video/mp4", upsert: false });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(RENDER_BUCKET)
      .getPublicUrl(storagePath);

    const outputUrl = publicUrlData.publicUrl;

    // 7. Сохранить запись рендера
    const { data: render, error: renderError } = await supabase
      .from("ai_edit_renders")
      .insert({
        project_id: projectId,
        version: 1,
        output_url: outputUrl,
        duration_sec: project.source_duration_sec,
        size_bytes: buffer.length,
        status: "completed",
        variant_name: "default",
        variant_notes: "HyperFrames render",
      })
      .select()
      .single();

    if (renderError) {
      throw new Error(`Render row insert failed: ${renderError.message}`);
    }

    // 8. Обновить статус проекта
    await supabase
      .from("ai_edit_projects")
      .update({ status: "completed", progress: 100, progress_text: "Готово" })
      .eq("id", projectId);

    return res.status(200).json({
      success: true,
      renderId: render.id,
      url: outputUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    await supabase
      ?.from("ai_edit_projects")
      .update({ status: "failed", error_message: message })
      .eq("id", projectId)
      .catch(() => null);

    return res.status(500).json({ error: message });
  }
}
