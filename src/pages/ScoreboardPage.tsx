import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronLeft, ChevronRight, Download, DollarSign, Eye, Users,
  ArrowRightLeft, ShoppingCart, Target, TrendingUp,
} from "lucide-react";

/* ══════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════ */

const topCards = [
  { label: "Стоимость клиента (CAC)", value: "18 292 ₸", sub: "Расходы / Продажи", icon: DollarSign },
  { label: "Стоимость визита (CPV)", value: "8 261 ₸", sub: "Расходы / Визиты", icon: Eye },
  { label: "Стоимость лида (CPL)", value: "247 ₸", sub: "Расходы / Лиды", icon: Target },
  { label: "CR (Клики → Лиды)", value: "5%", sub: "Лиды / Клики", icon: ArrowRightLeft },
  { label: "CR (Визиты → Продажи)", value: "45%", sub: "Продажи / Визиты", icon: TrendingUp },
];

const columns = [
  { key: "date", label: "Дата", align: "left" as const },
  { key: "spend", label: "Расходы", align: "right" as const },
  { key: "impressions", label: "Показы", align: "right" as const },
  { key: "clicks", label: "Клики", align: "right" as const },
  { key: "leads", label: "Лиды", align: "right" as const },
  { key: "cpl", label: "CPL", align: "right" as const },
  { key: "followers", label: "Подписч.", align: "right" as const },
  { key: "visits", label: "Визиты", align: "right" as const },
  { key: "sales", label: "Оплаты", align: "right" as const },
  { key: "revenue", label: "Выручка", align: "right" as const },
];

const planRow: Record<string, string> = {
  date: "🎯 ПЛАН (Март)",
  spend: "200 000",
  impressions: "100 000",
  clicks: "5 000",
  leads: "300",
  cpl: "667",
  followers: "150",
  visits: "60",
  sales: "10",
  revenue: "5 000 000",
};

const factRow: Record<string, string | number> = {
  date: "📊 ФАКТ",
  spend: "256 118",
  impressions: "138 492",
  clicks: "6 218",
  leads: "1 037",
  cpl: "247",
  followers: "214",
  visits: "31",
  sales: "14",
  revenue: "1 920 000",
};

function pctValue(fact: string | number, plan: string | number): number {
  const f = typeof fact === "number" ? fact : parseInt(String(fact).replace(/\s/g, ""), 10);
  const p = typeof plan === "number" ? plan : parseInt(String(plan).replace(/\s/g, ""), 10);
  if (!p || isNaN(f) || isNaN(p)) return 0;
  return Math.round((f / p) * 100);
}

const pctRow: Record<string, string | number> = (() => {
  const r: Record<string, string | number> = { date: "⚡ % ВЫПОЛН." };
  columns.forEach(col => {
    if (col.key === "date") return;
    r[col.key] = pctValue(factRow[col.key], planRow[col.key]);
  });
  return r;
})();

const dailyData = [
  { date: "01 Ср", spend: "4 692", impressions: "4 137", clicks: "72", leads: "11", cpl: "427", followers: "3", visits: "2", sales: "1", revenue: "180 000" },
  { date: "02 Чт", spend: "34 620", impressions: "17 848", clicks: "772", leads: "140", cpl: "247", followers: "31", visits: "5", sales: "2", revenue: "290 000" },
  { date: "03 Пт", spend: "38 122", impressions: "21 053", clicks: "1 005", leads: "168", cpl: "227", followers: "38", visits: "6", sales: "3", revenue: "350 000" },
  { date: "04 Сб", spend: "35 815", impressions: "19 728", clicks: "892", leads: "148", cpl: "242", followers: "28", visits: "4", sales: "2", revenue: "240 000" },
  { date: "05 Вс", spend: "33 219", impressions: "18 412", clicks: "814", leads: "132", cpl: "252", followers: "22", visits: "3", sales: "1", revenue: "120 000" },
  { date: "06 Пн", spend: "36 880", impressions: "20 140", clicks: "948", leads: "156", cpl: "236", followers: "34", visits: "4", sales: "2", revenue: "260 000" },
  { date: "07 Вт", spend: "38 540", impressions: "19 862", clicks: "920", leads: "152", cpl: "254", followers: "30", visits: "4", sales: "2", revenue: "280 000" },
  { date: "08 Ср", spend: "34 230", impressions: "17 312", clicks: "795", leads: "130", cpl: "263", followers: "28", visits: "3", sales: "1", revenue: "200 000" },
];

/* ══════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════ */

function KpiCard({ card }: { card: typeof topCards[0] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
          <card.icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">{card.label}</span>
      </div>
      <p className="text-xl font-mono font-bold text-foreground tabular-nums tracking-tight">{card.value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
    </div>
  );
}

function PctCell({ value }: { value: number }) {
  const hit = value >= 100;
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`text-xs font-bold font-mono tabular-nums ${hit ? "text-emerald-400" : "text-rose-400"}`}>
        {value}%
      </span>
      <div className="w-full h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${hit ? "bg-emerald-500" : "bg-rose-500"}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function ScoreboardPage() {
  const [monthLabel] = useState("Март 2026");

  return (
    <DashboardLayout breadcrumb="Таблица показателей">
      <div className="space-y-6">
        {/* ── Top KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {topCards.map(c => <KpiCard key={c.label} card={c} />)}
        </div>

        {/* ── Controls Bar ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground px-2 select-none">{monthLabel}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" className="gap-2 text-xs h-8 border-border/50">
            <Download className="h-3.5 w-3.5" />Экспорт таблицы
          </Button>
        </div>

        {/* ── Master Table ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/10 bg-muted/30">
                  {columns.map(col => (
                    <TableHead
                      key={col.key}
                      className={`text-[10px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap px-3 py-3 ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* PLAN row */}
                <TableRow className="bg-blue-500/[0.06] border-border/20 hover:bg-blue-500/[0.08]">
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      className={`px-3 py-3 whitespace-nowrap font-mono text-xs tabular-nums ${col.key === "date" ? "font-semibold text-blue-400 text-left" : "text-right text-blue-400/80"}`}
                    >
                      {planRow[col.key]}
                    </TableCell>
                  ))}
                </TableRow>

                {/* FACT row */}
                <TableRow className="bg-primary/[0.04] border-border/20 hover:bg-primary/[0.06]">
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      className={`px-3 py-3 whitespace-nowrap font-mono text-xs tabular-nums font-bold ${col.key === "date" ? "text-foreground text-left" : "text-right text-foreground"}`}
                    >
                      {factRow[col.key]}
                    </TableCell>
                  ))}
                </TableRow>

                {/* PCT row */}
                <TableRow className="border-b-2 border-border/40 bg-muted/10">
                  {columns.map(col => (
                    <TableCell
                      key={col.key}
                      className={`px-3 py-3 whitespace-nowrap ${col.key === "date" ? "text-left" : "text-right"}`}
                    >
                      {col.key === "date" ? (
                        <span className="text-xs font-semibold text-amber-400 font-mono">{pctRow[col.key]}</span>
                      ) : (
                        <PctCell value={pctRow[col.key] as number} />
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Daily rows */}
                {dailyData.map((row, i) => (
                  <TableRow
                    key={row.date}
                    className={`border-border/10 transition-colors hover:bg-accent/30 ${i % 2 === 0 ? "bg-transparent" : "bg-muted/[0.03]"}`}
                  >
                    {columns.map(col => (
                      <TableCell
                        key={col.key}
                        className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs tabular-nums ${col.key === "date" ? "text-left text-muted-foreground font-medium" : "text-right text-foreground/80"}`}
                      >
                        {(row as Record<string, string>)[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
