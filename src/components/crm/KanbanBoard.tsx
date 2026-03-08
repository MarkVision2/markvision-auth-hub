import { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2, Zap, Bell, MessageCircle, CreditCard, Calendar,
  MapPin, Check, Ban, Phone, DollarSign, Globe,
  ChevronDown, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import LeadDetailSheet from "./LeadDetailSheet";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  status: string | null;
  amount: number | null;
  source: string | null;
  utm_campaign: string | null;
  ai_score: number | null;
  ai_summary: string | null;
  created_at: string | null;
}

const STAGES = [
  { key: "Новая заявка", label: "Новая", icon: Zap, gradient: "from-primary/20 to-primary/5", accent: "primary", dotClass: "bg-primary" },
  { key: "Без ответа", label: "Без ответа", icon: Bell, gradient: "from-[hsl(var(--status-warning)/0.2)] to-[hsl(var(--status-warning)/0.05)]", accent: "warning", dotClass: "bg-[hsl(var(--status-warning))]" },
  { key: "В работе", label: "В работе", icon: MessageCircle, gradient: "from-[hsl(var(--status-ai)/0.2)] to-[hsl(var(--status-ai)/0.05)]", accent: "ai", dotClass: "bg-[hsl(var(--status-ai))]" },
  { key: "Счет выставлен", label: "Счёт", icon: CreditCard, gradient: "from-[hsl(var(--status-warning)/0.2)] to-[hsl(var(--status-warning)/0.05)]", accent: "warning", dotClass: "bg-[hsl(var(--status-warning))]" },
  { key: "Записан", label: "Записан", icon: Calendar, gradient: "from-primary/20 to-primary/5", accent: "primary", dotClass: "bg-primary" },
  { key: "Визит совершен", label: "Визит", icon: MapPin, gradient: "from-[hsl(var(--status-good)/0.2)] to-[hsl(var(--status-good)/0.05)]", accent: "good", dotClass: "bg-[hsl(var(--status-good))]" },
  { key: "Оплачен", label: "Оплачен", icon: Check, gradient: "from-[hsl(var(--status-good)/0.2)] to-[hsl(var(--status-good)/0.05)]", accent: "good", dotClass: "bg-[hsl(var(--status-good))]" },
  { key: "Отказ", label: "Отказ", icon: Ban, gradient: "from-[hsl(var(--status-critical)/0.2)] to-[hsl(var(--status-critical)/0.05)]", accent: "critical", dotClass: "bg-[hsl(var(--status-critical))]" },
];

const accentTextMap: Record<string, string> = {
  primary: "text-primary",
  warning: "text-[hsl(var(--status-warning))]",
  ai: "text-[hsl(var(--status-ai))]",
  good: "text-[hsl(var(--status-good))]",
  critical: "text-[hsl(var(--status-critical))]",
};

const accentBgMap: Record<string, string> = {
  primary: "bg-primary/10",
  warning: "bg-[hsl(var(--status-warning)/0.1)]",
  ai: "bg-[hsl(var(--status-ai)/0.1)]",
  good: "bg-[hsl(var(--status-good)/0.1)]",
  critical: "bg-[hsl(var(--status-critical)/0.1)]",
};

function getScoreBadge(score: number) {
  if (score >= 80) return { emoji: "🔥", label: "Горячий", color: "text-[hsl(var(--status-critical))]", bg: "bg-[hsl(var(--status-critical)/0.12)]" };
  if (score >= 50) return { emoji: "🌤", label: "Тёплый", color: "text-[hsl(var(--status-warning))]", bg: "bg-[hsl(var(--status-warning)/0.12)]" };
  return { emoji: "❄️", label: "Холодный", color: "text-primary", bg: "bg-primary/12" };
}

