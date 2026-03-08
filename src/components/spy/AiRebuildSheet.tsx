import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Rocket, AlertTriangle, Zap, ArrowRight, Loader2, Lightbulb, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MockAd } from "./CompetitorAdCard";

interface ExtendedAd extends MockAd {
  improved_headline?: string;
  cta?: string;
}

interface Props {
  ad: ExtendedAd | null;
  loading?: boolean;
  onClose: () => void;
}

export function AiRebuildSheet({ ad, loading, onClose }: Props) {
  const navigate = useNavigate();

  const handleSendToFactory = () => {
    onClose();
    navigate("/content", { state: { prefill: ad?.improved } });
  };

  return (
    <Sheet open={!!ad} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 bg-[hsl(var(--background))] border-l border-white/[0.06] overflow-y-auto">
        {ad && (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_24px_-4px_rgba(139,92,246,0.6)]">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-foreground">AI-Реконструкция оффера</SheetTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{ad.advertiser} · {ad.platform}</p>
                </div>
              </div>
            </SheetHeader>

            {/* Two columns */}
            <div className="grid md:grid-cols-2 gap-0 md:gap-0">
              {/* LEFT — Original */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-white/[0.06]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Оригинал конкурента</h3>
                </div>

                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 mb-4">
                  <p className="text-sm text-foreground/50 leading-relaxed whitespace-pre-wrap">{ad.copy}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Слабые места</p>
                  {loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      AI анализирует...
                    </div>
                  ) : ad.weaknesses.length > 0 ? (
                    <div className="space-y-1.5">
                      {ad.weaknesses.map((w, i) => (
                        <div
                          key={i}
                          className="text-[12px] bg-destructive/5 text-destructive/80 border border-destructive/20 rounded-lg px-3 py-2 leading-relaxed"
                        >
                          ⚠️ {w}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/40">Ожидание анализа...</p>
                  )}
                </div>
              </div>

              {/* RIGHT — Improved */}
              <div className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-blue-500/[0.02] pointer-events-none rounded-br-2xl" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Новый сценарий для вас</h3>
                  </div>

                  {loading ? (
                    <div className="rounded-xl bg-white/[0.03] border border-primary/20 p-8 mb-4 flex flex-col items-center justify-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      </div>
                      <p className="text-sm text-muted-foreground">AI генерирует улучшенный оффер...</p>
                      <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full animate-pulse" style={{ width: "60%" }} />
                      </div>
                    </div>
                  ) : ad.improved ? (
                    <div className="space-y-3 mb-4">
                      {/* Improved headline */}
                      {ad.improved_headline && (
                        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Lightbulb className="h-3 w-3 text-primary" />
                            <p className="text-[10px] uppercase tracking-wider text-primary/70 font-medium">Заголовок-хук</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{ad.improved_headline}</p>
                        </div>
                      )}

                      {/* Main improved text */}
                      <div className="rounded-xl bg-white/[0.03] border border-primary/20 p-4 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.15)]">
                        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{ad.improved}</p>
                      </div>

                      {/* CTA */}
                      {ad.cta && (
                        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Target className="h-3 w-3 text-emerald-500" />
                            <p className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-medium">Призыв к действию</p>
                          </div>
                          <p className="text-sm font-medium text-foreground">{ad.cta}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-8 mb-4 text-center">
                      <p className="text-xs text-muted-foreground/40">Ожидание генерации...</p>
                    </div>
                  )}

                  {!loading && ad.improved && (
                    <div className="space-y-3">
                      {ad.suggestedFormat && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1.5">Рекомендуемый формат</p>
                          <Badge className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-400 border border-purple-500/20 rounded-lg px-3 py-1 text-xs">
                            ✨ {ad.suggestedFormat}
                          </Badge>
                        </div>
                      )}

                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1.5">Прогноз улучшения</p>
                        <div className="flex gap-2">
                          <div className="flex-1 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-center">
                            <p className="text-lg font-bold text-primary font-mono">+180%</p>
                            <p className="text-[10px] text-muted-foreground">CTR</p>
                          </div>
                          <div className="flex-1 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-center">
                            <p className="text-lg font-bold text-primary font-mono">−40%</p>
                            <p className="text-[10px] text-muted-foreground">CPL</p>
                          </div>
                          <div className="flex-1 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-center">
                            <p className="text-lg font-bold text-primary font-mono">3.2x</p>
                            <p className="text-[10px] text-muted-foreground">ROMI</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="sticky bottom-0 p-6 border-t border-white/[0.06] bg-[hsl(var(--background))]/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 flex-1 text-xs text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Сценарий будет передан в Контент-Завод для генерации креативов
                </div>
                <Button
                  onClick={handleSendToFactory}
                  disabled={loading || !ad.improved}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 text-white border-0 rounded-xl shadow-[0_0_30px_-6px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_40px_-6px_hsl(var(--primary)/0.7)] transition-all h-12 px-8 text-sm font-semibold disabled:opacity-50"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Отправить в Контент-Завод
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
