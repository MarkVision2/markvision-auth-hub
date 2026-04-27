import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TranscriptWord {
  t: number;
  d: number;
  w: string;
}

interface PanelProps {
  videoSrc: string | null;
  panY: number;
  zoom: number;
  onChange: (next: { panY: number; zoom: number }) => void;
  label: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

// Одна панель: контейнер с overflow:hidden + <video> внутри.
// Draggable: pointerdown/move/up меняют panY (0=верх, 100=низ).
// CSS трансформация подобна FFmpeg: scale=zoom%, vertical pan через translate.
function Panel({ videoSrc, panY, zoom, onChange, label, videoRef }: PanelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef<{ startY: number; startPanY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!wrapperRef.current) return;
    wrapperRef.current.setPointerCapture(e.pointerId);
    dragStateRef.current = { startY: e.clientY, startPanY: panY };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStateRef.current || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const deltaPx = e.clientY - dragStateRef.current.startY;
    // Тащим вниз → видео сдвигается вниз → показываем верх источника → panY уменьшается
    const deltaPct = (deltaPx / rect.height) * 100;
    const next = Math.max(0, Math.min(100, dragStateRef.current.startPanY - deltaPct));
    onChange({ panY: next, zoom });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (wrapperRef.current?.hasPointerCapture(e.pointerId)) {
      wrapperRef.current.releasePointerCapture(e.pointerId);
    }
    dragStateRef.current = null;
    setDragging(false);
  };

  // Маппинг panY (0..100) на CSS object-position-y%.
  // panY=50 — центр (как FFmpeg при ih*0.5 offset). panY=0 — показываем верх источника.
  const objectPositionY = panY;

  return (
    <div
      ref={wrapperRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        "relative h-1/2 w-full overflow-hidden border-b border-primary/20 last:border-b-0",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{ touchAction: "none" }}
    >
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full"
          style={{
            objectFit: "cover",
            objectPosition: `50% ${objectPositionY}%`,
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center center",
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-secondary/20 text-[10px] font-bold uppercase text-muted-foreground/60">
          {label} (нет видео)
        </div>
      )}
      {/* подсказка */}
      <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80">
        {label}
      </div>
      <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white/80">
        Y:{Math.round(panY)} Z:{Math.round(zoom)}
      </div>
    </div>
  );
}

interface SubtitleOverlayProps {
  words: TranscriptWord[];
  time: number;
  fontSize?: number;
  yPct: number; // 0..100 — позиция (0=верх, 100=низ)
  onChange: (yPct: number) => void;
}

function SubtitleOverlay({ words, time, fontSize = 11, yPct, onChange }: SubtitleOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startYPct: number; parentH: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDown = (e: React.PointerEvent) => {
    if (!ref.current) return;
    const parent = ref.current.parentElement;
    if (!parent) return;
    ref.current.setPointerCapture(e.pointerId);
    dragRef.current = {
      startY: e.clientY,
      startYPct: yPct,
      parentH: parent.getBoundingClientRect().height,
    };
    setDragging(true);
    e.stopPropagation();
  };
  const handleMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const deltaPx = e.clientY - dragRef.current.startY;
    const deltaPct = (deltaPx / dragRef.current.parentH) * 100;
    onChange(Math.max(5, Math.min(95, dragRef.current.startYPct + deltaPct)));
    e.stopPropagation();
  };
  const handleUp = (e: React.PointerEvent) => {
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setDragging(false);
  };

  if (!words.length) return null;
  // Берём 3 слова вокруг текущего времени (как в SRT chunkWords=3).
  let activeIdx = -1;
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    if (w.t <= time && time < w.t + w.d) {
      activeIdx = i;
      break;
    }
  }
  if (activeIdx < 0) {
    // Если попали между словами — берём ближайшее предыдущее
    for (let i = words.length - 1; i >= 0; i -= 1) {
      if (words[i].t <= time) {
        activeIdx = i;
        break;
      }
    }
  }
  if (activeIdx < 0) return null;
  const groupStart = Math.floor(activeIdx / 3) * 3;
  const group = words.slice(groupStart, groupStart + 3);
  const text = group.map((w) => w.w.toUpperCase()).join(" ");
  return (
    <div
      ref={ref}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      className={cn(
        "absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-sm px-2 py-1 font-bold tracking-wide select-none",
        dragging ? "cursor-grabbing ring-2 ring-yellow-400" : "cursor-grab hover:ring-1 hover:ring-yellow-300/60",
      )}
      style={{
        top: `${yPct}%`,
        transform: "translate(-50%, -50%)",
        fontFamily: "Montserrat, system-ui, sans-serif",
        fontSize: `${fontSize}px`,
        color: "#ffff00",
        backgroundColor: "rgba(0,0,0,0.65)",
        textShadow: "0 0 2px #000, 0 0 2px #000",
        touchAction: "none",
      }}
    >
      {text}
    </div>
  );
}

