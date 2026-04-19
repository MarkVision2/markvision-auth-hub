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

const getCompositionId = (format) => (format === "1:1" ? "AutoEditSquare" : "AutoEdit");

const STYLE_MAP = {
  viral_hormozi: "viral",
  minimal_clean: "minimal",
  business_clinic: "business",
};

const mapStyle = (preset) => STYLE_MAP[preset] ?? "viral";

const buildInputProps = (project, segments, assets) => {
  const words = [];
  const scenes = [];
  const brollAssets = [];
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
        brollAssets.push({
          url,
          start,
          end,
          mode: data.mode === "cutaway" ? "cutaway" : "overlay",
          opacity: typeof data.opacity === "number" ? data.opacity : 1,
        });
      }
    } else if (seg.type === "scene" || seg.type === "cut") {
      scenes.push({
        start,
        end,
        type: data.scene_type ?? data.type ?? "explanation",
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        emotion: data.emotion === "high" ? "high" : "normal",
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
    });
  }

  return {
    videoUrl: project.source_video_url,
    style: mapStyle(project.style),
    intensity: project.intensity || "medium",
    words,
    scenes,
    brollAssets,
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
      .select("id, owner_id, source_video_url, format, style, intensity, source_duration_sec")
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

    const durationInFrames = Math.max(
      composition.durationInFrames,
      Math.ceil((project.source_duration_sec || 8) * composition.fps),
    );

    const { buffer } = await renderMedia({
      serveUrl,
      composition: { ...composition, durationInFrames },
      codec: "h264",
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
      .update({ status: "completed", progress: 100 })
      .eq("id", projectId);

    return res.status(200).json({ success: true, renderId: render.id, url: publicUrl.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed";
    await supabase
      .from("ai_edit_projects")
      .update({ status: "failed", error_message: message })
      .eq("id", projectId);
    return res.status(500).json({ error: message });
  }
}
