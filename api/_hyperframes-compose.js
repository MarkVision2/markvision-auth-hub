/**
 * HyperFrames HTML Composer
 * Генерирует HTML-композицию из данных проекта AI-монтажа.
 * Формат: HTML с data-атрибутами, которые HyperFrames рендерит в MP4.
 */

const STYLE_PALETTES = {
  viral_hormozi: {
    captionBg: "rgba(255,214,0,0.92)",
    captionColor: "#0a0a0a",
    highlightBg: "#ff3b00",
    highlightColor: "#ffffff",
    fontFamily: "'Arial Black', Impact, sans-serif",
    fontSize: "52px",
    fontWeight: "900",
    textShadow: "3px 3px 0 rgba(0,0,0,0.4)",
    letterSpacing: "-0.5px",
    textTransform: "uppercase",
  },
  minimal_clean: {
    captionBg: "rgba(0,0,0,0.72)",
    captionColor: "#ffffff",
    highlightBg: "rgba(255,255,255,0.15)",
    highlightColor: "#ffe066",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: "44px",
    fontWeight: "700",
    textShadow: "0 2px 12px rgba(0,0,0,0.6)",
    letterSpacing: "0px",
    textTransform: "none",
  },
  business_clinic: {
    captionBg: "rgba(15,40,100,0.88)",
    captionColor: "#ffffff",
    highlightBg: "#1a73e8",
    highlightColor: "#ffffff",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "40px",
    fontWeight: "700",
    textShadow: "0 1px 6px rgba(0,0,0,0.5)",
    letterSpacing: "0.3px",
    textTransform: "none",
  },
};

const DEFAULT_PALETTE = STYLE_PALETTES.viral_hormozi;

/**
 * @param {string} style - viral_hormozi | minimal_clean | business_clinic
 * @param {object} project - поля из ai_edit_projects
 * @param {Array} segments - из ai_edit_segments (type: caption, broll, zoom, sfx, scene)
 * @param {Array} assets - из ai_edit_assets (kind: broll)
 * @returns {string} HTML-строка для HyperFrames
 */
export function generateHyperframesComposition({ project, segments, assets }) {
  const style = project.style || "viral_hormozi";
  const palette = STYLE_PALETTES[style] || DEFAULT_PALETTE;
  const format = project.format || "9:16";
  const width = format === "1:1" ? 1080 : 1080;
  const height = format === "1:1" ? 1080 : 1920;

  // Вычислить общую длительность из сегментов
  const maxEndMs = segments.reduce((max, s) => Math.max(max, s.end_ms || 0), 0);
  const durationSec = Math.max(
    Math.ceil(maxEndMs / 1000) + 1,
    project.source_duration_sec || 10
  );

  // Разбить по типам
  const captions = segments.filter((s) => s.type === "caption");
  const brollSegs = segments.filter((s) => s.type === "broll");
  const zoomSegs = segments.filter((s) => s.type === "zoom");

  // Строить B-roll map по query
  const brollByQuery = new Map(
    (assets || [])
      .filter((a) => a.kind === "broll" && a.url && a.status === "ready")
      .map((a) => [String(a.prompt || "").toLowerCase(), a])
  );

  // Шаблонные строки элементов
  const videoTrack = `  <video
    id="main-video"
    data-start="0"
    data-duration="${durationSec}"
    data-track-index="0"
    src="${escHtml(project.source_video_url || "")}"
    muted
    playsinline
    style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;"
  ></video>`;

  // Субтитры (каждое слово — отдельный элемент)
  const captionEls = captions.map((seg, i) => {
    const start = (seg.start_ms || 0) / 1000;
    const dur = Math.max((seg.end_ms - seg.start_ms) / 1000, 0.1);
    const data = seg.data || {};
    const word = escHtml(data.text || data.word || "");
    const isHighlight = data.highlight;

    const bg = isHighlight ? palette.highlightBg : palette.captionBg;
    const color = isHighlight ? palette.highlightColor : palette.captionColor;
    const scale = isHighlight ? "scale(1.08)" : "scale(1)";

    return `  <div
    id="cap-${i}"
    data-start="${start.toFixed(3)}"
    data-duration="${dur.toFixed(3)}"
    data-track-index="1"
    style="
      position:absolute;
      bottom:18%;
      left:50%;
      transform:translateX(-50%) ${scale};
      background:${bg};
      color:${color};
      font-family:${palette.fontFamily};
      font-size:${palette.fontSize};
      font-weight:${palette.fontWeight};
      letter-spacing:${palette.letterSpacing};
      text-transform:${palette.textTransform};
      text-shadow:${palette.textShadow};
      padding:8px 20px;
      border-radius:8px;
      white-space:nowrap;
      max-width:90%;
      text-align:center;
    "
  >${word}</div>`;
  }).join("\n");

  // B-roll оверлеи
  const brollEls = brollSegs.map((seg, i) => {
    const data = seg.data || {};
    const query = String(data.query || "").toLowerCase();
    const asset = brollByQuery.get(query) || [...brollByQuery.values()][0];
    if (!asset) return "";

    const start = (seg.start_ms || 0) / 1000;
    const dur = Math.max((seg.end_ms - seg.start_ms) / 1000, 1);
    const opacity = data.opacity ?? 1;
    const isCutaway = data.mode === "cutaway";

    return `  <video
    id="broll-${i}"
    data-start="${start.toFixed(3)}"
    data-duration="${dur.toFixed(3)}"
    data-track-index="${isCutaway ? 0 : 2}"
    src="${escHtml(asset.url)}"
    muted
    playsinline
    style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:${opacity};"
  ></video>`;
  }).filter(Boolean).join("\n");

  // Zoom-зоны через CSS transition (упрощённо — HyperFrames не имеет встроенного zoom,
  // но можно эмулировать через inline GSAP animation data-attributes)
  const zoomEls = zoomSegs.map((seg, i) => {
    const start = (seg.start_ms || 0) / 1000;
    const dur = Math.max((seg.end_ms - seg.start_ms) / 1000, 0.5);
    return `  <div
    id="zoom-${i}"
    data-start="${start.toFixed(3)}"
    data-duration="${dur.toFixed(3)}"
    data-track-index="3"
    data-gsap='{"to":{"scale":1.08,"duration":0.3,"ease":"power2.inOut"},"from":{"scale":1}}'
    style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"
  ></div>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AI Montage — ${escHtml(project.id || "")}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; overflow: hidden; }
    #stage { position: relative; overflow: hidden; }
  </style>
</head>
<body>
<div
  id="stage"
  data-composition-id="ai-montage-${escHtml(project.id || "render")}"
  data-start="0"
  data-width="${width}"
  data-height="${height}"
  style="width:${width}px;height:${height}px;background:#0a0a0a;"
>
${videoTrack}
${brollEls}
${captionEls}
${zoomEls}
</div>
</body>
</html>`;

  return html;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
