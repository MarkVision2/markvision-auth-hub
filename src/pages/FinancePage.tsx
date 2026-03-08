import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Save, Calculator, DollarSign, ArrowRight, Wallet, PiggyBank, BarChart3, Plus, Trash2, Download, Users, UserPlus, X, TrendingUp, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

/* ── Formatting ── */
function fmt(v: number): string {
  return Math.round(v).toLocaleString("ru-RU").replace(/,/g, " ");
}
function fmtCurrency(v: number): string {
  return fmt(v) + " ₸";
}

/* ── Reusable input field ── */
function NumField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[12px] text-muted-foreground">{label}</label>
        <span className="text-[12px] font-semibold text-foreground tabular-nums">{fmt(value)}{suffix}</span>
      </div>
      <Input
        type="number"
        value={value || ""}
        onChange={(e) => { const n = Number(e.target.value); if (!isNaN(n)) onChange(Math.max(0, n)); }}
        className="h-9 text-[13px] tabular-nums bg-white/[0.03] border-white/[0.06] focus:border-primary/40"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB 1 — ДЕКОМПОЗИЦИЯ ЦЕЛИ
   ══════════════════════════════════════════════ */

interface Product { name: string; check: number; share: number; }
interface Expense { name: string; value: number; isPercent: boolean; }

