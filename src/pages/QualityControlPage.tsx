import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle, Bot, Settings2, CheckCircle2, AlertTriangle,
  Loader2, User, Clock,
} from "lucide-react";

const PROJECT_ID = "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

interface NpsFeedback {
  id: string;
  lead_id: string | null;
  score: number;
  feedback_text: string;
  is_resolved: boolean;
  created_at: string;
  lead_name?: string;
}

function scoreCategory(score: number) {
  if (score >= 9) return { label: "Промоутер", bg: "bg-emerald-500/15 dark:bg-emerald-500/15", border: "border-emerald-500/25", text: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 7) return { label: "Нейтральный", bg: "bg-amber-500/15 dark:bg-amber-500/15", border: "border-amber-500/25", text: "text-amber-600 dark:text-amber-400" };
  return { label: "Критик", bg: "bg-rose-500/15 dark:bg-rose-500/15", border: "border-rose-500/25", text: "text-rose-600 dark:text-rose-400" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
}

export default function QualityControlPage() {
  const [feedback, setFeedback] = useState<NpsFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    try {
      // Fetch feedback with lead names
      const { data, error } = await (supabase as any)
        .from("nps_feedback")
        .select("*, leads(name)")
        .eq("project_id", PROJECT_ID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        lead_id: row.lead_id,
        score: row.score,
        feedback_text: row.feedback_text || "",
        is_resolved: row.is_resolved,
        created_at: row.created_at,
        lead_name: row.leads?.name || "Пациент",
      }));
      setFeedback(mapped);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("nps_feedback_realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "nps_feedback",
        filter: `project_id=eq.${PROJECT_ID}`,
      }, (payload: any) => {
        const row = payload.new;
        setFeedback(prev => [{
          id: row.id,
          lead_id: row.lead_id,
          score: row.score,
          feedback_text: row.feedback_text || "",
          is_resolved: row.is_resolved,
          created_at: row.created_at,
          lead_name: "Пациент",
        }, ...prev]);
        toast({ title: "📩 Новый отзыв получен!", description: `Оценка: ${row.score}/10` });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "nps_feedback",
      }, (payload: any) => {
        const row = payload.new;
        setFeedback(prev => prev.map(f => f.id === row.id ? { ...f, is_resolved: row.is_resolved } : f));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleResolve = async (id: string) => {
    const { error } = await (supabase as any)
      .from("nps_feedback")
      .update({ is_resolved: true })
      .eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, is_resolved: true } : f));
      toast({ title: "✅ Отмечено как обработано" });
    }
  };

  // NPS Calculations
  const total = feedback.length;
  const promoters = feedback.filter(f => f.score >= 9).length;
  const passives = feedback.filter(f => f.score >= 7 && f.score <= 8).length;
  const detractors = feedback.filter(f => f.score <= 6).length;
  const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
  const promoterPct = total > 0 ? Math.round((promoters / total) * 100) : 0;
  const passivePct = total > 0 ? Math.round((passives / total) * 100) : 0;
  const detractorPct = total > 0 ? Math.round((detractors / total) * 100) : 0;

  const npsLabel = npsScore >= 70 ? "Отлично" : npsScore >= 50 ? "Хорошо" : npsScore >= 0 ? "Средне" : "Плохо";

  return (
    <DashboardLayout breadcrumb="Контроль качества">
      <div className="space-y-6 max-w-6xl">
        {/* ── KPI Widgets ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* NPS Score — hero card */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Glow effect */}
            <div
              className="absolute inset-0 opacity-10 dark:opacity-20 blur-3xl"
              style={{
                background: `radial-gradient(circle at 50% 60%, ${npsScore >= 50 ? "#10b981" : npsScore >= 0 ? "#f59e0b" : "#e11d48"}, transparent 70%)`,
              }}
            />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 relative z-10">Индекс NPS</p>
            <p
              className={`text-6xl font-black tabular-nums font-mono relative z-10 ${npsScore >= 50 ? "text-emerald-600 dark:text-emerald-400" : npsScore >= 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {loading ? "—" : npsScore}
            </p>
            <p className="text-sm font-medium text-muted-foreground mt-1 relative z-10">{loading ? "" : npsLabel}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-2 relative z-10">{total} отзывов</p>
          </div>

          {/* Promoters */}
          <div className="rounded-2xl border border-emerald-500/20 bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Промоутеры (9-10)</p>
            </div>
            <p className="text-3xl font-black tabular-nums font-mono text-emerald-600 dark:text-emerald-400">{loading ? "—" : `${promoterPct}%`}</p>
            <p className="text-[11px] text-muted-foreground">{promoters} из {total} ответов</p>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${promoterPct}%` }} />
            </div>
          </div>

          {/* Passives */}
          <div className="rounded-2xl border border-amber-500/15 bg-[#0a0a0a] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Нейтральные (7-8)</p>
            </div>
            <p className="text-3xl font-black tabular-nums font-mono text-amber-400">{loading ? "—" : `${passivePct}%`}</p>
            <p className="text-[11px] text-muted-foreground">{passives} из {total} ответов</p>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${passivePct}%` }} />
            </div>
          </div>

          {/* Detractors */}
          <div className="rounded-2xl border border-rose-500/15 bg-[#0a0a0a] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Критики (1-6)</p>
            </div>
            <p className="text-3xl font-black tabular-nums font-mono text-rose-400">{loading ? "—" : `${detractorPct}%`}</p>
            <p className="text-[11px] text-muted-foreground">{detractors} из {total} ответов</p>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${detractorPct}%` }} />
            </div>
          </div>
        </div>

        {/* ── Automation Banner ── */}
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.03] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Bot size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">🤖 Автоматический сбор отзывов включен</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Пациенты получают сообщение в WhatsApp через 1 час после перехода в статус «Визит совершен».
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 shrink-0">
            <Settings2 size={13} />
            Настроить шаблон сообщения
          </Button>
        </div>

        {/* ── Feedback Feed ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Лента отзывов</h2>
              <span className="text-[10px] text-muted-foreground/50 font-mono">{total}</span>
            </div>
          </div>

          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/20 bg-[#0a0a0a] p-5 flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full max-w-md" />
                  </div>
                  <Skeleton className="h-8 w-28" />
                </div>
              ))
            ) : feedback.length === 0 ? (
              <div className="rounded-2xl border border-border/20 bg-[#0a0a0a] p-12 text-center">
                <MessageCircle size={32} className="text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Отзывов пока нет</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Они появятся автоматически после визита пациента</p>
              </div>
            ) : (
              feedback.map((item) => {
                const cat = scoreCategory(item.score);
                const isDetractor = item.score <= 6;
                const needsAction = isDetractor && !item.is_resolved;

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border bg-[#0a0a0a] p-5 flex items-start gap-4 transition-colors ${
                      needsAction ? "border-rose-500/25" : "border-border/20"
                    }`}
                  >
                    {/* Score badge */}
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg tabular-nums font-mono relative ${cat.bg} ${cat.border} border`}
                    >
                      {/* Glow for detractors */}
                      {isDetractor && !item.is_resolved && (
                        <div className="absolute inset-0 rounded-xl animate-pulse bg-rose-500/10" />
                      )}
                      <span className={cat.text} style={{ position: "relative", zIndex: 1 }}>{item.score}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{item.lead_name}</span>
                        <Badge variant="outline" className={`text-[9px] ${cat.bg} ${cat.text} ${cat.border} border`}>
                          {cat.label}
                        </Badge>
                      </div>
                      {item.feedback_text ? (
                        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">«{item.feedback_text}»</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/40 italic">Без комментария</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Clock size={10} className="text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/50">{timeAgo(item.created_at)}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      {needsAction ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 gap-1.5 h-9"
                          onClick={() => handleResolve(item.id)}
                        >
                          <AlertTriangle size={13} />
                          🚨 Требует связи
                        </Button>
                      ) : item.is_resolved ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground/40 text-xs">
                          <CheckCircle2 size={13} />
                          Обработано
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground/30 text-xs">
                          <CheckCircle2 size={13} />
                          Ок
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
