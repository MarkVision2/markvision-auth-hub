import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, CreditCard, Calendar, MapPin, Check, Ban, Phone, DollarSign, Globe, ChevronDown, TrendingUp, Trash2, Pencil, Layout, Stethoscope, Search, Filter } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import LeadDetailSheet from "./LeadDetailSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import { loadStages, saveStageLabel, type CrmStage, PIPELINES } from "./crm-config";
import { Loader2 } from "lucide-react";
import { AppointmentModal } from "./schedule/AppointmentModal";

// Stage-specific task descriptions
const STAGE_TASKS: Record<string, { task: string; emoji: string }> = {
  "Без ответа": { task: "Связаться позже", emoji: "📞" },
  "Счет отправлен": { task: "Уточнить / напомнить про оплату", emoji: "💳" },
  "Диагностика": { task: "Напомнить о записи", emoji: "📅" },
};

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
  scheduled_at?: string | null;
  doctor_name?: string | null;
  office_name?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  project_id?: string | null;
  pipeline?: string | null;
  is_diagnostic?: boolean | null;
  prescribed_packages?: string[] | null;
  serviced_by?: string | null;
}

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

interface LeadCardProps {
  lead: Lead;
  stage: CrmStage;
  currentIdx: number;
  stages: CrmStage[];
  isSuperadmin: boolean;
  onCardClick: (lead: Lead) => void;
  onMove: (leadId: string, status: string) => void;
  onDelete: (leadId: string, leadName: string) => void;
}