function DecompositionTab() {
  // Mode
  const [mode, setMode] = useState<"revenue" | "profit">("revenue");

  // Target metrics
  const [targetRevenue, setTargetRevenue] = useState(1_000_000);
  const [targetProfit, setTargetProfit] = useState(200_000);

  // Marketing
  const [cpl, setCpl] = useState(300);
  const [cr1, setCr1] = useState(2);
  const [cr2, setCr2] = useState(10);

  // Products
  const [products, setProducts] = useState<Product[]>([
    { name: "Основной товар", check: 5000, share: 100 },
  ]);

  // Expenses
  const [fixExpenses, setFixExpenses] = useState<Expense[]>([
    { name: "Офис", value: 50000, isPercent: false },
    { name: "ФОТ", value: 100000, isPercent: false },
  ]);
  const [varExpenses, setVarExpenses] = useState<Expense[]>([
    { name: "Налоги", value: 6, isPercent: true },
    { name: "Эквайринг", value: 2.5, isPercent: true },
  ]);

  // Calculations
  const calc = useMemo(() => {
    const avgCheck = products.reduce((s, p) => s + p.check * (p.share / 100), 0);
    const revenue = targetRevenue;
    const sales = avgCheck > 0 ? revenue / avgCheck : 0;
    const leads = cr2 > 0 ? sales / (cr2 / 100) : 0;
    const impressions = cr1 > 0 ? leads / (cr1 / 100) : 0;
    const marketingSpend = leads * cpl;

    const fixTotal = fixExpenses.reduce((s, e) => s + (e.isPercent ? revenue * e.value / 100 : e.value), 0);
    const varTotal = varExpenses.reduce((s, e) => s + (e.isPercent ? revenue * e.value / 100 : e.value), 0);
    const totalExpenses = marketingSpend + fixTotal + varTotal;
    const netProfit = revenue - totalExpenses;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const romiMarketing = marketingSpend > 0 ? ((revenue - marketingSpend) / marketingSpend) * 100 : 0;
    const roiAll = totalExpenses > 0 ? ((revenue - totalExpenses) / totalExpenses) * 100 : 0;

    const cacMarketing = sales > 0 ? marketingSpend / sales : 0;
    const cacFull = sales > 0 ? (marketingSpend + fixTotal) / sales : 0;
    const marginPerClient = avgCheck - cacFull;

    return { avgCheck, revenue, sales, leads, impressions, marketingSpend, fixTotal, varTotal, totalExpenses, netProfit, margin, romiMarketing, roiAll, cacMarketing, cacFull, marginPerClient };
  }, [targetRevenue, cpl, cr1, cr2, products, fixExpenses, varExpenses]);

  const updateProduct = (i: number, field: keyof Product, val: string | number) => {
    setProducts(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: typeof val === "string" ? val : val } : p));
  };
  const addProduct = () => setProducts(prev => [...prev, { name: `Товар ${prev.length + 1}`, check: 0, share: 0 }]);
  const removeProduct = (i: number) => setProducts(prev => prev.filter((_, idx) => idx !== i));

  const addFix = () => setFixExpenses(prev => [...prev, { name: "Новый расход", value: 0, isPercent: false }]);
  const addVar = () => setVarExpenses(prev => [...prev, { name: "Новый расход", value: 0, isPercent: true }]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      {/* ═══ LEFT PANEL — Inputs ═══ */}
      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
        {/* Mode selector */}
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Режим расчета</p>
          <div className="grid grid-cols-2 gap-1 glass rounded-lg p-1">
            <button onClick={() => setMode("revenue")} className={`text-[12px] font-medium py-2 rounded-md transition-colors ${mode === "revenue" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              От Выручки
            </button>
            <button onClick={() => setMode("profit")} className={`text-[12px] font-medium py-2 rounded-md transition-colors ${mode === "profit" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              От Прибыли
            </button>
          </div>
        </div>

        {/* Target Metrics */}
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Целевые метрики</p>
          <div className="space-y-3">
            <NumField label="Целевая Выручка" value={targetRevenue} onChange={setTargetRevenue} />
            <NumField label="Целевая Прибыль" value={targetProfit} onChange={setTargetProfit} />
          </div>
        </div>

        {/* Marketing */}
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Маркетинг</p>
          <div className="space-y-3">
            <NumField label="CPL (Стоимость лида)" value={cpl} onChange={setCpl} />
            <NumField label="CR1: Просмотр → Лид" value={cr1} onChange={setCr1} suffix="%" />
            <NumField label="CR2: Лид → Продажа" value={cr2} onChange={setCr2} suffix="%" />
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Товары / Услуги</p>
            <button onClick={addProduct} className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              <Plus className="h-3 w-3" /> Товар
            </button>
          </div>
          {products.map((p, i) => (
            <div key={i} className="glass rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <Input
                  value={p.name}
                  onChange={(e) => updateProduct(i, "name", e.target.value)}
                  className="h-7 text-[12px] font-medium bg-transparent border-none p-0 focus-visible:ring-0"
                />
                {products.length > 1 && (
                  <button onClick={() => removeProduct(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground">Чек</label>
                  <Input type="number" value={p.check || ""} onChange={(e) => updateProduct(i, "check", Number(e.target.value))} className="h-8 text-[12px] tabular-nums bg-white/[0.03] border-white/[0.06]" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Доля %</label>
                  <Input type="number" value={p.share || ""} onChange={(e) => updateProduct(i, "share", Number(e.target.value))} className="h-8 text-[12px] tabular-nums bg-white/[0.03] border-white/[0.06]" />
                </div>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground text-center mt-1">Средний чек: {fmt(calc.avgCheck)}</p>
        </div>

        {/* Expenses Fix/Var */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Расходы (Fix/Var)</p>
            <div className="flex gap-2">
              <button onClick={addFix} className="text-[11px] text-primary hover:text-primary/80 font-medium">+ Fix</button>
              <button onClick={addVar} className="text-[11px] text-destructive hover:text-destructive/80 font-medium">+ Var</button>
            </div>
          </div>
          {fixExpenses.map((e, i) => (
            <div key={`fix-${i}`} className="flex items-center gap-2 mb-2">
              <Input value={e.name} onChange={(ev) => setFixExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, name: ev.target.value } : x))} className="h-8 text-[12px] flex-1 bg-transparent border-white/[0.06]" />
              <Input type="number" value={e.value || ""} onChange={(ev) => setFixExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, value: Number(ev.target.value) } : x))} className="h-8 text-[12px] w-[100px] tabular-nums bg-white/[0.03] border-white/[0.06] text-right" />
              <button onClick={() => setFixExpenses(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
          {varExpenses.map((e, i) => (
            <div key={`var-${i}`} className="flex items-center gap-2 mb-2">
              <Input value={e.name} onChange={(ev) => setVarExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, name: ev.target.value } : x))} className="h-8 text-[12px] flex-1 bg-transparent border-white/[0.06]" />
              <div className="flex items-center gap-1">
                <Input type="number" value={e.value || ""} onChange={(ev) => setVarExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, value: Number(ev.target.value) } : x))} className="h-8 text-[12px] w-[80px] tabular-nums bg-white/[0.03] border-white/[0.06] text-right" />
                <span className="text-[11px] text-muted-foreground">%</span>
              </div>
              <button onClick={() => setVarExpenses(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Results ═══ */}
      <div className="space-y-5">
        {/* Top 3 KPI cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-5 border-l-2 border-l-primary">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Чистая прибыль</p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-1">{fmt(calc.netProfit)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">После всех расходов</p>
          </div>
          <div className="glass rounded-xl p-5 border-l-2 border-l-white/20">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Выручка</p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-1">{fmt(calc.revenue)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{fmt(calc.sales)} продаж · {calc.margin.toFixed(1)}% маржа</p>
          </div>
          <div className="glass rounded-xl p-5 border-l-2 border-l-white/20">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">ROI / ROMI</p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-1">{Math.round(calc.romiMarketing)}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">ROMI на маркетинг · ROI (все расх.): {Math.round(calc.roiAll)}%</p>
          </div>
        </div>

        {/* Funnel */}
        <div className="glass rounded-xl p-6">
          <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold mb-4 flex items-center gap-1.5">↗ Визуализация воронки</p>
          <div className="flex items-center justify-between gap-2">
            {[
              { label: "Просмотры", value: fmt(calc.impressions), sub: null, highlight: false },
              { label: "Лиды", value: fmt(calc.leads), sub: `по ${fmt(cpl)}`, highlight: false },
              { label: "Продажи", value: fmt(calc.sales), sub: `чек ${fmt(calc.avgCheck)}`, highlight: true },
              { label: "Деньги", value: fmt(calc.revenue), sub: null, highlight: true },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <div className={`rounded-lg p-3 flex-1 text-center border ${step.highlight ? "border-primary/30 bg-primary/[0.04]" : "glass"}`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{step.label}</p>
                  <p className={`text-[16px] font-bold tabular-nums mt-1 ${step.highlight ? "text-primary" : "text-foreground"}`}>{step.value}</p>
                  {step.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{step.sub}</p>}
                </div>
                {i < arr.length - 1 && (
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[10px] text-primary font-semibold">{i === 0 ? `${cr1}%` : i === 1 ? `${cr2}%` : ""}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Unit Economics + Expense Structure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Unit Economics */}
          <div className="glass rounded-xl p-6">
            <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold mb-4">Юнит-экономика (на 1 клиента)</p>
            <div className="space-y-0">
              <div className="flex justify-between py-3 border-b border-white/[0.04]">
                <div>
                  <p className="text-[13px] text-foreground">CAC (маркетинг)</p>
                  <p className="text-[11px] text-muted-foreground">только стоимость лида</p>
                </div>
                <span className="text-[15px] font-semibold text-foreground tabular-nums">{fmt(calc.cacMarketing)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/[0.04]">
                <div>
                  <p className="text-[13px] text-foreground">CAC (полный)</p>
                  <p className="text-[11px] text-muted-foreground">маркетинг + постоянные</p>
                </div>
                <span className="text-[15px] font-semibold text-foreground tabular-nums">{fmt(calc.cacFull)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/[0.04]">
                <p className="text-[13px] text-foreground">Средний чек</p>
                <span className="text-[15px] font-semibold text-foreground tabular-nums">{fmt(calc.avgCheck)}</span>
              </div>
              <div className="flex justify-between py-3 bg-primary/[0.04] rounded-lg px-3 -mx-3 mt-2">
                <div>
                  <p className="text-[13px] text-primary font-medium">Маржа (до переменных)</p>
                  <p className="text-[11px] text-muted-foreground">чек − полный CAC</p>
                </div>
                <span className="text-[15px] font-bold text-primary tabular-nums">{fmt(calc.marginPerClient)}</span>
              </div>
            </div>
          </div>

          {/* Expense Structure */}
          <div className="glass rounded-xl p-6">
            <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold mb-4">Структура расходов</p>
            <div className="space-y-4">
              {/* Marketing bar */}
              <div>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-foreground">Маркетинг</span>
                  <span className="font-semibold tabular-nums text-foreground">{fmt(calc.marketingSpend)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${calc.totalExpenses > 0 ? (calc.marketingSpend / calc.totalExpenses) * 100 : 0}%` }} />
                </div>
              </div>
              {/* Fix bar */}
              <div>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-foreground">Постоянные (Fix)</span>
                  <span className="font-semibold tabular-nums text-foreground">{fmt(calc.fixTotal)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500/70" style={{ width: `${calc.totalExpenses > 0 ? (calc.fixTotal / calc.totalExpenses) * 100 : 0}%` }} />
                </div>
              </div>
              {/* Var bar */}
              <div>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-foreground">Переменные (Var)</span>
                  <span className="font-semibold tabular-nums text-foreground">{fmt(calc.varTotal)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-destructive/70" style={{ width: `${calc.totalExpenses > 0 ? (calc.varTotal / calc.totalExpenses) * 100 : 0}%` }} />
                </div>
              </div>
              {/* Total */}
              <div className="flex justify-between text-[13px] pt-3 border-t border-white/[0.06]">
                <span className="font-semibold text-foreground">Всего расходов</span>
                <span className="font-bold tabular-nums text-foreground">{fmt(calc.totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1 h-10 text-[13px] font-semibold gap-2">
            <Save className="h-4 w-4" /> Сохранить медиаплан
          </Button>
          <Button variant="outline" className="h-10 text-[13px] gap-2 glass border-white/10">
            <Download className="h-4 w-4" /> Excel
          </Button>
        </div>
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
  services: string[];
  revenue: number;
  expenses: number;
  nextBilling: string;
  billingStatus: "paid" | "upcoming" | "overdue";
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  salary: number;
}

const defaultServices = ["Таргет", "СММ", "Маркетинг", "Контент", "SEO", "Разработка", "Дизайн", "CRM"];

const initialClients: ClientFinance[] = [
  { id: "1", name: "Технология позвоночника", services: ["Таргет", "СММ"], revenue: 300_000, expenses: 25_000, nextBilling: "2026-04-01", billingStatus: "paid" },
  { id: "2", name: "DentalPro Алматы", services: ["Маркетинг", "Контент", "Таргет"], revenue: 450_000, expenses: 48_000, nextBilling: "2026-03-11", billingStatus: "upcoming" },
  { id: "3", name: "EsteticLine", services: ["Таргет", "CRM"], revenue: 200_000, expenses: 18_000, nextBilling: "2026-03-05", billingStatus: "overdue" },
  { id: "4", name: "MedCity Астана", services: ["Маркетинг"], revenue: 300_000, expenses: 32_000, nextBilling: "2026-04-15", billingStatus: "paid" },
  { id: "5", name: "SmileLab", services: ["Контент"], revenue: 150_000, expenses: 12_000, nextBilling: "2026-03-20", billingStatus: "paid" },
  { id: "6", name: "Клиника Доктора Иванова", services: ["Таргет", "СММ", "SEO"], revenue: 380_000, expenses: 41_000, nextBilling: "2026-03-08", billingStatus: "overdue" },
  { id: "7", name: "BeautyMed", services: ["Таргет"], revenue: 120_000, expenses: 9_500, nextBilling: "2026-04-10", billingStatus: "paid" },
];

const initialTeam: TeamMember[] = [
  { id: "t1", name: "Алексей Ким", role: "Таргетолог", salary: 350_000 },
  { id: "t2", name: "Мария Иванова", role: "СММ-менеджер", salary: 280_000 },
  { id: "t3", name: "Дамир Нурланов", role: "Дизайнер", salary: 300_000 },
  { id: "t4", name: "Айгуль Сатпаева", role: "Контент-менеджер", salary: 250_000 },
];

const billingLabels: Record<string, { text: string; cls: string }> = {
  paid: { text: "Оплачено", cls: "bg-primary/10 text-primary border-primary/20" },
  upcoming: { text: "Ожидается", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  overdue: { text: "Просрочено", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const statusOptions: ClientFinance["billingStatus"][] = ["paid", "upcoming", "overdue"];

function AgencyTab() {
  const [clientsData, setClientsData] = useState<ClientFinance[]>(initialClients);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [services, setServices] = useState<string[]>(defaultServices);
  const [newServiceName, setNewServiceName] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", services: [] as string[], revenue: 0, nextBilling: "" });

  const handleAddClient = () => {
    if (!newClient.name) return;
    setClientsData(prev => [...prev, {
      id: String(Date.now()),
      name: newClient.name,
      services: newClient.services,
      revenue: newClient.revenue,
      expenses: 0,
      nextBilling: newClient.nextBilling || "2026-04-01",
      billingStatus: "upcoming",
    }]);
    setNewClient({ name: "", services: [], revenue: 0, nextBilling: "" });
    setAddOpen(false);
  };

  const updateClient = (id: string, field: keyof ClientFinance, value: unknown) => {
    setClientsData(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };
  const removeClient = (id: string) => setClientsData(prev => prev.filter(c => c.id !== id));

  const toggleClientService = (clientId: string, service: string) => {
    setClientsData(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const has = c.services.includes(service);
      return { ...c, services: has ? c.services.filter(s => s !== service) : [...c.services, service] };
    }));
  };

  const addTeamMember = () => setTeam(prev => [...prev, { id: String(Date.now()), name: "Новый сотрудник", role: "Должность", salary: 0 }]);
  const updateMember = (id: string, field: keyof TeamMember, value: string | number) => setTeam(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  const removeMember = (id: string) => setTeam(prev => prev.filter(m => m.id !== id));

  const addService = () => {
    if (newServiceName.trim() && !services.includes(newServiceName.trim())) {
      setServices(prev => [...prev, newServiceName.trim()]);
      setNewServiceName("");
    }
  };

  const totalMrr = clientsData.reduce((s, c) => s + c.revenue, 0);
  const totalExpenses = clientsData.reduce((s, c) => s + c.expenses, 0);
  const totalSalaries = team.reduce((s, m) => s + m.salary, 0);
  const totalProfit = totalMrr - totalExpenses - totalSalaries;
  const avgMargin = totalMrr > 0 ? Math.round((totalProfit / totalMrr) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /><span className="text-[12px] font-medium uppercase tracking-wider">MRR</span></div>
          <p className="text-2xl font-bold text-foreground tracking-tight">{fmtCurrency(totalMrr)}</p>
        </div>
        <div className="glass rounded-xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span className="text-[12px] font-medium uppercase tracking-wider">ФОТ команды</span></div>
          <p className="text-2xl font-bold text-destructive tracking-tight">{fmtCurrency(totalSalaries)}</p>
        </div>
        <div className="glass rounded-xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground"><PiggyBank className="h-4 w-4" /><span className="text-[12px] font-medium uppercase tracking-wider">Чистая прибыль</span></div>
          <p className={`text-2xl font-bold tracking-tight ${totalProfit >= 0 ? "text-primary" : "text-destructive"}`}>{fmtCurrency(totalProfit)}</p>
        </div>
        <div className="glass rounded-xl p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground"><BarChart3 className="h-4 w-4" /><span className="text-[12px] font-medium uppercase tracking-wider">Маржинальность</span></div>
          <p className="text-2xl font-bold text-foreground tracking-tight">{avgMargin}%</p>
        </div>
      </div>

      {/* Services manager */}
      <div className="glass rounded-xl p-4">
        <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Услуги</p>
        <div className="flex flex-wrap gap-2 items-center">
          {services.map(s => (
            <Badge key={s} variant="secondary" className="text-[11px] gap-1 pr-1">
              {s}
              <button onClick={() => setServices(prev => prev.filter(x => x !== s))} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addService()} placeholder="Новая услуга..." className="h-7 w-[130px] text-[11px] bg-transparent border-white/[0.06]" />
            <button onClick={addService} className="text-primary hover:text-primary/80"><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <p className="text-[13px] font-semibold text-foreground">Клиенты</p>
          <Sheet open={addOpen} onOpenChange={setAddOpen}>
            <SheetTrigger asChild>
              <button className="text-[12px] text-primary hover:text-primary/80 font-medium flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Добавить клиента</button>
            </SheetTrigger>
            <SheetContent className="w-[400px]">
              <SheetHeader><SheetTitle>Новый клиент</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <label className="text-[12px] text-muted-foreground">Имя клиента</label>
                  <Input value={newClient.name} onChange={(e) => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Название компании" className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-muted-foreground">Услуги</label>
                  <div className="flex flex-wrap gap-1.5">
                    {services.map(s => {
                      const selected = newClient.services.includes(s);
                      return (
                        <button key={s} onClick={() => setNewClient(p => ({ ...p, services: selected ? p.services.filter(x => x !== s) : [...p.services, s] }))}
                          className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${selected ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-muted-foreground">Оплата (₸)</label>
                  <Input type="number" value={newClient.revenue || ""} onChange={(e) => setNewClient(p => ({ ...p, revenue: Number(e.target.value) }))} className="h-9 text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-muted-foreground">Дата оплаты</label>
                  <Input type="date" value={newClient.nextBilling} onChange={(e) => setNewClient(p => ({ ...p, nextBilling: e.target.value }))} className="h-9 text-[13px]" />
                </div>
                <Button onClick={handleAddClient} className="w-full h-10 text-[13px] mt-4"><Plus className="h-4 w-4 mr-2" /> Добавить</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04] hover:bg-transparent">
              <TableHead className="text-[11px]">Клиент</TableHead>
              <TableHead className="text-[11px]">Услуги</TableHead>
              <TableHead className="text-[11px] text-right">Оплата</TableHead>
              <TableHead className="text-[11px] text-right">Расходы</TableHead>
              <TableHead className="text-[11px] text-right">Прибыль</TableHead>
              <TableHead className="text-[11px] text-right">Маржа</TableHead>
              <TableHead className="text-[11px]">След. оплата</TableHead>
              <TableHead className="text-[11px]">Статус</TableHead>
              <TableHead className="text-[11px] w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsData.map((c) => {
              const profit = c.revenue - c.expenses;
              const margin = c.revenue > 0 ? Math.round((profit / c.revenue) * 100) : 0;
              return (
                <TableRow key={c.id} className="border-white/[0.04]">
                  <TableCell><Input value={c.name} onChange={(e) => updateClient(c.id, "name", e.target.value)} className="h-8 text-[13px] font-medium bg-transparent border-transparent hover:border-white/[0.06] focus:border-primary/40 p-1" /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 items-center">
                      {c.services.map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] gap-0.5 pr-0.5 cursor-pointer" onClick={() => toggleClientService(c.id, s)}>{s} <X className="h-2.5 w-2.5" /></Badge>
                      ))}
                      <Select onValueChange={(v) => { if (!c.services.includes(v)) updateClient(c.id, "services", [...c.services, v]); }}>
                        <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent [&>svg]:hidden"><Plus className="h-3 w-3 text-muted-foreground" /></SelectTrigger>
                        <SelectContent>{services.filter(s => !c.services.includes(s)).map(s => (<SelectItem key={s} value={s} className="text-[12px]">{s}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell><Input type="number" value={c.revenue || ""} onChange={(e) => updateClient(c.id, "revenue", Number(e.target.value))} className="h-8 text-[13px] tabular-nums font-medium bg-transparent border-transparent hover:border-white/[0.06] focus:border-primary/40 p-1 text-right w-[110px] ml-auto" /></TableCell>
                  <TableCell><Input type="number" value={c.expenses || ""} onChange={(e) => updateClient(c.id, "expenses", Number(e.target.value))} className="h-8 text-[13px] tabular-nums text-destructive bg-transparent border-transparent hover:border-white/[0.06] focus:border-primary/40 p-1 text-right w-[100px] ml-auto" /></TableCell>
                  <TableCell className="text-right tabular-nums text-[13px] font-semibold text-primary">{fmtCurrency(profit)}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline" className="text-[11px] border-primary/20 text-primary">{margin}%</Badge></TableCell>
                  <TableCell><Input type="date" value={c.nextBilling} onChange={(e) => updateClient(c.id, "nextBilling", e.target.value)} className="h-8 text-[12px] tabular-nums bg-transparent border-transparent hover:border-white/[0.06] focus:border-primary/40 p-1 w-[130px]" /></TableCell>
                  <TableCell>
                    <select value={c.billingStatus} onChange={(e) => updateClient(c.id, "billingStatus", e.target.value)} className="h-8 text-[11px] bg-transparent border border-transparent hover:border-white/[0.06] focus:border-primary/40 rounded-md px-1 cursor-pointer text-foreground">
                      {statusOptions.map(s => (<option key={s} value={s} className="bg-popover text-foreground">{billingLabels[s].text}</option>))}
                    </select>
                  </TableCell>
                  <TableCell><button onClick={() => removeClient(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Team Section */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-[13px] font-semibold text-foreground">Команда</p>
            <Badge variant="secondary" className="text-[10px]">{team.length} чел.</Badge>
          </div>
          <button onClick={addTeamMember} className="text-[12px] text-primary hover:text-primary/80 font-medium flex items-center gap-1"><UserPlus className="h-3.5 w-3.5" /> Добавить</button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04] hover:bg-transparent">
              <TableHead className="text-[11px]">Имя</TableHead>
              <TableHead className="text-[11px]">Должность</TableHead>
              <TableHead className="text-[11px] text-right">Зарплата (₸)</TableHead>
              <TableHead className="text-[11px] w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map((m) => (
              <TableRow key={m.id} className="border-white/[0.04]">
                <TableCell><Input value={m.name} onChange={(e) => updateMember(m.id, "name", e.target.value)} className="h-8 text-[13px] font-medium bg-transparent border-transparent hover:border-white/[0.06] focus:border-primary/40 p-1" /></TableCell>
                <TableCell><Input value={m.role} onChange={(e) => updateMember(m.id, "role", e.target.value)} className="h-8 text-[12px] bg-transparent border-transparent hover:border-white/[0.06] focus:border-primary/40 p-1 text-muted-foreground" /></TableCell>
                <TableCell><Input type="number" value={m.salary || ""} onChange={(e) => updateMember(m.id, "salary", Number(e.target.value))} className="h-8 text-[13px] tabular-nums font-medium bg-transparent border-transparent hover:border-white/[0.06] focus:border-primary/40 p-1 text-right w-[130px] ml-auto" /></TableCell>
                <TableCell><button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
              </TableRow>
            ))}
            <TableRow className="border-white/[0.04] bg-white/[0.01]">
              <TableCell colSpan={2} className="text-[12px] font-semibold text-foreground">Итого ФОТ</TableCell>
              <TableCell className="text-right tabular-nums text-[13px] font-bold text-foreground">{fmtCurrency(totalSalaries)}</TableCell>
              <TableCell />
            </TableRow>
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
