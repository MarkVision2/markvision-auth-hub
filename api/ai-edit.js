import { createTaskId, encodeTaskToken } from "./_ai-edit-utils.js";

const badRequest = (res, message) => res.status(400).json({ error: message });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};

  if (!body.videoUrl) {
    return badRequest(res, "videoUrl is required");
  }

  const createdAt = Date.now();
  const taskId = createTaskId();
  const payload = {
    taskId,
    createdAt,
    videoUrl: body.videoUrl,
    style: body.style || "viral",
    format: body.format || "9:16",
    businessTemplate: body.businessTemplate || "general",
    captionLanguage: body.captionLanguage || "ru",
    clipDurationMode: body.clipDurationMode || "auto",
    clipDurationSec: body.clipDurationSec || null,
    scriptHint: body.scriptHint || "",
    options: {
      autoBroll: body.options?.autoBroll ?? true,
      autoZoom: body.options?.autoZoom ?? true,
      intensity: body.options?.intensity || "medium",
    },
    assets: {
      fontUrl: body.assets?.fontUrl || null,
      brollUrl: body.assets?.brollUrl || null,
      soundUrl: body.assets?.soundUrl || null,
    },
    projectId: body.projectId || null,
  };

  const taskToken = encodeTaskToken(payload);

  return res.status(200).json({
    taskId,
    taskToken,
    statusUrl: `/api/ai-edit-status?token=${encodeURIComponent(taskToken)}`,
  });
}

