import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import {
  buildBrollAssets,
  buildRenderInputProps,
  buildScenes,
  buildStatus,
  buildTranscript,
  decodeTaskToken,
  getVariantPreset,
} from "./_ai-edit-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entryPoint = path.resolve(__dirname, "../src/remotion/index.ts");

let bundlePromise;

const getServeUrl = async () => {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint,
      onProgress(progress) {
        if (progress % 0.25 < 0.01) {
          console.log("[ai-edit-render] bundle progress", Math.round(progress * 100));
        }
      },
    });
  }

  return bundlePromise;
};

const getCompositionId = (format) => {
  return format === "1:1" ? "AutoEditSquare" : "AutoEdit";
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = typeof req.query?.token === "string" ? req.query.token : "";
  const variantId = typeof req.query?.variant === "string" ? req.query.variant : "balanced";

  if (!token) {
    return res.status(400).json({ error: "token is required" });
  }

  try {
    const request = decodeTaskToken(token);
    const status = buildStatus(request, Date.now(), token);

    if (status.status !== "completed") {
      return res.status(409).json({
        error: "Render is not ready yet",
        stage: status.stage,
        progress: status.progress,
      });
    }

    const transcript = buildTranscript(request.scriptHint);
    const scenes = buildScenes(transcript);
    const brollAssets = buildBrollAssets(request, scenes);
    const variant = getVariantPreset(variantId);
    const inputProps = buildRenderInputProps(request, transcript, scenes, brollAssets, variant.id);
    const serveUrl = await getServeUrl();
    const composition = await selectComposition({
      serveUrl,
      id: getCompositionId(request.format),
      inputProps,
    });

    const result = await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      outputLocation: null,
      inputProps,
      concurrency: 1,
      muted: false,
    });

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=\"${request.taskId}-${variant.id}.mp4\"`,
    );
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).send(result.buffer);
  } catch (error) {
    console.error("[ai-edit-render]", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Render failed",
    });
  }
}