const LeadCard = memo(function LeadCard({ lead, stage, currentIdx, stages, isSuperadmin, onCardClick, onMove, onDelete }: LeadCardProps) {
  const score = lead.ai_score ?? 0;
  const badge = getScoreBadge(score);
  const amount = Number(lead.amount) || 0;

  return (
    <div
      className="group bg-card border rounded-2xl p-3.5 cursor-grab active:cursor-grabbing border-border/60 hover:border-primary/40 hover:bg-card/90 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden"
      onClick={() => onCardClick(lead)}
    >
      <div className={`absolute top-0 right-0 w-16 h-16 ${accentBgMap[stage.accent]} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      {/* Row 1: Avatar + Name + Time */}
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 rounded-full ${accentBgMap[stage.accent]} flex items-center justify-center shrink-0`}>
          <span className={`text-[9px] font-bold ${accentTextMap[stage.accent]}`}>
            {getInitials(lead.name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate leading-tight">{lead.name}</p>
          {lead.phone && (
            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5 mt-0.5 leading-none">
              <Phone className="h-2.5 w-2.5 shrink-0" />{lead.phone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] text-muted-foreground/50 font-medium">{timeAgo(lead.created_at)}</span>
          {isSuperadmin && (
            <button
              className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => { e.stopPropagation(); onDelete(lead.id, lead.name); }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Tags + Amount + Score */}
      <div className="flex items-center gap-1.5 mt-1.5 pl-9">
        {lead.source && (
          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-[1px] rounded bg-secondary/80 text-muted-foreground/70 max-w-[80px] truncate">
            <Globe className="h-2 w-2 shrink-0" /> {(lead.source || "").replace(/^Popup АҚ СИСА\s*\|\s*/, '')}
          </span>
        )}
        {lead.utm_campaign && (
          <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground uppercase truncate max-w-[80px]">
            {lead.utm_campaign}
          </span>
        )}
        <div className="flex-1" />
        {amount > 0 && (
          <span className={`text-[11px] font-bold tabular-nums ${accentTextMap[stage.accent]}`}>
            {fmt(amount)} ₸
          </span>
        )}
        {score > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`text-[9px] font-bold px-1 py-[1px] rounded ${badge.bg} ${badge.color}`}>
                {badge.emoji}{score}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">{badge.label} — {score}%</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
});

interface KanbanBoardProps {
  onLeadCreated?: () => void;
}

export default function KanbanBoard({ onLeadCreated }: KanbanBoardProps) {
  const { isSuperadmin } = useRole();
  const { active } = useWorkspace();
  const [stages, setStages] = useState<CrmStage[]>(loadStages(active?.id || "default", "main"));
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
  const [activePipeline, setActivePipeline] = useState<string>("main");
  const [pendingScheduleLead, setPendingScheduleLead] = useState<Lead | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");

  useEffect(() => {
    if (!active) return;
    setStages(loadStages(active.id, activePipeline));
  }, [active?.id, activePipeline]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      if (!active) return;
      let query = (supabase as any).from("leads_crm").select("*");
      query = query.eq("project_id", active.id);

      const { data, error } = await query.order("created_at", { ascending: false });
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
    if (!active) return;
    const channelId = `kanban-rt-${active.id}`;
    const ch = supabase
      .channel(channelId)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "leads_crm",
        filter: `project_id=eq.${active.id}`
      }, (payload) => {
        console.log("Kanban Realtime payload:", payload);
        fetchLeads();
        if (onLeadCreated) onLeadCreated();
      })
      .subscribe();
      
    return () => { 
      supabase.removeChannel(ch); 
    };
  }, [active?.id, fetchLeads, onLeadCreated]);

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
          table: "leads_crm",
          type: "UPDATE",
          record: {
            id: lead.id,
            status: capiKey,
            project_id: lead.project_id || null,
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

    // If moving to "Диагностика" — open scheduling modal first
    if (newStatus === "Диагностика" && lead) {
      setPendingScheduleLead({ ...lead, status: newStatus });
      setShowScheduleModal(true);
      return;
    }

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    const { error } = await (supabase as any)
      .from("leads_crm").update({ status: newStatus }).eq("id", leadId);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      fetchLeads();
      return;
    }

    // Show stage-specific task toast
    const stageTask = STAGE_TASKS[newStatus];
    if (stageTask) {
      toast({
        title: `${stageTask.emoji} Задача: ${stageTask.task}`,
        description: `${lead?.name || "Лид"} → ${newStatus}`,
      });
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

    // Trigger AI agent for processing
    import("@/lib/ai-agent").then(({ triggerAiAgent }) => {
      triggerAiAgent(draggableId, newStage);
    }).catch(() => { });
  };

  const handleDeleteLead = useCallback(async (leadId: string, leadName: string) => {
    if (!confirm(`Удалить следку ${leadName}?`)) return;
    const { error } = await (supabase as any).from("leads_crm").delete().eq("id", leadId);
    if (error) {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Сделка удалена", description: leadName });
    fetchLeads();
  }, [fetchLeads]);

  const handleCardClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  }, []);

  const handleStartEdit = (e: React.MouseEvent, stage: CrmStage) => {
    e.stopPropagation();
    setEditingStage(stage.key);
    setEditValue(stage.label);
  };

  const handleSaveEdit = (e: React.FormEvent | React.MouseEvent, stageKey: string) => {
    e.stopPropagation();
    if (!active) return;
    saveStageLabel(active.id, stageKey, editValue.trim(), activePipeline);
    setStages(prev => prev.map(s => s.key === stageKey ? { ...s, label: editValue.trim() } : s));
    setEditingStage(null);
    toast({ title: "Сохранено", description: "Название этапа обновлено" });
  };

  const toggleCollapse = (key: string) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredSummarizedLeads = useMemo(() => {
    return leads.filter(l => {
      if ((l.pipeline || "main") !== activePipeline) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nMatch = (l.name || "").toLowerCase().includes(q);
        const pMatch = (l.phone || "").toLowerCase().includes(q);
        if (!nMatch && !pMatch) return false;
      }
      if (scoreFilter === "hot" && (l.ai_score || 0) < 80) return false;
      if (scoreFilter === "warm" && ((l.ai_score || 0) < 50 || (l.ai_score || 0) >= 80)) return false;
      if (scoreFilter === "cold" && (l.ai_score || 0) >= 50) return false;
      return true;
    });
  }, [leads, activePipeline, searchQuery, scoreFilter]);

  const totalAmount = useMemo(() => {
    return filteredSummarizedLeads.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  }, [filteredSummarizedLeads]);

  const avgScore = useMemo(() => {
    const scored = filteredSummarizedLeads.filter(l => (l.ai_score ?? 0) > 0);
    return scored.length ? Math.round(scored.reduce((s, l) => s + (l.ai_score ?? 0), 0) / scored.length) : 0;
  }, [filteredSummarizedLeads]);

  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const stage of stages) map[stage.key] = [];
    for (const lead of filteredSummarizedLeads) {
      const key = lead.status || (activePipeline === "main" ? "Новая заявка" : "Лечение начато");
      if (map[key]) {
        map[key].push(lead);
      } else if (stages.length > 0) {
        //fallback to first stage if status doesn't match
        map[stages[0].key].push(lead);
      }
    }
    return map;
  }, [leads, stages, activePipeline]);

  const amountByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const stage of stages) {
      map[stage.key] = (leadsByStatus[stage.key] || []).reduce((s, l) => s + (Number(l.amount) || 0), 0);
    }
    return map;
  }, [leadsByStatus, stages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full min-h-0">
        {/* Summary bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 px-1 shrink-0">
          <div className="flex-1 flex items-center gap-3">
             <div className="relative w-full max-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Поиск по имени или телефону..."
                  className="pl-9 h-11 bg-card/60 backdrop-blur-md border-border/60 rounded-2xl focus-visible:ring-primary focus-visible:ring-1 shadow-sm text-sm transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
             </div>
             
             <Select value={scoreFilter} onValueChange={setScoreFilter}>
               <SelectTrigger className="w-[140px] h-11 bg-card/60 backdrop-blur-md border-border/60 rounded-2xl shadow-sm text-sm">
                 <Filter className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                 <SelectValue placeholder="AI-Score" />
               </SelectTrigger>
               <SelectContent className="rounded-xl border-border/50">
                 <SelectItem value="all">Все лиды</SelectItem>
                 <SelectItem value="hot"><span className="flex items-center gap-2">🔥 Горячие &gt;80</span></SelectItem>
                 <SelectItem value="warm"><span className="flex items-center gap-2">🌤 Теплые 50-80</span></SelectItem>
                 <SelectItem value="cold"><span className="flex items-center gap-2">❄️ Холодные &lt;50</span></SelectItem>
               </SelectContent>
             </Select>
          </div>

          <div className="flex items-center gap-4">
            <Tabs value={activePipeline} onValueChange={setActivePipeline} className="w-auto">
              <TabsList className="bg-secondary/50 border border-border h-9 p-1 rounded-xl">
                <TabsTrigger 
                  value="main" 
                  className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all gap-2"
                >
                  <Layout className="h-3.5 w-3.5" />
                  Основная
                </TabsTrigger>
                <TabsTrigger 
                  value="doctor" 
                  className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all gap-2"
                >
                  <Stethoscope className="h-3.5 w-3.5" />
                  Воронка врача
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="hidden lg:flex items-center gap-1.5 ml-4 bg-card/60 backdrop-blur-md p-2 rounded-2xl border border-border/50 shadow-inner">
              {stages.map(s => {
                const count = (leadsByStatus[s.key] || []).length;
                const pct = leads.length ? (count / leads.length) * 100 : 0;
                return (
                  <Tooltip key={s.key}>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-0.5 px-0.5">
                        <div className={`w-3 rounded-full ${s.dotClass} opacity-80`} style={{ height: Math.max(4, pct * 0.4) }} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[10px] font-bold">{s.label}: {count}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>

      {/* Kanban with DnD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {stages.map((stage) => {
            const stageLeads = leadsByStatus[stage.key] || [];
            const stageAmount = amountByStatus[stage.key] || 0;
            const collapsed = collapsedCols.has(stage.key);
            const Icon = stage.icon;
            const isEditing = editingStage === stage.key;

            return (
              <div key={stage.key} className={`shrink-0 flex flex-col h-full bg-background/40 backdrop-blur-xl shadow-lg shadow-black/5 rounded-[32px] p-2.5 transition-all duration-300 border border-border/60 ${collapsed ? "min-w-[48px] w-[48px]" : "min-w-[280px] w-[280px]"}`}>
                {/* Column header */}
                <div
                  className={`group/header rounded-[24px] p-3.5 mb-3 bg-gradient-to-b ${stage.gradient} border border-border/50 cursor-pointer select-none shrink-0 shadow-sm relative overflow-hidden`}
                  onClick={() => collapsed && toggleCollapse(stage.key)}
                >
                  <div className={`absolute -right-4 -top-4 w-16 h-16 ${accentBgMap[stage.accent]} opacity-20 blur-2xl rounded-full`} />
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
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`h-6 w-6 rounded-lg ${accentBgMap[stage.accent]} flex items-center justify-center shrink-0`}>
                            <Icon className={`h-3.5 w-3.5 ${accentTextMap[stage.accent]}`} />
                          </div>
                          {isEditing ? (
                            <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                              <Input 
                                autoFocus
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleSaveEdit(e, stage.key)}
                                onBlur={e => handleSaveEdit(e, stage.key)}
                                className="h-6 text-xs px-2 rounded-md bg-background/80 border-primary/30"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <span className="text-sm font-semibold text-foreground truncate">{stage.label}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-border bg-background shrink-0">
                                {stageLeads.length}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 opacity-0 group-hover/header:opacity-100 transition-opacity"
                                onClick={(e) => handleStartEdit(e, stage)}
                              >
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCollapse(stage.key); }}
                          className="h-6 w-6 rounded-md hover:bg-secondary/80 flex items-center justify-center text-muted-foreground ml-1 shrink-0"
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
                        className={`flex-1 min-y-0 overflow-y-auto space-y-1.5 p-0.5 rounded-lg transition-colors duration-200 scrollbar-thin scrollbar-thumb-muted-foreground/20 ${snapshot.isDraggingOver
                          ? `${accentBgMap[stage.accent]} border-2 border-dashed ${stage.accent === "primary" ? "border-primary/40" : stage.accent === "warning" ? "border-[hsl(var(--status-warning)/0.4)]" : stage.accent === "good" ? "border-[hsl(var(--status-good)/0.4)]" : stage.accent === "critical" ? "border-[hsl(var(--status-critical)/0.4)]" : "border-[hsl(var(--status-ai)/0.4)]"}`
                          : ""
                          }`}
                      >
                        {stageLeads.map((lead, index) => {
                          const currentIdx = stages.findIndex(s => s.key === stage.key);
                          return (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  {...dragProvided.dragHandleProps}
                                  className={dragSnapshot.isDragging ? "border-primary shadow-lg shadow-primary/10 rotate-[1.5deg] scale-[1.02] z-50 rounded-xl" : ""}
                                >
                                  <LeadCard
                                    lead={lead}
                                    stage={stage}
                                    currentIdx={currentIdx}
                                    stages={stages}
                                    isSuperadmin={isSuperadmin}
                                    onCardClick={handleCardClick}
                                    onMove={handleMoveStage}
                                    onDelete={handleDeleteLead}
                                  />
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="border-2 border-dashed border-border/40 rounded-2xl h-36 flex flex-col items-center justify-center gap-3 bg-card/20 mx-1 mt-2">
                            <div className={`h-12 w-12 rounded-full ${accentBgMap[stage.accent]} flex items-center justify-center opacity-60`}>
                                <Icon className={`h-5 w-5 ${accentTextMap[stage.accent]}`} />
                            </div>
                            <div className="text-center">
                                <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Пусто</span>
                                <span className="block text-[9px] font-bold text-muted-foreground/40 leading-tight">Перетащите<br/>карточку сюда</span>
                            </div>
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
      </div>

      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onLeadUpdated={() => fetchLeads()}
      />

      {/* Scheduling Modal for "Диагностика" stage */}
      <AppointmentModal
        open={showScheduleModal}
        onOpenChange={(open) => {
          setShowScheduleModal(open);
          if (!open) setPendingScheduleLead(null);
        }}
        appointment={pendingScheduleLead ? {
          id: pendingScheduleLead.id,
          patient: pendingScheduleLead.name,
          phone: pendingScheduleLead.phone,
          status: "planned",
          lead: pendingScheduleLead,
        } : undefined}
        mode="admin"
        onSave={async (data: any) => {
          if (pendingScheduleLead) {
            const updatePayload: any = { status: "Диагностика" };
            if (data.date && data.time) {
              const [h, m] = data.time.split(":").map(Number);
              const scheduledAt = new Date(data.date);
              scheduledAt.setHours(h, m, 0, 0);
              updatePayload.scheduled_at = scheduledAt.toISOString();
            }
            if (data.doctor) {
              updatePayload.doctor_name = data.doctor;
            }

            setLeads(prev => prev.map(l => l.id === pendingScheduleLead.id ? { ...l, ...updatePayload } : l));
            const { error } = await (supabase as any)
              .from("leads_crm").update(updatePayload).eq("id", pendingScheduleLead.id);

            if (error) {
              toast({ title: "Ошибка", description: error.message, variant: "destructive" });
              fetchLeads();
            } else {
              toast({
                title: "📅 Задача: Напомнить о записи",
                description: `${pendingScheduleLead.name} записан на диагностику`,
              });
              fireCAPIWebhook(pendingScheduleLead, pendingScheduleLead.status || "Новая заявка", "Диагностика");
            }
          }
          setShowScheduleModal(false);
          setPendingScheduleLead(null);
        }}
      />
    </TooltipProvider>
  );
}
