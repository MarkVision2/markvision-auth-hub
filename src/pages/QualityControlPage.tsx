import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  MessageCircle, Bot, Settings2, CheckCircle2, AlertTriangle,
  Clock, Send, FileText,
} from "lucide-react";

import { useWorkspace } from "@/hooks/useWorkspace";

/* ── Types ── */
interface NpsFeedback {
  id: string;
  lead_id: string | null;
  score: number;
  feedback_text: string;
  is_resolved: boolean;
  created_at: string;
  lead_name?: string;
}

/* ── Helpers ── */
function scoreCategory(score: number) {
  if (score >= 9) return { label: "Промоутер", color: "emerald" as const };
  if (score >= 7) return { label: "Нейтральный", color: "amber" as const };
  return { label: "Критик", color: "rose" as const };
}

const colorMap = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} дн назад`;
}

/* ── KPI Card ── */
function KpiCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: keyof typeof colorMap;
}) {
  const c = colorMap[color];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-9 w-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
          <div className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-mono font-semibold tabular-nums tracking-tight ${c.text}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
      <div className="h-1 rounded-full bg-secondary overflow-hidden mt-3">
        <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: value }} />
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function QualityControlPage() {
  const { active, isAgency } = useWorkspace();
  const [feedback, setFeedback] = useState<NpsFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateMsg, setTemplateMsg] = useState(
    "Здравствуйте, {name}! Спасибо, что посетили нашу клинику. Пожалуйста, оцените качество обслуживания от 1 до 10, ответив на это сообщение."
  );
  const [delayMinutes, setDelayMinutes] = useState(60);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const fetchFeedback = useCallback(async () => {
    if (!active) {
      setLoading(false);
      return;
    }
    const currentActiveId = active.id;
    setLoading(true);
    try {
      let query = (supabase as any)
        .from("nps_feedback")
        .select("*");

      if (!isAgency) {
        query = query.eq("project_id", currentActiveId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch lead names separately
      const leadIds = [...new Set((data || []).map((r: any) => r.lead_id).filter(Boolean))];
      let leadNames: Record<string, string> = {};
      if (leadIds.length > 0) {
        const { data: leadsData } = await (supabase as any)
          .from("leads_crm")
          .select("id, name")
          .in("id", leadIds);
        if (leadsData) {
          leadNames = Object.fromEntries(leadsData.map((l: any) => [l.id, l.name]));
        }
      }

      setFeedback((data || []).map((row: any) => ({
        id: row.id,
        lead_id: row.lead_id,
        score: row.score ?? 0,
        feedback_text: row.feedback_text || "",
        is_resolved: row.is_resolved ?? false,
        created_at: row.created_at,
        lead_name: leadNames[row.lead_id] || "Пациент",
      })));
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [active?.id, isAgency]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  // Realtime
  useEffect(() => {
    if (!active) return;
    const currentActiveId = active.id;

    const ch = supabase
      .channel("nps_feedback_realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "nps_feedback",
        ...(!isAgency ? { filter: `project_id=eq.${currentActiveId}` } : {})
      }, (payload: any) => {
        const row = payload.new;
        setFeedback(prev => [{
          id: row.id, lead_id: row.lead_id, score: row.score ?? 0,
          feedback_text: row.feedback_text || "", is_resolved: row.is_resolved ?? false,
          created_at: row.created_at, lead_name: "Пациент",
        }, ...prev]);
        toast({ title: "📩 Новый отзыв!", description: `Оценка: ${row.score}/10` });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "nps_feedback" }, (payload: any) => {
        const row = payload.new;
        setFeedback(prev => prev.map(f => f.id === row.id ? { ...f, is_resolved: row.is_resolved } : f));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.id, isAgency]);

  const handleResolve = async (id: string) => {
    const { error } = await (supabase as any).from("nps_feedback").update({ is_resolved: true }).eq("id", id);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, is_resolved: true } : f));
      toast({ title: "✅ Отмечено как обработано" });
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    // Simulated save — in real scenario, save to a templates table or project settings
    await new Promise(r => setTimeout(r, 600));
    setSavingTemplate(false);
    setTemplateOpen(false);
    toast({ title: "✅ Шаблон сохранён", description: `Задержка: ${delayMinutes} мин` });
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
  const npsColor = npsScore >= 50 ? "emerald" : npsScore >= 0 ? "amber" : "rose";

  return (
    <DashboardLayout breadcrumb="Контроль качества">
      <div className="space-y-6">
        {/* ── KPI Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* NPS Score */}
          <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Индекс NPS</span>
            </div>
            <p className={`text-2xl font-mono font-semibold tabular-nums tracking-tight ${colorMap[npsColor].text}`}>
              {loading ? "—" : npsScore}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{total} отзывов</p>
          </div>

          <KpiCard
            label="Промоутеры (9-10)"
            value={loading ? "—" : `${promoterPct}%`}
            sub={`${promoters} из ${total}`}
            color="emerald"
          />
          <KpiCard
            label="Нейтральные (7-8)"
            value={loading ? "—" : `${passivePct}%`}
            sub={`${passives} из ${total}`}
            color="amber"
          />
          <KpiCard
            label="Критики (1-6)"
            value={loading ? "—" : `${detractorPct}%`}
            sub={`${detractors} из ${total}`}
            color="rose"
          />
        </div>

        {/* ── Automation Banner ── */}
        <div className="rounded-2xl border border-border bg-card px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
              <Bot size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Автоматический сбор отзывов</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                WhatsApp-сообщение через {delayMinutes} мин после статуса «Визит совершен»
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 shrink-0"
            onClick={() => setTemplateOpen(true)}
          >
            <Settings2 size={13} />
            Настроить
          </Button>
        </div>

        {/* ── Feedback Feed ── */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Лента отзывов</h2>
              {total > 0 && (
                <Badge variant="secondary" className="text-[10px] font-mono">{total}</Badge>
              )}
            </div>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full max-w-sm" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))
            ) : feedback.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <MessageCircle size={28} className="text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Отзывов пока нет</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Они появятся автоматически после визита пациента</p>
              </div>
            ) : (
              feedback.map((item) => {
                const cat = scoreCategory(item.score);
                const c = colorMap[cat.color];
                const needsAction = item.score <= 6 && !item.is_resolved;

                return (
                  <div key={item.id} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                    {/* Score */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm tabular-nums font-mono ${c.bg} ${c.border} border ${c.text}`}>
                      {item.score}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">{item.lead_name}</span>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${c.bg} ${c.text} ${c.border} border`}>
                          {cat.label}
                        </Badge>
                      </div>
                      {item.feedback_text ? (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">«{item.feedback_text}»</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/40 italic">Без комментария</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock size={10} className="text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/50">{timeAgo(item.created_at)}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="shrink-0 pt-0.5">
                      {needsAction ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-1.5 h-8"
                          onClick={() => handleResolve(item.id)}
                        >
                          <AlertTriangle size={12} />
                          Требует связи
                        </Button>
                      ) : item.is_resolved ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground/40 text-xs">
                          <CheckCircle2 size={13} />
                          Обработано
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-500/50 text-xs">
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

      {/* ── Template Settings Sheet ── */}
      <Sheet open={templateOpen} onOpenChange={setTemplateOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Шаблон сообщения NPS</SheetTitle>
            <SheetDescription>
              Настройте текст WhatsApp-сообщения для сбора отзывов после визита.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Задержка отправки (минуты)</Label>
              <Input
                type="number"
                min={5}
                max={1440}
                value={delayMinutes}
                onChange={e => setDelayMinutes(Number(e.target.value))}
              />
              <p className="text-[11px] text-muted-foreground">Через сколько минут после статуса «Визит совершен» отправить сообщение</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Текст сообщения</Label>
              <Textarea
                rows={6}
                value={templateMsg}
                onChange={e => setTemplateMsg(e.target.value)}
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Используйте <code className="text-primary">{"{name}"}</code> для имени пациента
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Предпросмотр</p>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                <p className="text-sm text-foreground">{templateMsg.replace("{name}", "Айгуль")}</p>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={handleSaveTemplate} disabled={savingTemplate}>
              {savingTemplate ? (
                <>Сохранение...</>
              ) : (
                <><Send size={14} /> Сохранить шаблон</>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
