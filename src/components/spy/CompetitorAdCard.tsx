import { Eye, EyeOff, Sparkles, ImageOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface MockAd {
  id: string;
  advertiser: string;
  avatar: string;
  activeSince: string;
  media: "4:5" | "9:16";
  copy: string;
  platform: string;
  weaknesses: string[];
  improved: string;
  suggestedFormat: string;
  media_url?: string | null;
  source_url?: string | null;
}

interface Props {
  ad: MockAd;
  isMonitored: boolean;
  onToggleMonitor: () => void;
  onRebuild: () => void;
}

const COPY_LIMIT = 180;

export function CompetitorAdCard({ ad, isMonitored, onToggleMonitor, onRebuild }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hasImage = !!ad.media_url && !imgError;
  const copyText = ad.copy?.trim() || "";
  const isLong = copyText.length > COPY_LIMIT;
  const displayCopy = expanded ? copyText : isLong ? copyText.slice(0, COPY_LIMIT) + "…" : copyText;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border/40 bg-card overflow-hidden transition-all hover:border-border/70 hover:shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {ad.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{ad.advertiser}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
            Активно с {ad.activeSince}
          </p>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full border border-border/30 shrink-0">
          {ad.platform}
        </span>
      </div>

      {/* Media or Text Body */}
      <div className="flex-1 px-4 pb-3">
        {hasImage ? (
          <div className="rounded-xl overflow-hidden border border-border/20 bg-muted/30">
            <img
              src={ad.media_url!}
              alt={`Реклама ${ad.advertiser}`}
              className="w-full object-cover max-h-[280px]"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </div>
        ) : null}

        {copyText && (
          <div className={`${hasImage ? "mt-3" : ""} rounded-xl bg-muted/30 border border-border/20 p-4`}>
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words">
              {displayCopy}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-primary/70 hover:text-primary text-xs font-medium transition-colors"
              >
                {expanded ? "свернуть ↑" : "показать всё ↓"}
              </button>
            )}
          </div>
        )}

        {!hasImage && !copyText && (
          <div className="rounded-xl bg-muted/20 border border-border/20 p-6 flex flex-col items-center gap-2 text-muted-foreground/40">
            <ImageOff size={22} />
            <span className="text-xs">Нет превью</span>
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <span className="text-[10px] font-mono text-muted-foreground/50 bg-secondary/40 px-2 py-0.5 rounded border border-border/20">
          {ad.media}
        </span>
        {ad.source_url && (
          <a
            href={ad.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground/50 hover:text-primary flex items-center gap-0.5 transition-colors"
          >
            <ExternalLink size={10} /> источник
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4 mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMonitor}
          className={`flex-1 h-9 text-xs rounded-lg transition-all ${
            isMonitored
              ? "text-primary bg-primary/5 border-primary/20 hover:bg-primary/10"
              : "text-muted-foreground hover:text-foreground border-border/40"
          }`}
        >
          {isMonitored ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
          {isMonitored ? "Убрать" : "В мониторинг"}
        </Button>

        <Button
          size="sm"
          onClick={onRebuild}
          className="flex-1 h-9 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-[0_0_20px_-4px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_-4px_rgba(139,92,246,0.6)] transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Пересобрать ИИ
        </Button>
      </div>
    </div>
  );
}
