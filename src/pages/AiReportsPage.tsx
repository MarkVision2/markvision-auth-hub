import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Download, Send, Calendar, TrendingUp, TrendingDown,
  Eye, DollarSign, Users, BarChart3, Sparkles,
  CheckCircle2, Target, Image as ImageIcon,
  Zap, Clock, Bell, ShoppingCart, Flame, MapPin, Lock, Loader2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";

/* ── Helpers ── */
function fmtMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₸`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("ru-RU")} ${Math.round(n) >= 1000 ? "" : ""}K ₸`.replace(/\s+K/, "K");
  return `${Math.round(n).toLocaleString("ru-RU")} ₸`;
}
function fmtNum(n: number) { return n.toLocaleString("ru-RU"); }
function pctChange(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

const PROJECT_ID = "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

function TrendPill({ value, good }: { value: number; good: boolean }) {
  const positive = value > 0;
  const color = good ? "text-primary" : "text-destructive";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}{value}%
    </span>
  );
}

function PageFooter({ page, total }: { page: number; total: number }) {
  return (
    <div className="px-10 py-4 border-t border-border/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] text-muted-foreground">Сгенерировано <span className="text-foreground font-medium">MarkVision AI</span></span>
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums">Страница {page} из {total}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{children}</h2>
    </div>
  );
}

function MiniHeader({ clientName, dateRange, subtitle }: { clientName: string; dateRange: string; subtitle: string }) {
  return (
    <>
      <div className="px-10 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">📊</span>
          <span className="text-sm font-semibold text-foreground">{clientName}</span>
          <span className="text-xs text-muted-foreground">· {dateRange}</span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{subtitle}</span>
      </div>
      <div className="mx-10"><Separator className="bg-border/15" /></div>
    </>
  );
}

/* ── Automation Dialog ── */
function AutomationDialog() {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [groupId, setGroupId] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2 text-sm h-9 text-muted-foreground hover:text-foreground">
          <Send className="h-4 w-4" />Авто-отправка
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] border-border/30">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />Автоматизация отчётов
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Настройте регулярную отправку в Telegram</p>
        </DialogHeader>
        <div className="space-y-5 mt-4">
          <div className="flex items-center justify-between rounded-xl bg-accent/30 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Включить регулярные отчёты</p>
              <p className="text-xs text-muted-foreground mt-0.5">Автоматическая отправка</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Частота</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Еженедельно</div></SelectItem>
                <SelectItem value="biweekly"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Раз в 2 недели</div></SelectItem>
                <SelectItem value="monthly"><div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Ежемесячно</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Telegram Group ID</label>
            <Input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="-100XXXXXXXXXX" className="h-10 font-mono text-sm" />
          </div>
          <Button className="w-full h-10 text-sm font-semibold gap-2" disabled={!enabled}>
            <Zap className="h-4 w-4" />Сохранить расписание
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

interface ClientOption {
  id: string;
  client_name: string;
}

interface DailyRow {
  date: string;
  spend: number | null;
  clicks: number | null;
  impressions: number | null;
  leads: number | null;
  visits: number | null;
  sales: number | null;
  revenue: number | null;
}

