import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronRight, Handshake, MessageSquare, Phone, UserCheck, DollarSign, TrendingUp, Eye, ShoppingCart, Users } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Send, Clock } from "lucide-react";

const STAGES = [
  "Новая заявка", "Без ответа", "В работе", "Счет выставлен",
  "Записан", "Визит совершен", "Оплачен", "Отказ",
];

const stageIcons = [MessageSquare, Phone, UserCheck, DollarSign, Users, Eye, TrendingUp, ShoppingCart];
const stageColors = [
  "text-primary",
  "text-[hsl(var(--status-warning))]",
  "text-[hsl(var(--status-ai))]",
  "text-[hsl(var(--status-warning))]",
  "text-primary",
  "text-[hsl(var(--status-ai))]",
  "text-[hsl(var(--status-good))]",
  "text-[hsl(var(--status-critical))]",
];

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  status: string | null;
  source: string | null;
  created_at: string | null;
  amount: number | null;
  ai_score: number | null;
  client_config_id: string | null;
}

export default function DashboardSales() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    const channel = supabase
      .channel("sales_leads_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const kpis = useMemo(() => {
    const total = leads.length;
    const paid = leads.filter((l) => l.status === "Оплачен").length;
    const visits = leads.filter((l) => l.status === "Визит совершен").length;
    const conversion = total > 0 ? Math.round((paid / total) * 100) : 0;
    return [
      { label: "Конверсия", value: `${conversion}%`, sub: "лид → оплата", color: "text-[hsl(var(--status-good))]" },
      { label: "Визиты", value: String(visits), sub: "Визит совершен", color: "text-[hsl(var(--status-ai))]" },
      { label: "Всего лидов", value: String(total), sub: "в системе", color: "text-foreground" },
      { label: "Оплачено", value: String(paid), sub: "продажи", color: "text-[hsl(var(--status-good))]" },
    ];
  }, [leads]);

  const funnelCounts = useMemo(() => {
    return STAGES.map((stage) => leads.filter((l) => (l.status || "Новая заявка") === stage).length);
  }, [leads]);

  if (loading) {
    return (
      <DashboardLayout breadcrumb="Отдел продаж">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumb="Отдел продаж">
      <StaggerContainer className="space-y-5">
        <FadeUpItem>
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Handshake className="h-5 w-5 text-[hsl(var(--status-good))]" />
            Отдел продаж
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Воронка · Лиды · Конверсии — данные из CRM
          </p>
        </FadeUpItem>

        <FadeUpItem className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-[0.08em] font-medium">{kpi.label}</p>
                <p className={`text-2xl font-bold tracking-tight mt-1 ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </FadeUpItem>

        <FadeUpItem>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Воронка продаж · {STAGES.length} этапов
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="flex items-center gap-1 overflow-x-auto">
                {STAGES.map((stage, i) => {
                  const Icon = stageIcons[i];
                  return (
                    <div key={stage} className="flex items-center gap-1 flex-1 min-w-0">
                      <div className="flex-1 rounded-md border border-border bg-secondary/30 p-3 text-center min-w-[80px]">
                        <Icon className={`h-4 w-4 mx-auto mb-1.5 ${stageColors[i]}`} />
                        <p className="text-xs text-muted-foreground truncate">{stage}</p>
                        <p className={`text-lg font-bold mt-0.5 ${stageColors[i]}`}>{funnelCounts[i]}</p>
                      </div>
                      {i < STAGES.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </FadeUpItem>

        <FadeUpItem>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Последние лиды
                </CardTitle>
                <Badge variant="outline" className="ml-auto text-xs font-mono border-border text-muted-foreground">
                  {leads.length} всего
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Имя", "Источник", "Статус", "Время"].map((h) => (
                      <th key={h} className="text-xs text-muted-foreground font-medium uppercase tracking-[0.08em] px-5 py-2 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 20).map((lead) => (
                    <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                      <td className="px-5 py-2.5">
                        <p className="font-medium text-foreground/90">{lead.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{lead.phone || "—"}</p>
                      </td>
                      <td className="px-5 py-2.5 text-muted-foreground">{lead.source || "—"}</td>
                      <td className="px-5 py-2.5">
                        <Badge variant="outline" className="text-xs font-mono border-border text-muted-foreground">
                          {lead.status || "Новая заявка"}
                        </Badge>
                      </td>
                      <td className="px-5 py-2.5 font-mono tabular-nums text-muted-foreground text-xs">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </FadeUpItem>
      </StaggerContainer>

      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="sm:max-w-md bg-card border-border overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-base font-semibold">{selectedLead.name}</SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  {selectedLead.source || "—"} · {selectedLead.status || "Новая заявка"}
                </SheetDescription>
              </SheetHeader>
              <Separator className="bg-border" />
              <div className="py-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Контакт</h3>
                {[
                  { icon: Phone, label: "Телефон", value: selectedLead.phone || "—" },
                  { icon: MessageSquare, label: "Источник", value: selectedLead.source || "—" },
                  { icon: Clock, label: "Создан", value: selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString("ru-RU") : "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-sm font-mono text-foreground/80">{item.value}</span>
                  </div>
                ))}
              </div>
              <Separator className="bg-border" />
              <div className="py-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">Действия</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-sm border-border"><Phone className="h-3.5 w-3.5 mr-1.5" />Позвонить</Button>
                  <Button variant="outline" size="sm" className="text-sm border-border"><Send className="h-3.5 w-3.5 mr-1.5" />WhatsApp</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
