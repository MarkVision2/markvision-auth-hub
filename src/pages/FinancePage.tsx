import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Calculator, TrendingUp, DollarSign, Percent, ArrowRight, Wallet, PiggyBank, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

/* ── Formatting ── */
function fmtCurrency(v: number): string {
  return v.toLocaleString("ru-RU").replace(/,/g, " ") + " ₸";
}
function fmtNum(v: number): string {
  return Math.round(v).toLocaleString("ru-RU");
}

/* ══════════════════════════════════════════════
   TAB 1 — ДЕКОМПОЗИЦИЯ ЦЕЛИ
   ══════════════════════════════════════════════ */

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  format?: (v: number) => string;
}

function SliderField({ label, value, onChange, min, max, step, suffix = "", format }: SliderFieldProps) {
  const display = format ? format(value) : `${value.toLocaleString("ru-RU")}${suffix}`;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[13px] text-muted-foreground font-medium">{label}</label>
        <span className="text-[14px] font-semibold text-foreground tabular-nums">{display}</span>
      </div>
      <div className="flex items-center gap-4">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <Input
          type="number"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          className="w-[110px] h-9 text-[13px] tabular-nums glass border-white/10 text-right"
        />
      </div>
    </div>
  );
}

function ResultRow({ label, value, highlight, sub }: { label: string; value: string; highlight?: boolean; sub?: string }) {
  return (
    <div className={`flex items-center justify-between py-3 ${highlight ? "" : "border-b border-white/[0.04]"}`}>
      <div>
        <span className={`text-[13px] ${highlight ? "font-bold text-foreground" : "text-muted-foreground"}`}>{label}</span>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <span className={`tabular-nums font-semibold ${highlight ? "text-xl text-primary" : "text-[15px] text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function DecompositionTab() {
  const [revenue, setRevenue] = useState(10_000_000);
  const [avgCheck, setAvgCheck] = useState(150_000);
  const [closeRate, setCloseRate] = useState(20);
  const [optInRate, setOptInRate] = useState(5);
  const [cpc, setCpc] = useState(150);

  const calc = useMemo(() => {
    const sales = revenue / avgCheck;
    const leads = sales / (closeRate / 100);
    const clicks = leads / (optInRate / 100);
    const adSpend = clicks * cpc;
    const romi = adSpend > 0 ? ((revenue - adSpend) / adSpend) * 100 : 0;
    const cpl = leads > 0 ? adSpend / leads : 0;
    const cps = sales > 0 ? adSpend / sales : 0;
    return { sales, leads, clicks, adSpend, romi, cpl, cps };
  }, [revenue, avgCheck, closeRate, optInRate, cpc]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT — Inputs */}
      <div className="glass rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-foreground">Параметры</h3>
        </div>

        <SliderField label="Желаемая выручка (₸)" value={revenue} onChange={setRevenue} min={500_000} max={100_000_000} step={500_000} format={fmtCurrency} />
        <SliderField label="Средний чек (₸)" value={avgCheck} onChange={setAvgCheck} min={5_000} max={2_000_000} step={5_000} format={fmtCurrency} />
        <SliderField label="Конверсия в продажу (%)" value={closeRate} onChange={setCloseRate} min={1} max={100} step={1} suffix="%" />
        <SliderField label="Конверсия клик → лид (%)" value={optInRate} onChange={setOptInRate} min={1} max={50} step={0.5} suffix="%" />
        <SliderField label="Цена клика — CPC (₸)" value={cpc} onChange={setCpc} min={10} max={2_000} step={10} format={(v) => fmtCurrency(v)} />
      </div>

      {/* RIGHT — Results */}
      <div className="space-y-4">
        {/* Hero card — Ad Spend */}
        <motion.div
          key={calc.adSpend}
          initial={{ scale: 0.98, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/[0.04] pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">🛑 Рекламный бюджет</p>
          <p className="text-3xl font-bold text-primary tabular-nums">{fmtCurrency(Math.round(calc.adSpend))}</p>
          <p className="text-[12px] text-muted-foreground mt-1">Необходимо для достижения цели</p>
        </motion.div>

        {/* Funnel visual */}
        <div className="glass rounded-xl p-6">
          <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold mb-4">Визуализация воронки</p>
          <div className="flex items-center justify-between gap-2">
            {[
              { label: "Клики", value: fmtNum(calc.clicks) },
              { label: "Лиды", value: fmtNum(calc.leads) },
              { label: "Продажи", value: fmtNum(calc.sales) },
              { label: "Выручка", value: fmtCurrency(revenue) },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <div className="glass rounded-lg p-3 flex-1 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{step.label}</p>
                  <p className="text-[14px] font-bold text-foreground tabular-nums mt-1">{step.value}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail rows */}
        <div className="glass rounded-xl p-6">
          <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Юнит-экономика</p>
          <ResultRow label="Нужно продаж" value={fmtNum(calc.sales)} />
          <ResultRow label="Нужно лидов" value={fmtNum(calc.leads)} />
          <ResultRow label="Нужно кликов" value={fmtNum(calc.clicks)} />
          <ResultRow label="Стоимость лида (CPL)" value={fmtCurrency(Math.round(calc.cpl))} sub="бюджет / лиды" />
          <ResultRow label="Стоимость продажи (CPS)" value={fmtCurrency(Math.round(calc.cps))} sub="бюджет / продажи" />
          <ResultRow label="ROMI" value={`${Math.round(calc.romi)}%`} highlight sub="(выручка − бюджет) / бюджет × 100" />
        </div>

        <Button className="w-full h-11 text-[13px] font-semibold gap-2">
          <Save className="h-4 w-4" /> Сохранить медиаплан
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB 2 — АГЕНТСКАЯ АНАЛИТИКА
   ══════════════════════════════════════════════ */

interface ClientFinance {
  id: string;
  name: string;
  service: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  nextBilling: string;
  billingStatus: "paid" | "upcoming" | "overdue";
}

const clients: ClientFinance[] = [
  { id: "1", name: "Технология позвоночника", service: "AI-Marketing OS", revenue: 300_000, expenses: 25_000, profit: 275_000, margin: 91, nextBilling: "2026-04-01", billingStatus: "paid" },
  { id: "2", name: "DentalPro Алматы", service: "AI-Marketing OS + Content", revenue: 450_000, expenses: 48_000, profit: 402_000, margin: 89, nextBilling: "2026-03-11", billingStatus: "upcoming" },
  { id: "3", name: "EsteticLine", service: "Lead Gen + CRM", revenue: 200_000, expenses: 18_000, profit: 182_000, margin: 91, nextBilling: "2026-03-05", billingStatus: "overdue" },
  { id: "4", name: "MedCity Астана", service: "AI-Marketing OS", revenue: 300_000, expenses: 32_000, profit: 268_000, margin: 89, nextBilling: "2026-04-15", billingStatus: "paid" },
  { id: "5", name: "SmileLab", service: "Content Factory", revenue: 150_000, expenses: 12_000, profit: 138_000, margin: 92, nextBilling: "2026-03-20", billingStatus: "paid" },
  { id: "6", name: "Клиника Доктора Иванова", service: "AI-Marketing OS + Spy", revenue: 380_000, expenses: 41_000, profit: 339_000, margin: 89, nextBilling: "2026-03-08", billingStatus: "overdue" },
  { id: "7", name: "BeautyMed", service: "Lead Gen", revenue: 120_000, expenses: 9_500, profit: 110_500, margin: 92, nextBilling: "2026-04-10", billingStatus: "paid" },
];

const totalMrr = clients.reduce((s, c) => s + c.revenue, 0);
const totalProfit = clients.reduce((s, c) => s + c.profit, 0);
const avgMargin = Math.round(clients.reduce((s, c) => s + c.margin, 0) / clients.length);

const billingLabels: Record<string, { text: string; cls: string }> = {
  paid: { text: "Оплачено", cls: "bg-primary/10 text-primary border-primary/20" },
  upcoming: { text: "Ожидается", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  overdue: { text: "Просрочено", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

function AgencyKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[12px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
    </div>
  );
}

function AgencyTab() {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AgencyKpi icon={<Wallet className="h-4 w-4" />} label="MRR (ежемесячная выручка)" value={fmtCurrency(totalMrr)} />
        <AgencyKpi icon={<PiggyBank className="h-4 w-4" />} label="Чистая прибыль" value={fmtCurrency(totalProfit)} />
        <AgencyKpi icon={<BarChart3 className="h-4 w-4" />} label="Средняя маржинальность" value={`${avgMargin}%`} />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04] hover:bg-transparent">
              <TableHead className="text-[11px]">Клиент</TableHead>
              <TableHead className="text-[11px]">Услуга</TableHead>
              <TableHead className="text-[11px] text-right">Оплата</TableHead>
              <TableHead className="text-[11px] text-right">Расходы</TableHead>
              <TableHead className="text-[11px] text-right">Прибыль</TableHead>
              <TableHead className="text-[11px] text-right">Маржа</TableHead>
              <TableHead className="text-[11px]">След. оплата</TableHead>
              <TableHead className="text-[11px]">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => {
              const bl = billingLabels[c.billingStatus];
              return (
                <TableRow key={c.id} className="border-white/[0.04]">
                  <TableCell className="font-medium text-[13px] text-foreground">{c.name}</TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{c.service}</TableCell>
                  <TableCell className="text-right tabular-nums text-[13px] font-medium">{fmtCurrency(c.revenue)}</TableCell>
                  <TableCell className="text-right tabular-nums text-[13px] text-destructive">{fmtCurrency(c.expenses)}</TableCell>
                  <TableCell className="text-right tabular-nums text-[13px] font-semibold text-primary">{fmtCurrency(c.profit)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-[11px] border-primary/20 text-primary">{c.margin}%</Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground tabular-nums">{c.nextBilling}</TableCell>
                  <TableCell>
                    <Badge className={`text-[11px] border ${bl.cls}`}>{bl.text}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function FinancePage() {
  return (
    <DashboardLayout breadcrumb="Финансы">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-xl font-bold text-foreground">Финансы</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Юнит-экономика и агентская P&L</p>
        </div>

        <Tabs defaultValue="decomposition" className="space-y-5">
          <TabsList className="glass border border-white/[0.06]">
            <TabsTrigger value="decomposition" className="text-[13px] gap-1.5">
              <Calculator className="h-3.5 w-3.5" /> Декомпозиция цели
            </TabsTrigger>
            <TabsTrigger value="agency" className="text-[13px] gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Агентская аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="decomposition">
            <DecompositionTab />
          </TabsContent>

          <TabsContent value="agency">
            <AgencyTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
