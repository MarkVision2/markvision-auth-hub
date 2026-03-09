import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, RefreshCw, Clock, TrendingUp, Plus, Send,
  CalendarDays, FileText, Users, Tag, TicketPercent,
} from "lucide-react";

const PROJECT_ID = "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

/* ── Types ── */
interface RetentionTask {
  id: string;
  lead_id: string | null;
  template_id: string | null;
  trigger_date: string;
  promo_code: string | null;
  status: string;
  lead_name?: string;
  template_name?: string;
}

interface RetentionTemplate {
  id: string;
  name: string;
  message_prompt: string;
  sent_count: number;
  return_count: number;
  revenue_generated: number;
}

interface Lead {
  id: string;
  name: string;
}

/* ── Helpers ── */
function formatMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K ₸`;
  return `${n.toFixed(0)} ₸`;
}

function statusBadge(status: string) {
  switch (status) {
    case "sent":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]">Отправлено</Badge>;
    case "converted":
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">Вернулся</Badge>;
    default:
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">В ожидании</Badge>;
  }
}

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, loading }: {
  icon: React.ElementType; label: string; value: string; loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <p className="text-2xl font-mono font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      )}
    </div>
  );
}

/* ── Promo Analytics ── */
function PromoAnalytics({ tasks, loading }: { tasks: RetentionTask[]; loading: boolean }) {
  // Aggregate promo code usage from tasks
  const promoMap = new Map<string, { total: number; sent: number; converted: number; pending: number }>();
  tasks.forEach(t => {
    if (!t.promo_code) return;
    const code = t.promo_code;
    const existing = promoMap.get(code) || { total: 0, sent: 0, converted: 0, pending: 0 };
    existing.total++;
    if (t.status === "sent") existing.sent++;
    else if (t.status === "converted") existing.converted++;
    else existing.pending++;
    promoMap.set(code, existing);
  });
  const promos = Array.from(promoMap.entries())
    .sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <TicketPercent size={15} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Аналитика промокодов</span>
        <Badge variant="outline" className="ml-auto text-[10px]">{promos.length} кодов</Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Промокод</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Выдано</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">В ожидании</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Отправлено</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Использовано</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Конверсия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i} className="border-border">
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : promos.length === 0 ? (
            <TableRow className="border-border">
              <TableCell colSpan={6} className="text-center py-12">
                <Tag size={24} className="text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Промокоды ещё не назначены</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Добавьте промокод при планировании касания</p>
              </TableCell>
            </TableRow>
          ) : (
            promos.map(([code, data]) => {
              const convRate = data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0;
              return (
                <TableRow key={code} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <code className="text-xs bg-secondary px-2 py-1 rounded-md text-primary font-mono font-semibold tracking-wider">{code}</code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono tabular-nums text-right">{data.total}</TableCell>
                  <TableCell className="text-sm font-mono tabular-nums text-right">
                    <span className="text-amber-600 dark:text-amber-400">{data.pending}</span>
                  </TableCell>
                  <TableCell className="text-sm font-mono tabular-nums text-right">
                    <span className="text-blue-600 dark:text-blue-400">{data.sent}</span>
                  </TableCell>
                  <TableCell className="text-sm font-mono tabular-nums text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{data.converted}</span>
                  </TableCell>
                  <TableCell className="text-sm font-mono tabular-nums text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-mono",
                        convRate >= 20
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : convRate > 0
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "text-muted-foreground"
                      )}
                    >
                      {convRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ── Main Page ── */
export default function RetentionLtvPage() {
  const [tasks, setTasks] = useState<RetentionTask[]>([]);
  const [templates, setTemplates] = useState<RetentionTemplate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Form state
  const [formLeadId, setFormLeadId] = useState("");
  const [formTemplateId, setFormTemplateId] = useState("");
  const [formDate, setFormDate] = useState<Date | undefined>(undefined);
  const [formPromo, setFormPromo] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, templatesRes, leadsRes] = await Promise.all([
        (supabase as any)
          .from("retention_tasks")
          .select("*, leads(name), retention_templates(name)")
          .eq("project_id", PROJECT_ID)
          .order("trigger_date", { ascending: true }),
        (supabase as any)
          .from("retention_templates")
          .select("*")
          .eq("project_id", PROJECT_ID)
          .order("revenue_generated", { ascending: false }),
        (supabase as any)
          .from("leads")
          .select("id, name")
          .eq("project_id", PROJECT_ID)
          .order("name"),
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (templatesRes.error) throw templatesRes.error;
      if (leadsRes.error) throw leadsRes.error;

      setTasks((tasksRes.data || []).map((r: any) => ({
        id: r.id,
        lead_id: r.lead_id,
        template_id: r.template_id,
        trigger_date: r.trigger_date,
        promo_code: r.promo_code,
        status: r.status || "pending",
        lead_name: r.leads?.name || "—",
        template_name: r.retention_templates?.name || "—",
      })));
      setTemplates((templatesRes.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        message_prompt: r.message_prompt,
        sent_count: r.sent_count ?? 0,
        return_count: r.return_count ?? 0,
        revenue_generated: r.revenue_generated ?? 0,
      })));
      setLeads(leadsRes.data || []);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
     if (!formLeadId || !formTemplateId || !formDate) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("retention_tasks").insert({
        lead_id: formLeadId,
        template_id: formTemplateId,
        trigger_date: formDate ? format(formDate, "yyyy-MM-dd") : "",
        promo_code: formPromo || null,
        project_id: PROJECT_ID,
        status: "pending",
      });
      if (error) throw error;
      toast({ title: "✅ Касание запланировано" });
      setSheetOpen(false);
      setFormLeadId("");
      setFormTemplateId("");
      setFormDate("");
      setFormPromo("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // KPI calculations
  const totalLtv = templates.reduce((s, t) => s + t.revenue_generated, 0);
  const totalSent = templates.reduce((s, t) => s + t.sent_count, 0);
  const totalReturned = templates.reduce((s, t) => s + t.return_count, 0);
  const retentionRate = totalSent > 0 ? Math.round((totalReturned / totalSent) * 100) : 0;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  // Rough pipeline estimate
  const avgRevPerReturn = totalReturned > 0 ? totalLtv / totalReturned : 0;
  const pipeline = Math.round(pendingTasks * avgRevPerReturn);

  return (
    <DashboardLayout breadcrumb="Генератор LTV">
      <div className="space-y-6">
        {/* ── KPI Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={DollarSign} label="LTV Базы" value={formatMoney(totalLtv)} loading={loading} />
          <KpiCard icon={RefreshCw} label="Возвратность" value={`${retentionRate}%`} loading={loading} />
          <KpiCard icon={Clock} label="Запланировано касаний" value={String(pendingTasks)} loading={loading} />
          <KpiCard icon={TrendingUp} label="Деньги в ожидании" value={formatMoney(pipeline)} loading={loading} />
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="queue" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="queue" className="text-xs gap-1.5">
                <CalendarDays size={13} /> Очередь касаний
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs gap-1.5">
                <FileText size={13} /> Аналитика шаблонов
              </TabsTrigger>
              <TabsTrigger value="promos" className="text-xs gap-1.5">
                <TicketPercent size={13} /> Промокоды
              </TabsTrigger>
            </TabsList>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => setSheetOpen(true)}>
              <Plus size={13} /> Запланировать касание
            </Button>
          </div>

          {/* ── Tab 1: Queue ── */}
          <TabsContent value="queue">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Пациент</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Дата отправки</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Шаблон</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Промокод</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : tasks.length === 0 ? (
                    <TableRow className="border-border">
                      <TableCell colSpan={5} className="text-center py-12">
                        <Clock size={24} className="text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Нет запланированных касаний</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Нажмите «Запланировать касание» чтобы начать</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map(task => (
                      <TableRow key={task.id} className="border-border hover:bg-muted/30">
                        <TableCell className="text-sm font-medium text-foreground">{task.lead_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono tabular-nums">
                          {new Date(task.trigger_date).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{task.template_name}</TableCell>
                        <TableCell>
                          {task.promo_code ? (
                            <code className="text-xs bg-secondary px-1.5 py-0.5 rounded text-primary font-mono">{task.promo_code}</code>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell>{statusBadge(task.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Tab 2: Template Analytics ── */}
          <TabsContent value="templates">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Название шаблона</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Отправлено</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Вернулось</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Конверсия</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-right">Принёс выручки</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : templates.length === 0 ? (
                    <TableRow className="border-border">
                      <TableCell colSpan={5} className="text-center py-12">
                        <FileText size={24} className="text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Шаблонов пока нет</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map(t => {
                      const conv = t.sent_count > 0 ? Math.round((t.return_count / t.sent_count) * 100) : 0;
                      return (
                        <TableRow key={t.id} className="border-border hover:bg-muted/30">
                          <TableCell className="text-sm font-medium text-foreground">{t.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground font-mono tabular-nums text-right">{t.sent_count}</TableCell>
                          <TableCell className="text-sm font-mono tabular-nums text-right">
                            <span className="text-emerald-600 dark:text-emerald-400">{t.return_count}</span>
                          </TableCell>
                          <TableCell className="text-sm font-mono tabular-nums text-right">
                            <span className={conv >= 20 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>{conv}%</span>
                          </TableCell>
                          <TableCell className="text-sm font-mono tabular-nums text-right font-semibold text-foreground">
                            {formatMoney(t.revenue_generated)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Tab 3: Promo Code Analytics ── */}
          <TabsContent value="promos">
            <PromoAnalytics tasks={tasks} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Create Task Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Запланировать касание</SheetTitle>
            <SheetDescription>Выберите пациента, шаблон и дату отправки сообщения.</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Пациент</Label>
              <Select value={formLeadId} onValueChange={setFormLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пациента" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Шаблон сообщения</Label>
              <Select value={formTemplateId} onValueChange={setFormTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите шаблон" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Дата отправки</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Промокод (опционально)</Label>
              <Input placeholder="CHECK2024" value={formPromo} onChange={e => setFormPromo(e.target.value)} />
            </div>

            <Button className="w-full gap-2" onClick={handleCreate} disabled={saving}>
              {saving ? "Сохранение..." : <><Send size={14} /> Запланировать</>}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