export default function AiReportsPage() {
  const { active, isAgency } = useWorkspace();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);

  // Data state
  const [curMetrics, setCurMetrics] = useState<DailyRow[]>([]);
  const [prevMetrics, setPrevMetrics] = useState<DailyRow[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);

  // Date range: current week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const dateRange = `${format(weekStart, "d MMM", { locale: ru })} – ${format(weekEnd, "d MMM yyyy", { locale: ru })}`;

  // Load clients
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("clients_config")
        .select("id, client_name")
        .eq("project_id", PROJECT_ID)
        .eq("is_active", true)
        .order("client_name");
      if (data && data.length > 0) {
        setClients(data);
      }
    };
    load();
  }, []);

  // Load report data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const curStart = format(weekStart, "yyyy-MM-dd");
      const curEnd = format(weekEnd, "yyyy-MM-dd");
      const pStart = format(prevWeekStart, "yyyy-MM-dd");
      const pEnd = format(prevWeekEnd, "yyyy-MM-dd");

      // Build queries with optional client filter
      let curQ = supabase.from("daily_metrics").select("*")
        .eq("project_id", PROJECT_ID)
        .gte("date", curStart).lte("date", curEnd);
      let prevQ = supabase.from("daily_metrics").select("*")
        .eq("project_id", PROJECT_ID)
        .gte("date", pStart).lte("date", pEnd);
      let leadsQ = supabase.from("leads").select("id, status, amount, ai_score, source, created_at")
        .eq("project_id", PROJECT_ID)
        .gte("created_at", curStart);
      let channelsQ = supabase.from("analytics_channels").select("*")
        .eq("project_id", PROJECT_ID);
      let creativesQ = supabase.from("analytics_creatives").select("*, analytics_campaigns!inner(channel_id, name, analytics_channels!inner(project_id))")
        .order("leads", { ascending: false })
        .limit(10);

      if (selectedClient !== "all") {
        curQ = curQ.eq("client_config_id", selectedClient);
        prevQ = prevQ.eq("client_config_id", selectedClient);
        leadsQ = leadsQ.eq("client_config_id", selectedClient);
      }

      const [curRes, prevRes, leadsRes, chRes, crRes] = await Promise.all([
        curQ, prevQ, leadsQ, channelsQ, creativesQ,
      ]);

      setCurMetrics((curRes.data as DailyRow[]) || []);
      setPrevMetrics((prevRes.data as DailyRow[]) || []);
      setLeads(leadsRes.data || []);
      setChannels(chRes.data || []);
      setCreatives(crRes.data || []);
      setLoading(false);
    };
    load();
  }, [selectedClient]);

  // Aggregate metrics
  const cur = useMemo(() => {
    const sum = (key: keyof DailyRow) => curMetrics.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    return {
      spend: sum("spend"), clicks: sum("clicks"), impressions: sum("impressions"),
      leads: sum("leads"), visits: sum("visits"), sales: sum("sales"), revenue: sum("revenue"),
    };
  }, [curMetrics]);

  const prev = useMemo(() => {
    const sum = (key: keyof DailyRow) => prevMetrics.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    return {
      spend: sum("spend"), clicks: sum("clicks"), impressions: sum("impressions"),
      leads: sum("leads"), visits: sum("visits"), sales: sum("sales"), revenue: sum("revenue"),
    };
  }, [prevMetrics]);

  const cpl = cur.leads > 0 ? cur.spend / cur.leads : 0;
  const cpv = cur.visits > 0 ? cur.spend / cur.visits : 0;
  const cac = cur.sales > 0 ? cur.spend / cur.sales : 0;
  const prevCpl = prev.leads > 0 ? prev.spend / prev.leads : 0;
  const prevCpv = prev.visits > 0 ? prev.spend / prev.visits : 0;
  const prevCac = prev.sales > 0 ? prev.spend / prev.sales : 0;

  const hasRevenue = cur.revenue > 0;

  const kpis7 = [
    { label: "Расходы", value: fmtMoney(cur.spend), trend: pctChange(cur.spend, prev.spend), good: cur.spend <= prev.spend, icon: DollarSign, accent: false },
    { label: "Лиды", value: fmtNum(cur.leads), trend: pctChange(cur.leads, prev.leads), good: cur.leads >= prev.leads, icon: Users, accent: false },
    { label: "CPL", value: fmtMoney(cpl), trend: pctChange(cpl, prevCpl), good: cpl <= prevCpl, icon: Target, accent: false },
    { label: "Визиты", value: fmtNum(cur.visits), trend: pctChange(cur.visits, prev.visits), good: cur.visits >= prev.visits, icon: Eye, accent: false },
    { label: "CPV", value: fmtMoney(cpv), trend: pctChange(cpv, prevCpv), good: cpv <= prevCpv, icon: MapPin, accent: false },
    { label: "Продажи", value: fmtNum(cur.sales), trend: pctChange(cur.sales, prev.sales), good: cur.sales >= prev.sales, icon: ShoppingCart, accent: false },
    { label: "CAC", value: fmtMoney(cac), trend: pctChange(cac, prevCac), good: cac <= prevCac, icon: Flame, accent: true },
  ];

  const funnel = [
    { label: "Показы", value: cur.impressions, short: fmtNum(cur.impressions) },
    { label: "Клики", value: cur.clicks, short: fmtNum(cur.clicks) },
    { label: "Лиды", value: cur.leads, short: fmtNum(cur.leads) },
    { label: "Визиты", value: cur.visits, short: fmtNum(cur.visits) },
    { label: "Продажи", value: cur.sales, short: fmtNum(cur.sales) },
  ];

  // Lead quality from AI scores
  const leadQuality = useMemo(() => {
    const total = leads.length || 1;
    const hot = leads.filter((l: any) => (l.ai_score ?? 0) >= 70).length;
    const warm = leads.filter((l: any) => (l.ai_score ?? 0) >= 30 && (l.ai_score ?? 0) < 70).length;
    const cold = leads.filter((l: any) => (l.ai_score ?? 0) < 30).length;
    return [
      { label: "🔥 Горячие", pct: Math.round((hot / total) * 100), count: hot, color: "bg-primary", textColor: "text-primary" },
      { label: "🟡 Тёплые", pct: Math.round((warm / total) * 100), count: warm, color: "bg-amber-500", textColor: "text-amber-400" },
      { label: "🗑 Холодные", pct: Math.round((cold / total) * 100), count: cold, color: "bg-destructive", textColor: "text-destructive" },
    ];
  }, [leads]);

  // Channel pie data
  const channelPie = useMemo(() => {
    const colors = ["hsl(var(--primary))", "#60a5fa", "#f472b6", "#a78bfa", "#34d399"];
    const totalRev = channels.reduce((s: number, c: any) => s + (Number(c.revenue) || 0), 0) || 1;
    return channels.map((c: any, i: number) => ({
      name: c.name,
      value: Math.round(((Number(c.revenue) || 0) / totalRev) * 100),
      color: colors[i % colors.length],
      cpl: (c.leads || 0) > 0 ? Math.round((Number(c.spend) || 0) / c.leads) : 0,
      leads: c.leads || 0,
    }));
  }, [channels]);

  // Unit economics
  const avgCheck = cur.sales > 0 ? cur.revenue / cur.sales : 0;
  const romi = cur.spend > 0 ? Math.round(((cur.revenue - cur.spend) / cur.spend) * 100) : 0;

  // Top creatives
  const topCreatives = useMemo(() => {
    if (!creatives.length) return [];
    const sorted = [...creatives];
    const bestCpl = sorted.sort((a, b) => {
      const cplA = (a.leads || 0) > 0 ? (a.spend || 0) / a.leads : Infinity;
      const cplB = (b.leads || 0) > 0 ? (b.spend || 0) / b.leads : Infinity;
      return cplA - cplB;
    })[0];
    const bestVisits = [...creatives].sort((a, b) => (b.visits || 0) - (a.visits || 0))[0];
    const bestSales = [...creatives].sort((a, b) => (b.sales || 0) - (a.sales || 0))[0];
    const results = [];
    if (bestCpl) results.push({ badge: "👑", title: "Лучший по CPL", name: bestCpl.name, metric: `CPL: ${fmtMoney((bestCpl.leads || 0) > 0 ? bestCpl.spend / bestCpl.leads : 0)}`, color: "border-primary/30 bg-primary/[0.04]" });
    if (bestVisits) results.push({ badge: "🔥", title: "Больше всего визитов", name: bestVisits.name, metric: `Визитов: ${bestVisits.visits || 0}`, color: "border-amber-500/30 bg-amber-500/[0.04]" });
    if (bestSales) results.push({ badge: "💰", title: "Максимум продаж", name: bestSales.name, metric: `Продаж: ${bestSales.sales || 0}`, color: "border-emerald-500/30 bg-emerald-500/[0.04]" });
    return results;
  }, [creatives]);

  const clientName = selectedClient === "all"
    ? (isAgency ? "Все проекты" : active.name)
    : clients.find(c => c.id === selectedClient)?.client_name || "Проект";

  const handleDownloadPdf = useCallback(async () => {
    const pages = pagesRef.current.filter(Boolean) as HTMLDivElement[];
    if (pages.length === 0) return;
    setDownloading(true);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });
        const imgData = canvas.toDataURL("image/png");
        const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
        const imgW = canvas.width * ratio;
        const imgH = canvas.height * ratio;
        const x = (pdfW - imgW) / 2;
        const y = (pdfH - imgH) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
      }

      pdf.save(`report_${clientName}_${format(now, "yyyy-MM-dd")}.pdf`);
    } catch (e) {
      console.error("PDF generation failed", e);
    } finally {
      setDownloading(false);
    }
  }, [clientName]);

  const isEmpty = curMetrics.length === 0 && !loading;

  return (
    <DashboardLayout breadcrumb="AI Отчётность">
      <div className="space-y-6">
        {/* ─── TOP CONTROLS ─── */}
        <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[220px] h-9 border-border/30 bg-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 Все кабинеты</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>🦷 {c.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="gap-2 text-sm h-9 text-muted-foreground">
                <Calendar className="h-4 w-4" />{dateRange}
              </Button>
              <div className="flex items-center gap-2 px-3 h-9">
                <Switch checked={compareEnabled} onCheckedChange={setCompareEnabled} className="scale-90" />
                <span className="text-xs text-muted-foreground">Сравнение</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <AutomationDialog />
              <Button className="gap-2 text-sm h-9 font-semibold" onClick={handleDownloadPdf} disabled={downloading || loading || isEmpty}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {downloading ? "Генерация…" : "Скачать PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Loading ─── */}
        {loading && (
          <div className="max-w-4xl mx-auto flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Загрузка данных отчёта…</p>
            </div>
          </div>
        )}

        {/* ─── Empty state ─── */}
        {isEmpty && (
          <div className="max-w-4xl mx-auto flex items-center justify-center py-32">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-base font-medium text-foreground">Нет данных за текущую неделю</p>
              <p className="text-sm text-muted-foreground">Данные появятся когда daily_metrics заполнятся метриками</p>
            </div>
          </div>
        )}

        {/* ─── STACKED A4 PAGES ─── */}
        {!loading && !isEmpty && (
          <div className="max-w-4xl mx-auto space-y-8 pb-12">

            {/* ═══ PAGE 1: KPI & FUNNEL ═══ */}
            <div ref={el => { pagesRef.current[0] = el; }} className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30">
              {/* Report Header */}
              <div className="px-10 pt-10 pb-8 border-b border-border/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-foreground tracking-tight">Маркетинговый отчёт</h1>
                      <p className="text-sm text-muted-foreground mt-0.5">{clientName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground tabular-nums">{dateRange}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{format(now, "d MMMM yyyy, HH:mm", { locale: ru })}</p>
                    <Badge variant="outline" className="mt-2 text-[10px] border-primary/30 text-primary gap-1">
                      <Sparkles className="h-3 w-3" /> AI Generated
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 7-Metric KPI Grid */}
              <div className="px-10 py-7">
                <SectionTitle>Ключевые показатели</SectionTitle>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {kpis7.slice(0, 4).map(kpi => (
                    <div key={kpi.label} className="rounded-xl bg-accent/20 border border-border/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <kpi.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
                      </div>
                      <p className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</p>
                      {compareEnabled && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <TrendPill value={kpi.trend} good={kpi.good} />
                          <span className="text-[9px] text-muted-foreground/50">vs нед.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {kpis7.slice(4).map(kpi => (
                    <div
                      key={kpi.label}
                      className={`rounded-xl p-4 border ${
                        kpi.accent
                          ? "bg-primary/[0.06] border-primary/25 ring-1 ring-primary/10"
                          : "bg-accent/20 border-border/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <kpi.icon className={`h-3.5 w-3.5 ${kpi.accent ? "text-primary" : "text-muted-foreground/60"}`} />
                        <span className={`text-[11px] font-medium ${kpi.accent ? "text-primary" : "text-muted-foreground"}`}>{kpi.label}</span>
                        {kpi.accent && (
                          <Badge className="ml-auto text-[8px] h-4 px-1.5 bg-primary/15 text-primary border-primary/20">KEY</Badge>
                        )}
                      </div>
                      <p className={`text-lg font-bold tabular-nums ${kpi.accent ? "text-primary" : "text-foreground"}`}>{kpi.value}</p>
                      {compareEnabled && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <TrendPill value={kpi.trend} good={kpi.good} />
                          <span className="text-[9px] text-muted-foreground/50">vs нед.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel */}
              <div className="px-10 py-7 border-t border-border/10">
                <SectionTitle>Воронка конверсии</SectionTitle>
                <div className="space-y-0">
                  {funnel.map((step, i) => {
                    const nextStep = funnel[i + 1];
                    const convRate = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(1) : null;
                    const dropOff = nextStep && step.value > 0 ? (100 - (nextStep.value / step.value) * 100).toFixed(1) : null;
                    const barWidth = funnel[0].value > 0 ? (step.value / funnel[0].value) * 100 : 0;

                    return (
                      <div key={step.label}>
                        <div className="flex items-center gap-4 py-2">
                          <span className="text-[11px] text-muted-foreground w-20 text-right shrink-0 font-medium">{step.label}</span>
                          <div className="flex-1 relative">
                            <div
                              className="h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center px-3 transition-all"
                              style={{ width: `${Math.max(barWidth, 8)}%` }}
                            >
                              <span className="text-sm font-bold text-foreground tabular-nums">{step.short}</span>
                            </div>
                          </div>
                        </div>
                        {convRate && (
                          <div className="flex items-center gap-4 py-1 ml-24">
                            <div className="flex items-center gap-3 text-[10px]">
                              <span className="text-primary font-bold tabular-nums">↓ {convRate}% конверсия</span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="text-destructive/70 tabular-nums">−{dropOff}% потери</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <PageFooter page={1} total={3} />
            </div>

            {/* ═══ PAGE 2: CREATIVES & CHANNELS ═══ */}
            <div ref={el => { pagesRef.current[1] = el; }} className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30">
              <MiniHeader clientName={clientName} dateRange={dateRange} subtitle="Креативы и Каналы" />

              {/* Top Creatives */}
              {topCreatives.length > 0 && (
                <div className="px-10 py-7">
                  <SectionTitle>Топ креативов</SectionTitle>
                  <div className="grid grid-cols-3 gap-4">
                    {topCreatives.map(c => (
                      <div key={c.title} className={`rounded-xl border p-5 space-y-3 ${c.color}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{c.badge}</span>
                          <span className="text-[11px] font-semibold text-foreground">{c.title}</span>
                        </div>
                        <div className="aspect-[4/3] rounded-lg bg-accent/20 border border-border/15 flex flex-col items-center justify-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-accent/40 flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                          <p className="text-[11px] font-medium text-foreground truncate max-w-[90%]">{c.name}</p>
                        </div>
                        <div className="rounded-lg bg-accent/30 px-3 py-2 text-center">
                          <p className="text-sm font-bold text-foreground tabular-nums">{c.metric}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revenue by Channel */}
              {channelPie.length > 0 && (
                <div className="px-10 py-7 border-t border-border/10">
                  <SectionTitle>Каналы трафика</SectionTitle>
                  <div className="grid grid-cols-[1fr_1fr] gap-6">
                    <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                      <p className="text-xs text-muted-foreground mb-3 font-medium">Выручка по каналам</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={channelPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                              {channelPie.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border)/0.3)", borderRadius: 8, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4 mt-2">
                        {channelPie.map(r => (
                          <div key={r.name} className="flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                            <span className="text-[11px] text-muted-foreground">{r.name} — {r.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-accent/10 border border-border/15 p-5">
                      <p className="text-xs text-muted-foreground mb-3 font-medium">Детализация по каналам</p>
                      <div className="space-y-0">
                        <div className="grid grid-cols-4 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold py-2 border-b border-border/10">
                          <span>Канал</span><span className="text-right">Доля</span><span className="text-right">CPL</span><span className="text-right">Лиды</span>
                        </div>
                        {channelPie.map(c => (
                          <div key={c.name} className="grid grid-cols-4 py-3 border-b border-border/5 last:border-0">
                            <span className="text-sm text-foreground">{c.name}</span>
                            <span className="text-sm text-foreground tabular-nums text-right">{c.value}%</span>
                            <span className="text-sm text-foreground tabular-nums text-right">{fmtMoney(c.cpl)}</span>
                            <span className="text-sm text-muted-foreground tabular-nums text-right">{c.leads}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <PageFooter page={2} total={3} />
            </div>

            {/* ═══ PAGE 3: LEAD QUALITY & UNIT ECONOMICS ═══ */}
            <div className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30">
              <MiniHeader clientName={clientName} dateRange={dateRange} subtitle="Продажи и Юнит-экономика" />

              {/* Lead Quality */}
              <div className="px-10 py-7">
                <SectionTitle>Качество трафика (AI Scoring)</SectionTitle>
                <div className="rounded-xl bg-accent/10 border border-border/15 p-6">
                  <div className="h-6 rounded-full overflow-hidden flex mb-5 ring-1 ring-border/10">
                    {leadQuality.map(seg => (
                      <div key={seg.label} className={`${seg.color} h-full transition-all`} style={{ width: `${seg.pct}%` }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {leadQuality.map(seg => (
                      <div key={seg.label} className="text-center">
                        <p className="text-sm font-medium text-foreground">{seg.label}</p>
                        <p className={`text-2xl font-bold tabular-nums mt-1 ${seg.textColor}`}>{seg.pct}%</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{seg.count} лидов</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unit Economics */}
              <div className="px-10 py-7 border-t border-border/10">
                <SectionTitle>Юнит-экономика</SectionTitle>
                <div className="relative">
                  <div className={hasRevenue ? "" : "blur-md opacity-40 pointer-events-none select-none"}>
                    <div className="rounded-xl bg-primary/[0.04] border border-primary/15 overflow-hidden">
                      <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Финансовая сводка</p>
                          <p className="text-[10px] text-muted-foreground">Unit Economics · {dateRange}</p>
                        </div>
                      </div>
                      <div className="divide-y divide-primary/10">
                        {[
                          { label: "Общая выручка", value: fmtMoney(cur.revenue), sub: "Total Revenue", icon: DollarSign },
                          { label: "Средний чек", value: fmtMoney(avgCheck), sub: "Average Order Value", icon: ShoppingCart },
                          { label: "CAC", value: fmtMoney(cac), sub: "Customer Acquisition Cost", icon: Users },
                          { label: "ROMI", value: `${romi}%`, sub: "Return on Marketing", icon: TrendingUp },
                        ].map(item => (
                          <div key={item.label} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <item.icon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-foreground font-medium">{item.label}</p>
                                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                              </div>
                            </div>
                            <p className="text-xl font-bold text-foreground tabular-nums">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!hasRevenue && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm border border-border/30">
                      <div className="h-14 w-14 rounded-2xl bg-muted/80 border border-border flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-base font-semibold text-foreground mb-1.5">Данные о выручке не переданы</p>
                      <p className="text-xs text-muted-foreground text-center max-w-xs leading-relaxed mb-5">
                        Укажите суммы успешных сделок в CRM или daily_metrics, чтобы разблокировать ROMI и Средний чек.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <PageFooter page={3} total={3} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