export interface MontagePreviewCanvasProps {
  topVideoUrl: string | null;
  bottomVideoUrl: string | null;
  topPanY: number;
  topZoom: number;
  expertPanY: number;
  expertZoom: number;
  onTopChange: (next: { panY: number; zoom: number }) => void;
  onExpertChange: (next: { panY: number; zoom: number }) => void;
  words: TranscriptWord[];
  durationSec: number;
  isSplit: boolean; // если false — нижняя панель занимает всю высоту
  subtitleYPct: number;
  onSubtitleYChange: (yPct: number) => void;
}

export default function MontagePreviewCanvas({
  topVideoUrl,
  bottomVideoUrl,
  topPanY,
  topZoom,
  expertPanY,
  expertZoom,
  onTopChange,
  onExpertChange,
  words,
  durationSec,
  isSplit,
  subtitleYPct,
  onSubtitleYChange,
}: MontagePreviewCanvasProps) {
  const topVideoRef = useRef<HTMLVideoElement>(null);
  const bottomVideoRef = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const syncVideos = useCallback((t: number) => {
    [topVideoRef, bottomVideoRef].forEach((ref) => {
      const v = ref.current;
      if (v && Number.isFinite(v.duration) && v.duration > 0) {
        const target = Math.min(t, v.duration - 0.1);
        if (Math.abs(v.currentTime - target) > 0.15) {
          v.currentTime = target;
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setTime((t) => {
        const next = t + dt;
        if (durationSec > 0 && next >= durationSec) return 0;
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, durationSec]);

  useEffect(() => {
    syncVideos(time);
  }, [time, syncVideos]);

  // Когда переключаем play/pause — управляем нативным video.play()/pause().
  useEffect(() => {
    [topVideoRef, bottomVideoRef].forEach((ref) => {
      const v = ref.current;
      if (!v) return;
      if (playing) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [playing]);

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
        {isSplit ? (
          <>
            <Panel
              videoSrc={topVideoUrl}
              panY={topPanY}
              zoom={topZoom}
              onChange={onTopChange}
              label="ДЕМО"
              videoRef={topVideoRef}
            />
            <Panel
              videoSrc={bottomVideoUrl}
              panY={expertPanY}
              zoom={expertZoom}
              onChange={onExpertChange}
              label="ЭКСПЕРТ"
              videoRef={bottomVideoRef}
            />
          </>
        ) : (
          <Panel
            videoSrc={bottomVideoUrl}
            panY={expertPanY}
            zoom={expertZoom}
            onChange={onExpertChange}
            label="ВИДЕО"
            videoRef={bottomVideoRef}
          />
        )}
        <SubtitleOverlay
          words={words}
          time={time}
          fontSize={11}
          yPct={subtitleYPct}
          onChange={onSubtitleYChange}
        />
      </div>

      {/* Scrubber + play/pause */}
      <div className="mx-auto flex w-full max-w-[300px] items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90"
          aria-label={playing ? "Пауза" : "Воспроизведение"}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(durationSec * 10))}
          step={1}
          value={Math.floor(time * 10)}
          onChange={(e) => {
            const t = Number(e.target.value) / 10;
            setTime(t);
          }}
          className="flex-1"
        />
        <span className="w-12 text-right font-mono text-[10px] text-muted-foreground">
          {time.toFixed(1)}/{durationSec.toFixed(0)}s
        </span>
      </div>

      {/* Зум-слайдеры под кадром (drag для panY уже есть, для зума удобнее ползунок) */}
      <div className="mx-auto grid w-full max-w-[300px] gap-2">
        {isSplit && (
          <div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-foreground/70">
              <span>Зум демо</span>
              <span className="font-mono text-primary">{topZoom}%</span>
            </div>
            <input
              type="range"
              min={80}
              max={150}
              step={5}
              value={topZoom}
              onChange={(e) => onTopChange({ panY: topPanY, zoom: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        )}
        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold text-foreground/70">
            <span>Зум {isSplit ? "эксперта" : "видео"}</span>
            <span className="font-mono text-primary">{expertZoom}%</span>
          </div>
          <input
            type="range"
            min={80}
            max={150}
            step={5}
            value={expertZoom}
            onChange={(e) => onExpertChange({ panY: expertPanY, zoom: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      <p className="mx-auto max-w-[300px] text-center text-[10px] leading-relaxed text-muted-foreground">
        Перетаскивай: видео — для кадрирования, жёлтый блок титров — чтобы переместить их по экрану. Скрабер показывает кадры по времени.
      </p>
    </div>
  );
}
