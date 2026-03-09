import { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, Loader2, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import type { DailyRow, ClientOption } from "./ai-reports/shared";
import { AutomationDialog } from "./ai-reports/AutomationDialog";

// Lazy loading all heavy components
const Page1KpiFunnel = lazy(() => import("./ai-reports/Page1KpiFunnel").then(mod => ({ default: mod.Page1KpiFunnel })));
const Page2CreativesChannels = lazy(() => import("./ai-reports/Page2CreativesChannels").then(mod => ({ default: mod.Page2CreativesChannels })));
const Page3LeadQualityUnitEcon = lazy(() => import("./ai-reports/Page3LeadQualityUnitEcon").then(mod => ({ default: mod.Page3LeadQualityUnitEcon })));

const PROJECT_ID = import.meta.env.VITE_PROJECT_ID || "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const curStart = format(weekStart, "yyyy-MM-dd");
      const curEnd = format(weekEnd, "yyyy-MM-dd");
      const pStart = format(prevWeekStart, "yyyy-MM-dd");
      const pEnd = format(prevWeekEnd, "yyyy-MM-dd");

      let curQ = supabase.from("daily_metrics").select("*").eq("project_id", PROJECT_ID).gte("date", curStart).lte("date", curEnd);
      let prevQ = supabase.from("daily_metrics").select("*").eq("project_id", PROJECT_ID).gte("date", pStart).lte("date", pEnd);
      let leadsQ = supabase.from("leads").select("id, status, amount, ai_score, source, created_at").eq("project_id", PROJECT_ID).gte("created_at", curStart);
      let channelsQ = supabase.from("analytics_channels").select("*").eq("project_id", PROJECT_ID);
      let creativesQ = supabase.from("analytics_creatives").select("*, analytics_campaigns!inner(channel_id, name, analytics_channels!inner(project_id))").order("leads", { ascending: false }).limit(10);

      if (selectedClient !== "all") {
        curQ = curQ.eq("client_config_id", selectedClient);
        prevQ = prevQ.eq("client_config_id", selectedClient);
        leadsQ = leadsQ.eq("client_config_id", selectedClient);
      }

      const [curRes, prevRes, leadsRes, chRes, crRes] = await Promise.all([curQ, prevQ, leadsQ, channelsQ, creativesQ]);
      setCurMetrics((curRes.data as DailyRow[]) || []);
      setPrevMetrics((prevRes.data as DailyRow[]) || []);
      setLeads(leadsRes.data || []);
      setChannels(chRes.data || []);
      setCreatives(crRes.data || []);
      setLoading(false);
    };
    load();
  }, [selectedClient, weekStart, weekEnd, prevWeekStart, prevWeekEnd]);

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

  const channelPie = useMemo(() => {
    const colors = ["hsl(var(--primary))", "#60a5fa", "#f472b6", "#a78bfa", "#34d399"];
    const totalRev = channels.reduce((s: number, c: any) => s + (Number(c.revenue) || 0), 0) || 1;
    return channels.map((c: any, i: number) => ({
      name: c.name, value: Math.round(((Number(c.revenue) || 0) / totalRev) * 100),
      color: colors[i % colors.length], cpl: (c.leads || 0) > 0 ? Math.round((Number(c.spend) || 0) / c.leads) : 0, leads: c.leads || 0,
    }));
  }, [channels]);

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
    const results: { badge: string; title: string; name: string; metric: string; color: string }[] = [];
    if (bestCpl) results.push({ badge: "👑", title: "Лучший по CPL", name: bestCpl.name, metric: `CPL: ${(bestCpl.leads || 0) > 0 ? Math.round(bestCpl.spend / bestCpl.leads) : 0} ₸`, color: "border-primary/30 bg-primary/[0.04]" });
    if (bestVisits) results.push({ badge: "🔥", title: "Больше всего визитов", name: bestVisits.name, metric: `Визитов: ${bestVisits.visits || 0}`, color: "border-amber-500/30 bg-amber-500/[0.04]" });
    if (bestSales) results.push({ badge: "💰", title: "Максимум продаж", name: bestSales.name, metric: `Продаж: ${bestSales.sales || 0}`, color: "border-emerald-500/30 bg-emerald-500/[0.04]" });
    return results;
  }, [creatives]);

  const avgCheck = cur.sales > 0 ? cur.revenue / cur.sales : 0;
  const cac = cur.sales > 0 ? cur.spend / cur.sales : 0;
  const romi = cur.spend > 0 ? Math.round(((cur.revenue - cur.spend) / cur.spend) * 100) : 0;
  const hasRevenue = cur.revenue > 0;

  const clientName = selectedClient === "all"
    ? (isAgency ? "Все проекты" : active.name)
    : clients.find(c => c.id === selectedClient)?.client_name || "Проект";

  // Dynamic import for heavy PDF generation libraries!
  const handleDownloadPdf = useCallback(async () => {
    const pages = pagesRef.current.filter(Boolean) as HTMLDivElement[];
    if (pages.length === 0) return;
    setDownloading(true);
    try {
      // Dynamic imports save initial bundle size significantly
      const [html2canvas, { default: jsPDF }] = await Promise.all([
        import("html2canvas").then(m => m.default),
        import("jspdf")
      ]);

      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: null, logging: false });
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
  }, [clientName, now]);

  const isEmpty = curMetrics.length === 0 && !loading;

  return (
    <DashboardLayout breadcrumb="AI Отчётность">
      <div className="space-y-6">
        <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/20">
          <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-[220px] h-9 border-border/30 bg-card text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 Все кабинеты</SelectItem>
                {clients.map(c => (<SelectItem key={c.id} value={c.id}>🦷 {c.client_name}</SelectItem>))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="gap-2 text-sm h-9 text-muted-foreground"><Calendar className="h-4 w-4" />{dateRange}</Button>
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

        {loading && (
          <div className="max-w-4xl mx-auto flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Загрузка данных отчёта…</p>
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="max-w-4xl mx-auto flex items-center justify-center py-32">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto"><BarChart3 className="h-8 w-8 text-muted-foreground/30" /></div>
              <p className="text-base font-medium text-foreground">Нет данных за текущую неделю</p>
              <p className="text-sm text-muted-foreground">Данные появятся когда daily_metrics заполнятся метриками</p>
            </div>
          </div>
        )}

        {!loading && !isEmpty && (
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <Suspense fallback={<div className="h-96 w-full animate-pulse bg-card rounded-2xl border border-border/30" />}>
              <Page1KpiFunnel
                ref={el => { pagesRef.current[0] = el; }}
                clientName={clientName} dateRange={dateRange} now={now} cur={cur} prev={prev} compareEnabled={compareEnabled}
              />
              <Page2CreativesChannels
                ref={el => { pagesRef.current[1] = el; }}
                clientName={clientName} dateRange={dateRange} topCreatives={topCreatives} channelPie={channelPie}
              />
              <Page3LeadQualityUnitEcon
                ref={el => { pagesRef.current[2] = el; }}
                clientName={clientName} dateRange={dateRange} leadQuality={leadQuality} cur={cur} avgCheck={avgCheck} cac={cac} romi={romi} hasRevenue={hasRevenue}
              />
            </Suspense>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
