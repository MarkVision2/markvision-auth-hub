import { Eye, EyeOff, Sparkles } from "lucide-react";
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
}

interface Props {
  ad: MockAd;
  isMonitored: boolean;
  onToggleMonitor: () => void;
  onRebuild: () => void;
}

export function CompetitorAdCard({ ad, isMonitored, onToggleMonitor, onRebuild }: Props) {
  const [expanded, setExpanded] = useState(false);
  const aspectClass = ad.media === "9:16" ? "aspect-[9/16] max-h-[320px]" : "aspect-[4/5] max-h-[300px]";

  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-md overflow-hidden transition-all hover:border-white/[0.15] hover:shadow-[0_0_40px_-12px_hsl(var(--primary)/0.15)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {ad.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{ad.advertiser}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Активно с {ad.activeSince}
          </p>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/60 bg-card/50 px-2 py-0.5 rounded-full border border-border/30">{ad.platform}</span>
      </div>

      {/* Media placeholder */}
      <div className={`mx-4 rounded-xl bg-gradient-to-br from-card to-accent/20 border border-border/20 ${aspectClass} flex items-center justify-center overflow-hidden`}>
        <div className="text-center space-y-2 opacity-40">
          <div className="h-12 w-12 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-lg">📸</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">{ad.media}</p>
        </div>
      </div>

      {/* Copy */}
      <div className="p-4 pt-3">
        <p className="text-xs text-foreground/80 leading-relaxed">
          {expanded ? ad.copy : ad.copy.slice(0, 90) + "..."}
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-primary/70 hover:text-primary text-[11px] font-medium"
          >
            {expanded ? "свернуть" : "подробнее"}
          </button>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMonitor}
          className={`flex-1 h-9 text-xs rounded-lg border border-border/30 ${
            isMonitored
              ? "text-primary bg-primary/5 border-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {isMonitored ? <EyeOff className="h-3.5 w-3.5 mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
          {isMonitored ? "Убрать" : "В мониторинг"}
        </Button>

        <Button
          size="sm"
          onClick={onRebuild}
          className="flex-1 h-9 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_-4px_rgba(139,92,246,0.7)] transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Пересобрать ИИ
        </Button>
      </div>
    </div>
  );
}
