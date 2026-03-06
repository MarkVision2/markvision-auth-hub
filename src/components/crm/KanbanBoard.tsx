import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import LeadDetailSheet from "./LeadDetailSheet";

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
  "Новая заявка",
  "Без ответа",
  "В работе",
  "Счет выставлен",
  "Записан",
  "Визит совершен",
  "Оплачен",
  "Отказ",
];

function getScoreBadge(score: number) {
  if (score >= 80) return { label: `🔥 ${score}`, className: "bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.2)]" };
  if (score >= 50) return { label: `🌤 ${score}`, className: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]" };
  return { label: `❄️ ${score}`, className: "bg-primary/15 text-primary border-primary/20" };
}

function fmt(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

export default function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("leads_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchLeads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const handleMoveStage = async (leadId: string, newStatus: string) => {
    const { error } = await (supabase as any)
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const handleCardClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  // When lead is updated via sheet, refresh selected lead
  const handleLeadUpdated = () => {
    fetchLeads();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => (l.status || "Новая заявка") === stage);
          return (
            <div key={stage} className="min-w-[280px] w-[280px] shrink-0 flex flex-col">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-sm font-medium text-foreground">{stage}</span>
                <span className="text-xs text-muted-foreground">• {stageLeads.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2 flex-1">
                {stageLeads.map((lead) => {
                  const score = lead.ai_score ?? 0;
                  const badge = getScoreBadge(score);
                  const amount = Number(lead.amount) || 0;

                  return (
                    <div
                      key={lead.id}
                      className="bg-card border border-border rounded-lg p-3.5 cursor-pointer transition-all hover:border-accent group"
                    >
                      {/* Clickable top */}
                      <div onClick={() => handleCardClick(lead)}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{lead.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{lead.phone || "—"}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm font-semibold text-primary tabular-nums">
                            {amount > 0 ? `${fmt(amount)} ₸` : "—"}
                          </span>
                          {score > 0 && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${badge.className}`}>
                              {badge.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Move dropdown */}
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Select
                          value={lead.status || "Новая заявка"}
                          onValueChange={(v) => handleMoveStage(lead.id, v)}
                        >
                          <SelectTrigger className="h-7 text-[11px] bg-secondary/50 border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}

                {stageLeads.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg h-24 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Пусто</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onLeadUpdated={handleLeadUpdated}
      />
    </>
  );
}
