import { useState, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronRight, ChevronDown, TrendingUp, DollarSign, BarChart3, Crown,
  Image, Video, Layers, Film, Inbox, Users, Target, Eye, ShoppingCart, Zap, RefreshCcw
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatMoney, formatNum, calcRomi, type Channel, type Campaign } from "@/components/analytics/analyticsData";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceAnalyticsTab } from "@/components/analytics/ServiceAnalyticsTab";
import PeriodPicker from "@/components/agency/PeriodPicker";
import type { DateRange } from "react-day-picker";

const formatIcons: Record<string, React.ReactNode> = {
  Video: <Video className="h-3.5 w-3.5" />,
  Photo: <Image className="h-3.5 w-3.5" />,
  Carousel: <Layers className="h-3.5 w-3.5" />,
  Reel: <Film className="h-3.5 w-3.5" />,
};

/* ── KPI Card (upgraded) ── */
function KpiCard({
  icon, label, value, sub, accent = false, trend,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean; trend?: number;
}) {
  const isPositive = (trend || 0) > 0;
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-2 transition-all group hover:shadow-lg ${accent
      ? "border-primary/25 bg-primary/[0.04] hover:shadow-primary/5"
      : "border-border bg-card hover:border-primary/20"
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${accent ? "bg-primary/15 text-primary" : "bg-secondary border border-border text-muted-foreground"
            }`}>
            {icon}
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
            isPositive 
              ? (label === "Расход" ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500") 
              : (label === "Расход" ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive")
          }`}>
            {isPositive ? "+" : ""}{trend}%
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold tracking-tight tabular-nums font-mono ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/* ── Funnel ── */
function FunnelVis({ funnelData }: { funnelData: { stage: string; value: number; label: string }[] }) {
  if (funnelData.every((d) => d.value === 0)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Inbox className="h-10 w-10 opacity-40" />
        <p className="text-sm">Нет данных для воронки</p>
        <p className="text-xs text-muted-foreground/60">Данные формируются из daily_data</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Target className="h-32 w-32 rotate-12" />
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest">Воронка конверсий</h3>
          <p className="text-[11px] text-muted-foreground mt-1">От охвата до реальных продаж</p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">
          LIVE
        </Badge>
      </div>

      <div className="space-y-4 relative">
        {funnelData.map((step, i) => {
          const maxVal = funnelData[0].value || 1;
          const width = Math.max((step.value / maxVal) * 100, 15);
          const prevValue = i > 0 ? funnelData[i - 1].value : null;
          const convRate = prevValue && prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : null;
          
          return (
            <div key={step.stage} className="relative">
              <div className="flex justify-between items-end text-[12px] mb-1.5 px-1">
                <span className="font-bold text-muted-foreground uppercase tracking-tighter text-[10px]">{step.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="font-black text-foreground tabular-nums text-sm">{step.label}</span>
                  {convRate && (
                    <span className="bg-primary/10 text-primary text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm border border-primary/10">
                      {convRate}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-10 rounded-xl bg-secondary/30 overflow-hidden border border-border/50 backdrop-blur-sm p-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-lg relative overflow-hidden shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                  style={{ 
                    background: `linear-gradient(90deg, hsl(var(--primary) / ${0.4 - i * 0.05}), hsl(var(--primary) / ${0.8 - i * 0.1}))`,
                    opacity: 1 - i * 0.08
                  }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
              {i < funnelData.length - 1 && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="h-2 w-[1px] bg-border/50" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Channel Chart ── */
function ChannelChart({ chartData }: { chartData: { name: string; spend: number; revenue: number; color: string }[] }) {
  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Inbox className="h-10 w-10 opacity-40" />
        <p className="text-sm">Нет данных по каналам</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-6 h-full relative group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest">Расход vs Выручка</h3>
          <p className="text-[11px] text-muted-foreground mt-1">Эффективность рекламных каналов</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary/40" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Расход</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Выручка</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} strokeOpacity={0.5} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} 
            axisLine={false} 
            tickLine={false} 
            dy={10}
          />
          <YAxis 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(v: any) => formatMoney(v).replace('₽', '')}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
            contentStyle={{ 
              background: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))", 
              borderRadius: 12, 
              fontSize: 12,
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
            }}
            labelStyle={{ fontWeight: 800, color: "hsl(var(--foreground))", marginBottom: 4 }}
            formatter={(value: number, name: string) => [formatMoney(value), name === "spend" ? "Расход" : "Выручка"]}
          />
          <Bar dataKey="spend" name="spend" radius={[4, 4, 0, 0]} maxBarSize={32}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.3} className="transition-all duration-300 hover:fill-opacity-50" />
            ))}
          </Bar>
          <Bar dataKey="revenue" name="revenue" radius={[4, 4, 0, 0]} maxBarSize={32}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} className="transition-all duration-300 hover:opacity-80" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Tree Table Row ── */
function ChannelRow({ channel }: { channel: Channel }) {
  const [open, setOpen] = useState(false);
  const romi = calcRomi(channel.revenue, channel.spend);
  const channelCpl = channel.leads > 0 ? formatMoney(channel.spend / channel.leads) : "—";
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-accent/30 border-border" onClick={() => setOpen(!open)}>
        <TableCell className="font-semibold text-foreground">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span className="text-base mr-1">{channel.icon}</span>
            {channel.name}
          </div>
        </TableCell>
        <TableCell />
        <TableCell className="text-muted-foreground text-[12px]">—</TableCell>
        <TableCell className="tabular-nums">{formatMoney(channel.spend)}</TableCell>
        <TableCell className="tabular-nums">{formatNum(channel.clicks)}</TableCell>
        <TableCell className="tabular-nums">{formatNum(channel.leads)}</TableCell>
        <TableCell className="tabular-nums font-medium text-primary">{channelCpl}</TableCell>
        <TableCell className="tabular-nums">{formatNum(channel.visits)}</TableCell>
        <TableCell className="tabular-nums">{formatNum(channel.sales)}</TableCell>
        <TableCell className="tabular-nums font-semibold text-foreground">{formatMoney(channel.revenue)}</TableCell>
        <TableCell>
          <Badge variant="outline" className="text-[11px] border-primary/30 text-primary font-semibold">{romi}</Badge>
        </TableCell>
      </TableRow>
      <AnimatePresence>
        {open && channel.campaigns.map((camp) => (
          <CampaignRow key={camp.id} campaign={camp} channelColor={channel.color} />
        ))}
      </AnimatePresence>
    </>
  );
}

function CampaignRow({ campaign, channelColor }: { campaign: Campaign; channelColor: string }) {
  const [open, setOpen] = useState(false);
  const romi = calcRomi(campaign.revenue, campaign.spend);
  const campCpl = campaign.leads > 0 ? formatMoney(campaign.spend / campaign.leads) : "—";
  return (
    <>
      <motion.tr
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="cursor-pointer hover:bg-accent/20 border-b border-border"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        <TableCell className="pl-10 text-[13px]">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: channelColor }} />
            {campaign.name}
          </div>
        </TableCell>
        <TableCell />
        <TableCell className="text-muted-foreground text-[12px]">—</TableCell>
        <TableCell className="tabular-nums text-[13px]">{formatMoney(campaign.spend)}</TableCell>
        <TableCell className="tabular-nums text-[13px]">{formatNum(campaign.clicks)}</TableCell>
        <TableCell className="tabular-nums text-[13px]">{formatNum(campaign.leads)}</TableCell>
        <TableCell className="tabular-nums text-[13px] text-primary">{campCpl}</TableCell>
        <TableCell className="tabular-nums text-[13px]">{formatNum(campaign.visits)}</TableCell>
        <TableCell className="tabular-nums text-[13px]">{formatNum(campaign.sales)}</TableCell>
        <TableCell className="tabular-nums text-[13px] font-medium">{formatMoney(campaign.revenue)}</TableCell>
        <TableCell><Badge variant="outline" className="text-[11px] border-border">{romi}</Badge></TableCell>
      </motion.tr>
      <AnimatePresence>
        {open && campaign.creatives.map((cr) => {
          const crCpl = cr.leads > 0 ? formatMoney(cr.spend / cr.leads) : "—";
          return (
            <motion.tr
              key={cr.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border-b border-border/50 bg-accent/5"
            >
              <TableCell className="pl-[72px] text-[12px]">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                    {formatIcons[cr.format] || <Image className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-foreground">{cr.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-[10px] font-normal">{cr.format}</Badge>
              </TableCell>
              <TableCell className="text-[11px] text-muted-foreground max-w-[120px] truncate">{cr.landing}</TableCell>
              <TableCell className="tabular-nums text-[12px]">{formatMoney(cr.spend)}</TableCell>
              <TableCell className="tabular-nums text-[12px]">{formatNum(cr.clicks)}</TableCell>
              <TableCell className="tabular-nums text-[12px]">{formatNum(cr.leads)}</TableCell>
              <TableCell className="tabular-nums text-[12px] text-primary">{crCpl}</TableCell>
              <TableCell className="tabular-nums text-[12px]">{formatNum(cr.visits)}</TableCell>
              <TableCell className="tabular-nums text-[12px]">{formatNum(cr.sales)}</TableCell>
              <TableCell className="tabular-nums text-[12px] font-medium">{formatMoney(cr.revenue)}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] border-border">{calcRomi(cr.revenue, cr.spend)}</Badge>
              </TableCell>
            </motion.tr>
          );
        })}
      </AnimatePresence>
    </>
  );
}

/* ── Organic Table ── */
function OrganicTracker({ posts }: { posts: { id: string; thumbnail: string; caption: string; triggerWord: string; dms: number; leads: number; sales: number; revenue: number; ltv: number }[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-foreground uppercase tracking-widest">Контент-Завод → Продажи</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Эффективность органического продвижения</p>
          </div>
        </div>
      </div>
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center">
            <Inbox className="h-8 w-8 opacity-20" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">Нет данных по органике</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[250px]">
              Добавьте посты в таблицу analytics_organic_posts для отслеживания конверсий.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-bold text-muted-foreground uppercase px-6 py-4">Пост / Контент</TableHead>
                <TableHead className="text-[10px] font-bold text-muted-foreground uppercase">Кодовое слово</TableHead>
                <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right">Сообщения</TableHead>
                <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right">Лиды</TableHead>
                <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right">Продажи</TableHead>
                <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right">Выручка</TableHead>
                <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right">LTV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} className="border-border hover:bg-muted/20 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-xl shadow-sm overflow-hidden">
                        {post.thumbnail.startsWith('http') ? (
                          <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          post.thumbnail
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground max-w-[200px] truncate">{post.caption}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tighter">ID: {post.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest px-2">
                      {post.triggerWord || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">{formatNum(post.dms)}</TableCell>
                  <TableCell className="text-right font-bold text-sm tabular-nums text-foreground">{formatNum(post.leads)}</TableCell>
                  <TableCell className="text-right font-bold text-sm tabular-nums text-primary">{formatNum(post.sales)}</TableCell>
                  <TableCell className="text-right font-black text-sm tabular-nums text-foreground">{formatMoney(post.revenue)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
                      {formatMoney(post.ltv)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ── Loading skeleton ── */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[320px] rounded-2xl" />
        <Skeleton className="h-[320px] rounded-2xl" />
      </div>
      <Skeleton className="h-[400px] rounded-2xl" />
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */
export default function AnalyticsPage() {
  const {
    channels, organicPosts, loading,
    totalSpend, totalRevenue, totalSales, totalLeads, totalClicks, totalVisits, totalImpressions,
    globalRomi, cpl, cpv, cac,
    topChannel, funnelData, channelChartData, totalLeadsFromCrm,
    period, setPeriod, refresh, trends
  } = useAnalyticsData();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  return (
    <DashboardLayout breadcrumb="Сквозная аналитика">
      {loading && !isRefreshing ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Сквозная аналитика</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Полная воронка: от показа до продажи</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PeriodPicker value={period} onChange={(range: DateRange) => {
                if (range.from && range.to) {
                  setPeriod({ from: range.from, to: range.to });
                }
              }} />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-xl border-border bg-card"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin")} />
              </Button>
              <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] h-9 text-[13px] border-border bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все каналы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 7-KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Расход" value={formatMoney(totalSpend)} sub="за период" trend={trends.spend} />
            <KpiCard icon={<Users className="h-4 w-4" />} label="Лиды" value={formatNum(totalLeads)} sub={`${totalLeadsFromCrm} в CRM`} trend={trends.leads} />
            <KpiCard icon={<Target className="h-4 w-4" />} label="CPL" value={cpl > 0 ? formatMoney(cpl) : "—"} sub="стоимость лида" accent={cpl > 0} />
            <KpiCard icon={<Eye className="h-4 w-4" />} label="Визиты" value={formatNum(totalVisits)} sub={cpv > 0 ? `CPV: ${formatMoney(cpv)}` : "нет данных"} trend={trends.visits} />
            <KpiCard icon={<ShoppingCart className="h-4 w-4" />} label="Продажи" value={formatNum(totalSales)} sub={cac > 0 ? `CAC: ${formatMoney(cac)}` : "нет данных"} trend={trends.sales} />
            <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Выручка" value={formatMoney(totalRevenue)} trend={trends.revenue} />
            <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="ROMI" value={totalSpend > 0 ? `${globalRomi}%` : "—"} sub={topChannel ? `Топ: ${topChannel.name}` : ""} accent={globalRomi > 0} trend={trends.romi} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FunnelVis funnelData={funnelData} />
            <ChannelChart chartData={channelChartData} />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="drilldown" className="space-y-4">
            <TabsList className="h-11 bg-secondary/30 border border-border p-1 rounded-xl">
              <TabsTrigger value="drilldown" className="h-9 px-4 text-sm font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Детализация по каналам
              </TabsTrigger>
              <TabsTrigger value="services" className="h-9 px-4 text-sm font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Аналитика по услугам
              </TabsTrigger>
              <TabsTrigger value="organic" className="h-9 px-4 text-sm font-medium rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                Органика и контент
              </TabsTrigger>
            </TabsList>

            <TabsContent value="drilldown">
              {channels.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Inbox className="h-10 w-10 opacity-40" />
                  <p className="text-sm font-medium">Нет данных по каналам</p>
                  <p className="text-xs text-muted-foreground/60">Добавьте каналы и кампании в таблицу analytics_channels</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-[11px] w-[260px]">Название</TableHead>
                        <TableHead className="text-[11px]">Формат</TableHead>
                        <TableHead className="text-[11px]">Сайт</TableHead>
                        <TableHead className="text-[11px]">Расходы</TableHead>
                        <TableHead className="text-[11px]">Клики</TableHead>
                        <TableHead className="text-[11px]">Лиды</TableHead>
                        <TableHead className="text-[11px]">CPL</TableHead>
                        <TableHead className="text-[11px]">Визиты</TableHead>
                        <TableHead className="text-[11px]">Продажи</TableHead>
                        <TableHead className="text-[11px]">Выручка</TableHead>
                        <TableHead className="text-[11px]">ROMI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channels.map((ch) => (
                        <ChannelRow key={ch.id} channel={ch} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="services">
              <ServiceAnalyticsTab />
            </TabsContent>

            <TabsContent value="organic">
              <OrganicTracker posts={organicPosts} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
