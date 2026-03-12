import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight, ChevronDown, TrendingUp, DollarSign, BarChart3, Crown,
  Image, Video, Layers, Film, Inbox, Users, Target, Eye, ShoppingCart, Zap,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatMoney, formatNum, calcRomi, type Channel, type Campaign } from "@/components/analytics/analyticsData";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceAnalyticsTab } from "@/components/analytics/ServiceAnalyticsTab";

const formatIcons: Record<string, React.ReactNode> = {
  Video: <Video className="h-3.5 w-3.5" />,
  Photo: <Image className="h-3.5 w-3.5" />,
  Carousel: <Layers className="h-3.5 w-3.5" />,
  Reel: <Film className="h-3.5 w-3.5" />,
};

/* ── KPI Card (upgraded) ── */
function KpiCard({
  icon, label, value, sub, accent = false,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-2 transition-all group hover:shadow-lg ${accent
      ? "border-primary/25 bg-primary/[0.04] hover:shadow-primary/5"
      : "border-border bg-card hover:border-primary/20"
      }`}>
      <div className="flex items-center gap-2">
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${accent ? "bg-primary/15 text-primary" : "bg-secondary border border-border text-muted-foreground"
          }`}>
          {icon}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
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
    <div className="rounded-2xl border border-border bg-card p-6 h-full">
      <h3 className="text-[13px] font-semibold text-foreground mb-5 uppercase tracking-wider">Воронка конверсий</h3>
      <div className="space-y-3">
        {funnelData.map((step, i) => {
          const maxVal = funnelData[0].value || 1;
          const width = Math.max((step.value / maxVal) * 100, 8);
          const dropoff = i > 0 && funnelData[i - 1].value > 0 ? ((1 - step.value / funnelData[i - 1].value) * 100).toFixed(1) : null;
          return (
            <div key={step.stage}>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-muted-foreground">{step.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground tabular-nums">{step.label}</span>
                  {dropoff && <span className="text-destructive text-[11px] tabular-nums">−{dropoff}%</span>}
                </div>
              </div>
              <div className="h-7 rounded-lg bg-secondary/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-lg bg-primary/20 border-r-2 border-primary"
                  style={{ opacity: 1 - i * 0.12 }}
                />
              </div>
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
    <div className="rounded-2xl border border-border bg-card p-6 h-full">
      <h3 className="text-[13px] font-semibold text-foreground mb-5 uppercase tracking-wider">Расход vs Выручка по каналам</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
          <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: any) => formatMoney(v)} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
            formatter={(value: number, name: string) => [formatMoney(value), name === "spend" ? "Расход" : "Выручка"]}
          />
          <Bar dataKey="spend" name="Расход" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.3} />
            ))}
          </Bar>
          <Bar dataKey="revenue" name="Выручка" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">Контент-Завод → Продажи</h3>
        <p className="text-[12px] text-muted-foreground mt-1">Органические посты с кодовыми словами</p>
      </div>
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Inbox className="h-10 w-10 opacity-40" />
          <p className="text-sm">Нет данных по органике</p>
          <p className="text-xs text-muted-foreground/60">Добавьте посты в таблицу analytics_organic_posts</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[11px]">Пост</TableHead>
              <TableHead className="text-[11px]">Кодовое слово</TableHead>
              <TableHead className="text-[11px] text-right">Сообщения</TableHead>
              <TableHead className="text-[11px] text-right">Лиды</TableHead>
              <TableHead className="text-[11px] text-right">Продажи</TableHead>
              <TableHead className="text-[11px] text-right">Выручка</TableHead>
              <TableHead className="text-[11px] text-right">LTV</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-lg">
                      {post.thumbnail}
                    </div>
                    <span className="text-[12px] text-foreground max-w-[200px] truncate">{post.caption}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px] font-mono">{post.triggerWord}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-[12px]">{formatNum(post.dms)}</TableCell>
                <TableCell className="text-right tabular-nums text-[12px]">{formatNum(post.leads)}</TableCell>
                <TableCell className="text-right tabular-nums text-[12px] font-medium">{formatNum(post.sales)}</TableCell>
                <TableCell className="text-right tabular-nums text-[12px] font-semibold text-foreground">{formatMoney(post.revenue)}</TableCell>
                <TableCell className="text-right tabular-nums text-[12px]">{formatMoney(post.ltv)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
  } = useAnalyticsData();

  return (
    <DashboardLayout breadcrumb="Сквозная аналитика">
      {loading ? (
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
            <div className="flex items-center gap-3">
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
            <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Расход" value={formatMoney(totalSpend)} sub="за текущий месяц" />
            <KpiCard icon={<Users className="h-4 w-4" />} label="Лиды" value={formatNum(totalLeads)} sub={`${totalLeadsFromCrm} всего в CRM`} />
            <KpiCard icon={<Target className="h-4 w-4" />} label="CPL" value={cpl > 0 ? formatMoney(cpl) : "—"} sub="стоимость лида" accent={cpl > 0} />
            <KpiCard icon={<Eye className="h-4 w-4" />} label="Визиты" value={formatNum(totalVisits)} sub={cpv > 0 ? `CPV: ${formatMoney(cpv)}` : "нет данных"} />
            <KpiCard icon={<ShoppingCart className="h-4 w-4" />} label="Продажи" value={formatNum(totalSales)} sub={cac > 0 ? `CAC: ${formatMoney(cac)}` : "нет данных"} />
            <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Выручка" value={formatMoney(totalRevenue)} />
            <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="ROMI" value={totalSpend > 0 ? `${globalRomi}%` : "—"} sub={topChannel ? `Топ: ${topChannel.name}` : ""} accent={globalRomi > 0} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChannelChart chartData={channelChartData} />
            <FunnelVis funnelData={funnelData} />
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
