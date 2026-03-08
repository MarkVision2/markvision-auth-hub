import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, TrendingUp, DollarSign, BarChart3, Crown, Image, Video, Layers, Film } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { channels, organicPosts, funnelData, channelChartData, formatMoney, formatNum, calcRomi, type Channel, type Campaign } from "@/components/analytics/analyticsData";
import { motion, AnimatePresence } from "framer-motion";

/* ── helpers ── */
const totalSpend = channels.reduce((s, c) => s + c.spend, 0);
const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
const globalRomi = Math.round(((totalRevenue - totalSpend) / totalSpend) * 100);
const topChannel = channels.reduce((best, c) => {
  const r = c.spend > 0 ? ((c.revenue - c.spend) / c.spend) * 100 : Infinity;
  const bestR = best.spend > 0 ? ((best.revenue - best.spend) / best.spend) * 100 : Infinity;
  return r > bestR ? c : best;
}, channels[0]);

const formatIcons: Record<string, React.ReactNode> = {
  Video: <Video className="h-3.5 w-3.5" />,
  Photo: <Image className="h-3.5 w-3.5" />,
  Carousel: <Layers className="h-3.5 w-3.5" />,
  Reel: <Film className="h-3.5 w-3.5" />,
};

/* ── KPI Card ── */
function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[12px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-[12px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ── Funnel ── */
function FunnelVis() {
  return (
    <div className="glass rounded-xl p-6 h-full">
      <h3 className="text-[13px] font-semibold text-foreground mb-5 uppercase tracking-wider">Воронка конверсий</h3>
      <div className="space-y-3">
        {funnelData.map((step, i) => {
          const maxVal = funnelData[0].value;
          const width = Math.max((step.value / maxVal) * 100, 8);
          const dropoff = i > 0 ? ((1 - step.value / funnelData[i - 1].value) * 100).toFixed(1) : null;
          return (
            <div key={step.stage}>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-muted-foreground">{step.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{step.label}</span>
                  {dropoff && <span className="text-destructive text-[11px]">-{dropoff}%</span>}
                </div>
              </div>
              <div className="h-7 rounded-md bg-white/[0.03] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-full rounded-md"
                  style={{
                    background: `linear-gradient(90deg, hsl(160, 84%, 36%) 0%, hsl(160, 84%, 26%) 100%)`,
                    opacity: 1 - i * 0.15,
                  }}
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
function ChannelChart() {
  return (
    <div className="glass rounded-xl p-6 h-full">
      <h3 className="text-[13px] font-semibold text-foreground mb-5 uppercase tracking-wider">Расход vs Выручка по каналам</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={channelChartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,100%,0.04)" />
          <XAxis dataKey="name" tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(0,0%,55%)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatMoney(v)} />
          <Tooltip
            contentStyle={{ background: "hsl(0,0%,4%)", border: "1px solid hsl(0,0%,100%,0.1)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "hsl(0,0%,70%)" }}
            formatter={(value: number) => [formatMoney(value)]}
          />
          <Bar dataKey="spend" name="Расход" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {channelChartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.35} />
            ))}
          </Bar>
          <Bar dataKey="revenue" name="Выручка" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {channelChartData.map((entry, i) => (
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
  return (
    <>
      <TableRow className="cursor-pointer hover:bg-white/[0.02] border-white/[0.04]" onClick={() => setOpen(!open)}>
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
  return (
    <>
      <motion.tr
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="cursor-pointer hover:bg-white/[0.02] border-b border-white/[0.04]"
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
        <TableCell className="tabular-nums text-[13px]">{formatNum(campaign.visits)}</TableCell>
        <TableCell className="tabular-nums text-[13px]">{formatNum(campaign.sales)}</TableCell>
        <TableCell className="tabular-nums text-[13px] font-medium">{formatMoney(campaign.revenue)}</TableCell>
        <TableCell><Badge variant="outline" className="text-[11px] border-white/10">{romi}</Badge></TableCell>
      </motion.tr>
      <AnimatePresence>
        {open && campaign.creatives.map((cr) => (
          <motion.tr
            key={cr.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-b border-white/[0.03] bg-white/[0.01]"
          >
            <TableCell className="pl-[72px] text-[12px]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted-foreground">
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
            <TableCell className="tabular-nums text-[12px]">{formatNum(cr.visits)}</TableCell>
            <TableCell className="tabular-nums text-[12px]">{formatNum(cr.sales)}</TableCell>
            <TableCell className="tabular-nums text-[12px] font-medium">{formatMoney(cr.revenue)}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[10px] border-white/10">{calcRomi(cr.revenue, cr.spend)}</Badge>
            </TableCell>
          </motion.tr>
        ))}
      </AnimatePresence>
    </>
  );
}

/* ── Organic Table ── */
function OrganicTracker() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-5 border-b border-white/[0.04]">
        <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">Контент-Завод → Продажи</h3>
        <p className="text-[12px] text-muted-foreground mt-1">Органические посты с кодовыми словами</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.04] hover:bg-transparent">
            <TableHead className="text-[11px]">Пост</TableHead>
            <TableHead className="text-[11px]">Кодовое слово</TableHead>
            <TableHead className="text-[11px] text-right">DMs</TableHead>
            <TableHead className="text-[11px] text-right">Лиды</TableHead>
            <TableHead className="text-[11px] text-right">Продажи</TableHead>
            <TableHead className="text-[11px] text-right">Выручка</TableHead>
            <TableHead className="text-[11px] text-right">LTV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organicPosts.map((post) => (
            <TableRow key={post.id} className="border-white/[0.04]">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-lg">
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
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function AnalyticsPage() {
  return (
    <DashboardLayout breadcrumb="Сквозная аналитика">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Сквозная аналитика</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">End-to-End: от креатива до кассы</p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="clinic-almaty">
              <SelectTrigger className="w-[180px] h-9 text-[13px] glass border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinic-almaty">Клиника Алматы</SelectItem>
                <SelectItem value="clinic-astana">Клиника Астана</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="march">
              <SelectTrigger className="w-[140px] h-9 text-[13px] glass border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="march">Март 2026</SelectItem>
                <SelectItem value="feb">Февраль 2026</SelectItem>
                <SelectItem value="q1">Q1 2026</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="last-click">
              <SelectTrigger className="w-[150px] h-9 text-[13px] glass border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-click">Last Click</SelectItem>
                <SelectItem value="first-click">First Click</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Общий расход" value={formatMoney(totalSpend)} sub="все каналы" />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Общая выручка" value={formatMoney(totalRevenue)} sub={`${formatNum(channels.reduce((s, c) => s + c.sales, 0))} продаж`} />
          <KpiCard icon={<BarChart3 className="h-4 w-4" />} label="ROMI" value={`${globalRomi}%`} sub="глобальный показатель" />
          <KpiCard icon={<Crown className="h-4 w-4" />} label="Топ канал" value={topChannel.name} sub={`ROMI ${calcRomi(topChannel.revenue, topChannel.spend)}`} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChannelChart />
          <FunnelVis />
        </div>

        {/* Tabs: Drill-down + Organic */}
        <Tabs defaultValue="drilldown" className="space-y-4">
          <TabsList className="glass border border-white/[0.06]">
            <TabsTrigger value="drilldown" className="text-[13px]">Детализация по каналам</TabsTrigger>
            <TabsTrigger value="organic" className="text-[13px]">Органика & Контент</TabsTrigger>
          </TabsList>

          <TabsContent value="drilldown">
            <div className="glass rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.04] hover:bg-transparent">
                    <TableHead className="text-[11px] w-[260px]">Название</TableHead>
                    <TableHead className="text-[11px]">Формат</TableHead>
                    <TableHead className="text-[11px]">Сайт</TableHead>
                    <TableHead className="text-[11px]">Расходы</TableHead>
                    <TableHead className="text-[11px]">Клики</TableHead>
                    <TableHead className="text-[11px]">Лиды</TableHead>
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
          </TabsContent>

          <TabsContent value="organic">
            <OrganicTracker />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