function fmt(n: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function timeAgo(d: string | null) {
  if (!d) return "";
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}м`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}ч`;
  return `${Math.floor(h / 24)}д`;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setLeads((data as Lead[]) ?? []);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    const ch = supabase
      .channel("kanban_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchLeads]);

  // Маппинг CRM-этапов на ключи CAPI (n8n CAPI-Status-Trigger)
  const CAPI_STATUS_MAP: Record<string, string> = {
    "Записан": "scheduled",
    "Визит совершен": "diagnostic",
    "Оплачен": "paid",
  };

  const fireCAPIWebhook = async (lead: Lead, oldStatus: string, newStatus: string) => {
    const capiKey = CAPI_STATUS_MAP[newStatus];
    if (!capiKey) return; // этап не требует CAPI-события

    try {
      const res = await fetch("https://n8n.zapoinov.com/webhook/lead-status-changed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "leads",
          type: "UPDATE",
          record: {
            id: lead.id,
            status: capiKey,
            project_id: (lead as any).project_id || null,
            deal_amount: lead.amount || 0,
          },
          old_record: { status: oldStatus },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && !data.skipped) {
          toast({
            title: "📡 CAPI событие отправлено",
            description: `${data.event_name || capiKey} → Facebook Pixel`,
          });
        }
      }
    } catch (err) {
      // Не блокируем основной флоу — CAPI отправляется фоново
      console.error("CAPI webhook error:", err);
    }
  };

  const handleMoveStage = async (leadId: string, newStatus: string) => {
    const lead = leads.find(l => l.id === leadId);
    const oldStatus = lead?.status || "Новая заявка";
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    const { error } = await (supabase as any)
      .from("leads").update({ status: newStatus }).eq("id", leadId);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      fetchLeads();
      return;
    }
    // Фоново отправляем CAPI-событие в n8n
    if (lead) fireCAPIWebhook(lead, oldStatus, newStatus);
  };

  const onDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStage = destination.droppableId;
    const lead = leads.find(l => l.id === draggableId);
    if (!lead || (lead.status || "Новая заявка") === newStage) return;
    handleMoveStage(draggableId, newStage);
    toast({ title: "Перемещено", description: `${lead.name} → ${newStage}` });
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const toggleCollapse = (key: string) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const totalAmount = useMemo(() => leads.reduce((s, l) => s + (Number(l.amount) || 0), 0), [leads]);
  const avgScore = useMemo(() => {
    const scored = leads.filter(l => (l.ai_score ?? 0) > 0);
    return scored.length ? Math.round(scored.reduce((s, l) => s + (l.ai_score ?? 0), 0) / scored.length) : 0;
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Воронка</p>
            <p className="text-sm font-bold text-foreground">{leads.length} <span className="text-muted-foreground font-normal text-xs">лидов</span></p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Сумма сделок</p>
          <p className="text-sm font-bold text-foreground tabular-nums">{fmt(totalAmount)} ₸</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Средний скор</p>
          <p className="text-sm font-bold text-foreground tabular-nums">{avgScore}%</p>
        </div>
        <div className="flex-1" />
        <div className="hidden lg:flex items-center gap-1">
          {STAGES.map(s => {
            const count = leads.filter(l => (l.status || "Новая заявка") === s.key).length;
            const pct = leads.length ? (count / leads.length) * 100 : 0;
            return (
              <Tooltip key={s.key}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={`w-6 rounded-sm ${s.dotClass}`} style={{ height: Math.max(4, pct * 0.4) }} />
                    <span className="text-[8px] text-muted-foreground tabular-nums">{count}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">{s.key}: {count}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Kanban with DnD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter(l => (l.status || "Новая заявка") === stage.key);
            const stageAmount = stageLeads.reduce((s, l) => s + (Number(l.amount) || 0), 0);
            const collapsed = collapsedCols.has(stage.key);
            const Icon = stage.icon;

            return (
              <div key={stage.key} className={`shrink-0 flex flex-col transition-all duration-300 ${collapsed ? "min-w-[48px] w-[48px]" : "min-w-[290px] w-[290px]"}`}>
                {/* Column header */}
                <div
                  className={`rounded-xl p-3 mb-2 bg-gradient-to-b ${stage.gradient} border border-border/50 cursor-pointer select-none`}
                  onClick={() => collapsed && toggleCollapse(stage.key)}
                >
                  {collapsed ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Icon className={`h-4 w-4 ${accentTextMap[stage.accent]}`} />
                      <span className={`text-[10px] font-bold ${accentTextMap[stage.accent]} [writing-mode:vertical-lr]`}>
                        {stage.label}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-border">
                        {stageLeads.length}
                      </Badge>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-lg ${accentBgMap[stage.accent]} flex items-center justify-center`}>
                            <Icon className={`h-3.5 w-3.5 ${accentTextMap[stage.accent]}`} />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border bg-background/50">
                            {stageLeads.length}
                          </Badge>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCollapse(stage.key); }}
                          className="h-6 w-6 rounded-md hover:bg-secondary/80 flex items-center justify-center text-muted-foreground"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {stageAmount > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">
                          <DollarSign className="inline h-3 w-3 -mt-0.5" /> {fmt(stageAmount)} ₸
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Droppable column */}
                {!collapsed && (
                  <Droppable droppableId={stage.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-[80px] max-h-[calc(100vh-16rem)] overflow-y-auto space-y-2 p-1 rounded-xl transition-colors duration-200 ${
                          snapshot.isDraggingOver
                            ? `${accentBgMap[stage.accent]} border-2 border-dashed ${stage.accent === "primary" ? "border-primary/40" : stage.accent === "warning" ? "border-[hsl(var(--status-warning)/0.4)]" : stage.accent === "good" ? "border-[hsl(var(--status-good)/0.4)]" : stage.accent === "critical" ? "border-[hsl(var(--status-critical)/0.4)]" : "border-[hsl(var(--status-ai)/0.4)]"}`
                            : ""
                        }`}
                      >
                        {stageLeads.map((lead, index) => {
                          const score = lead.ai_score ?? 0;
                          const badge = getScoreBadge(score);
                          const amount = Number(lead.amount) || 0;
                          const currentIdx = STAGES.findIndex(s => s.key === stage.key);

                          return (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={`group bg-card border rounded-xl p-3 cursor-grab active:cursor-grabbing ${
                                    dragSnapshot.isDragging
                                      ? "border-primary shadow-lg shadow-primary/10 rotate-[1.5deg] scale-[1.02] z-50"
                                      : "border-border hover:border-primary/30 hover:shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.15)] hover:-translate-y-0.5 transition-all duration-200"
                                  }`}
                                >
                                  {/* Top row */}
                                  <div className="flex items-start gap-2.5">
                                    <Avatar className="h-8 w-8 shrink-0">
                                      <AvatarFallback className={`${accentBgMap[stage.accent]} ${accentTextMap[stage.accent]} text-[10px] font-bold`}>
                                        {getInitials(lead.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0" onClick={() => handleCardClick(lead)}>
                                      <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {lead.phone && (
                                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                            <Phone className="h-2.5 w-2.5" />{lead.phone}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(lead.created_at)}</span>
                                  </div>

                                  {/* Tags row */}
                                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap pl-6" onClick={() => handleCardClick(lead)}>
                                    {lead.source && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                                        <Globe className="h-2.5 w-2.5" /> {lead.source}
                                      </span>
                                    )}
                                    {lead.utm_campaign && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground truncate max-w-[120px]">
                                        {lead.utm_campaign}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bottom row */}
                                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50 pl-6" onClick={() => handleCardClick(lead)}>
                                    <span className={`text-sm font-bold tabular-nums ${amount > 0 ? accentTextMap[stage.accent] : "text-muted-foreground"}`}>
                                      {amount > 0 ? `${fmt(amount)} ₸` : "—"}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {score > 0 && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${badge.bg} ${badge.color}`}>
                                              {badge.emoji} {score}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent side="top" className="text-xs">{badge.label} лид — {score}%</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quick move — shows on hover */}
                                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 pl-6">
                                    {currentIdx > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground flex-1"
                                        onClick={(e) => { e.stopPropagation(); handleMoveStage(lead.id, STAGES[currentIdx - 1].key); }}
                                      >
                                        ← {STAGES[currentIdx - 1].label}
                                      </Button>
                                    )}
                                    {currentIdx < STAGES.length - 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 text-[10px] px-2 flex-1 ${accentTextMap[STAGES[currentIdx + 1].accent]}`}
                                        onClick={(e) => { e.stopPropagation(); handleMoveStage(lead.id, STAGES[currentIdx + 1].key); }}
                                      >
                                        {STAGES[currentIdx + 1].label} →
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="border border-dashed border-border/60 rounded-xl h-32 flex flex-col items-center justify-center gap-2 glass">
                            <Icon className={`h-5 w-5 ${accentTextMap[stage.accent]} opacity-30`} />
                            <span className="text-[11px] text-muted-foreground/60">Данных пока нет</span>
                            <span className="text-[9px] text-muted-foreground/30">Перетащите карточку сюда</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onLeadUpdated={() => fetchLeads()}
      />
    </TooltipProvider>
  );
}
