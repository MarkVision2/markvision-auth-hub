import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Save, Calculator, DollarSign, ArrowRight, Wallet, PiggyBank,
  BarChart3, Plus, Trash2, Download, Users, UserPlus, X, TrendingUp,
  ChevronLeft, ChevronRight, Receipt, Percent, Target, CircleDollarSign
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Area, AreaChart } from "recharts";

/* ── Formatting ── */
function fmt(v: number): string {
  return Math.round(v).toLocaleString("ru-RU").replace(/,/g, " ");
}
function fmtCurrency(v: number): string {
  return fmt(v) + " ₸";
}

/* ── Shared inline-edit input style ── */
const inlineInput = "h-9 bg-secondary/50 border-border/50 rounded-lg text-sm tabular-nums focus:border-primary/60 focus:bg-secondary/80 transition-colors placeholder:text-muted-foreground/40";
const inlineInputRight = `${inlineInput} text-right`;

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, valueClass = "text-foreground", sub }: {
  icon: React.ElementType; label: string; value: string; valueClass?: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border/50 p-5 flex flex-col gap-3 hover:border-border transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold tracking-tight tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground -mt-1">{sub}</p>}
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ title, action, children, className = "" }: {
  title: string; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-card border border-border/50 overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ── Reusable input field (for decomposition) ── */
function NumField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground font-medium">{label}</label>
        <span className="text-xs font-semibold text-foreground tabular-nums">{fmt(value)}{suffix}</span>
      </div>
      <Input
        type="number"
        value={value || ""}
        onChange={(e) => { const n = Number(e.target.value); if (!isNaN(n)) onChange(Math.max(0, n)); }}
        className={inlineInput}
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
  const [mode, setMode] = useState<"revenue" | "profit">("revenue");
  const [targetRevenue, setTargetRevenue] = useState(1_000_000);
  const [targetProfit, setTargetProfit] = useState(200_000);
  const [cpl, setCpl] = useState(300);
  const [cr1, setCr1] = useState(2);
  const [cr2, setCr2] = useState(10);

  const [products, setProducts] = useState<Product[]>([
    { name: "Основной товар", check: 5000, share: 100 },
  ]);
  const [fixExpenses, setFixExpenses] = useState<Expense[]>([
    { name: "Офис", value: 50000, isPercent: false },
    { name: "ФОТ", value: 100000, isPercent: false },
  ]);
  const [varExpenses, setVarExpenses] = useState<Expense[]>([
    { name: "Налоги", value: 6, isPercent: true },
    { name: "Эквайринг", value: 2.5, isPercent: true },
  ]);

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
    setProducts(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  };
  const addProduct = () => setProducts(prev => [...prev, { name: `Товар ${prev.length + 1}`, check: 0, share: 0 }]);
  const removeProduct = (i: number) => setProducts(prev => prev.filter((_, idx) => idx !== i));
  const addFix = () => setFixExpenses(prev => [...prev, { name: "Новый расход", value: 0, isPercent: false }]);
  const addVar = () => setVarExpenses(prev => [...prev, { name: "Новый расход", value: 0, isPercent: true }]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
      {/* LEFT — Inputs */}
      <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
        {/* Mode */}
        <div className="rounded-2xl bg-card border border-border/50 p-5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Режим расчёта</p>
          <div className="grid grid-cols-2 gap-1.5 bg-secondary/50 rounded-xl p-1.5">
            <button onClick={() => setMode("revenue")}
              className={`text-sm font-medium py-2.5 rounded-lg transition-all ${mode === "revenue" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              От Выручки
            </button>
            <button onClick={() => setMode("profit")}
              className={`text-sm font-medium py-2.5 rounded-lg transition-all ${mode === "profit" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              От Прибыли
            </button>
          </div>
        </div>

        {/* Targets */}
        <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Целевые метрики</p>
          <NumField label="Целевая Выручка" value={targetRevenue} onChange={setTargetRevenue} />
          <NumField label="Целевая Прибыль" value={targetProfit} onChange={setTargetProfit} />
        </div>

        {/* Marketing */}
        <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Маркетинг</p>
          <NumField label="CPL (Стоимость лида)" value={cpl} onChange={setCpl} />
          <NumField label="CR1: Просмотр → Лид" value={cr1} onChange={setCr1} suffix="%" />
          <NumField label="CR2: Лид → Продажа" value={cr2} onChange={setCr2} suffix="%" />
        </div>

        {/* Products */}
        <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Товары / Услуги</p>
            <button onClick={addProduct} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Добавить
            </button>
          </div>
          {products.map((p, i) => (
            <div key={i} className="bg-secondary/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Input value={p.name} onChange={(e) => updateProduct(i, "name", e.target.value)}
                  className="h-8 text-sm font-medium bg-transparent border-none p-0 focus-visible:ring-0" />
                {products.length > 1 && (
                  <button onClick={() => removeProduct(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Чек</label>
                  <Input type="number" value={p.check || ""} onChange={(e) => updateProduct(i, "check", Number(e.target.value))} className={inlineInput} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Доля %</label>
                  <Input type="number" value={p.share || ""} onChange={(e) => updateProduct(i, "share", Number(e.target.value))} className={inlineInput} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-1">Средний чек: <span className="font-semibold text-foreground">{fmt(calc.avgCheck)}</span></p>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Расходы</p>
            <div className="flex gap-2">
              <button onClick={addFix} className="text-xs text-primary hover:text-primary/80 font-medium">+ Fix</button>
              <button onClick={addVar} className="text-xs text-destructive hover:text-destructive/80 font-medium">+ Var</button>
            </div>
          </div>
          {fixExpenses.map((e, i) => (
            <div key={`fix-${i}`} className="flex items-center gap-2">
              <Input value={e.name} onChange={(ev) => setFixExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, name: ev.target.value } : x))} className={`${inlineInput} flex-1`} />
              <Input type="number" value={e.value || ""} onChange={(ev) => setFixExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, value: Number(ev.target.value) } : x))} className={`${inlineInputRight} w-[110px]`} />
              <button onClick={() => setFixExpenses(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {varExpenses.map((e, i) => (
            <div key={`var-${i}`} className="flex items-center gap-2">
              <Input value={e.name} onChange={(ev) => setVarExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, name: ev.target.value } : x))} className={`${inlineInput} flex-1`} />
              <div className="flex items-center gap-1">
                <Input type="number" value={e.value || ""} onChange={(ev) => setVarExpenses(prev => prev.map((x, idx) => idx === i ? { ...x, value: Number(ev.target.value) } : x))} className={`${inlineInputRight} w-[90px]`} />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <button onClick={() => setVarExpenses(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Results */}
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KpiCard icon={PiggyBank} label="Чистая прибыль" value={fmt(calc.netProfit)} valueClass={calc.netProfit >= 0 ? "text-primary" : "text-destructive"} sub="После всех расходов" />
          <KpiCard icon={CircleDollarSign} label="Выручка" value={fmt(calc.revenue)} sub={`${fmt(calc.sales)} продаж · ${calc.margin.toFixed(1)}% маржа`} />
          <KpiCard icon={TrendingUp} label="ROMI" value={`${Math.round(calc.romiMarketing)}%`} sub={`ROI (все расх.): ${Math.round(calc.roiAll)}%`} />
        </div>

        {/* Funnel */}
        <Section title="Визуализация воронки">
          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              {[
                { label: "Просмотры", value: fmt(calc.impressions), sub: null, highlight: false },
                { label: "Лиды", value: fmt(calc.leads), sub: `по ${fmt(cpl)} ₸`, highlight: false },
                { label: "Продажи", value: fmt(calc.sales), sub: `чек ${fmt(calc.avgCheck)}`, highlight: true },
                { label: "Выручка", value: fmt(calc.revenue), sub: null, highlight: true },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center gap-3 flex-1">
                  <div className={`rounded-xl p-4 flex-1 text-center border transition-colors ${step.highlight ? "border-primary/30 bg-primary/[0.06]" : "bg-secondary/40 border-border/30"}`}>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{step.label}</p>
                    <p className={`text-lg font-bold tabular-nums mt-1.5 ${step.highlight ? "text-primary" : "text-foreground"}`}>{step.value}</p>
                    {step.sub && <p className="text-[11px] text-muted-foreground mt-1">{step.sub}</p>}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex flex-col items-center shrink-0 gap-0.5">
                      <span className="text-[11px] text-primary font-semibold tabular-nums">{i === 0 ? `${cr1}%` : i === 1 ? `${cr2}%` : ""}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Bottom: Unit Economics + Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Юнит-экономика (на 1 клиента)">
            <div className="p-6 space-y-0">
              {[
                { label: "CAC (маркетинг)", sub: "только стоимость лида", value: fmt(calc.cacMarketing) },
                { label: "CAC (полный)", sub: "маркетинг + постоянные", value: fmt(calc.cacFull) },
                { label: "Средний чек", sub: null, value: fmt(calc.avgCheck) },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3.5 border-b border-border/30 last:border-b-0">
                  <div>
                    <p className="text-sm text-foreground">{item.label}</p>
                    {item.sub && <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>}
                  </div>
                  <span className="text-base font-semibold text-foreground tabular-nums">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3.5 bg-primary/[0.06] rounded-xl px-4 -mx-2 mt-3 border border-primary/20">
                <div>
                  <p className="text-sm text-primary font-medium">Маржа на клиента</p>
                  <p className="text-xs text-muted-foreground mt-0.5">чек − полный CAC</p>
                </div>
                <span className="text-lg font-bold text-primary tabular-nums">{fmt(calc.marginPerClient)}</span>
              </div>
            </div>
          </Section>

          <Section title="Структура расходов">
            <div className="p-6 space-y-5">
              {[
                { label: "Маркетинг", value: calc.marketingSpend, color: "bg-primary" },
                { label: "Постоянные (Fix)", value: calc.fixTotal, color: "bg-blue-500" },
                { label: "Переменные (Var)", value: calc.varTotal, color: "bg-destructive" },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground">{item.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{fmt(item.value)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${calc.totalExpenses > 0 ? (item.value / calc.totalExpenses) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-4 border-t border-border/50">
                <span className="font-semibold text-foreground">Всего расходов</span>
                <span className="font-bold tabular-nums text-foreground">{fmt(calc.totalExpenses)}</span>
              </div>
            </div>
          </Section>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1 h-11 text-sm font-semibold gap-2 rounded-xl">
            <Save className="h-4 w-4" /> Сохранить медиаплан
          </Button>
          <Button variant="outline" className="h-11 text-sm gap-2 rounded-xl border-border/50">
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
  upcoming: { text: "Ожидается", cls: "bg-status-warning/10 text-status-warning border-status-warning/20" },
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
      id: String(Date.now()), name: newClient.name, services: newClient.services,
      revenue: newClient.revenue, expenses: 0, nextBilling: newClient.nextBilling || "2026-04-01", billingStatus: "upcoming",
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
      return { ...c, services: c.services.includes(service) ? c.services.filter(s => s !== service) : [...c.services, service] };
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
  const taxRate = 0.10;
  const totalTax = totalMrr * taxRate;
  const totalProfit = totalMrr - totalExpenses - totalSalaries - totalTax;
  const avgMargin = totalMrr > 0 ? Math.round((totalProfit / totalMrr) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={Wallet} label="MRR" value={fmtCurrency(totalMrr)} />
        <KpiCard icon={Users} label="ФОТ команды" value={fmtCurrency(totalSalaries)} valueClass="text-destructive" />
        <KpiCard icon={Receipt} label="Налоги (10%)" value={fmtCurrency(totalTax)} valueClass="text-status-warning" />
        <KpiCard icon={PiggyBank} label="Чистая прибыль" value={fmtCurrency(totalProfit)} valueClass={totalProfit >= 0 ? "text-primary" : "text-destructive"} />
        <KpiCard icon={Percent} label="Маржинальность" value={`${avgMargin}%`} />
      </div>

      {/* Services */}
      <Section title="Услуги">
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2 items-center">
            {services.map(s => (
              <Badge key={s} variant="secondary" className="text-xs gap-1.5 pr-1.5 py-1 rounded-lg">
                {s}
                <button onClick={() => setServices(prev => prev.filter(x => x !== s))} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
            <div className="flex items-center gap-1.5 ml-1">
              <Input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addService()}
                placeholder="Новая услуга…" className="h-8 w-[140px] text-xs bg-secondary/50 border-border/50 rounded-lg" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={addService}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Clients */}
      <Section
        title={`Клиенты · ${clientsData.length}`}
        action={
          <Sheet open={addOpen} onOpenChange={setAddOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> Добавить клиента</Button>
            </SheetTrigger>
            <SheetContent className="w-[420px] border-border/50">
              <SheetHeader><SheetTitle className="text-lg">Новый клиент</SheetTitle></SheetHeader>
              <div className="space-y-5 mt-8">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Имя клиента</label>
                  <Input value={newClient.name} onChange={(e) => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Название компании" className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Услуги</label>
                  <div className="flex flex-wrap gap-2">
                    {services.map(s => {
                      const selected = newClient.services.includes(s);
                      return (
                        <button key={s} onClick={() => setNewClient(p => ({ ...p, services: selected ? p.services.filter(x => x !== s) : [...p.services, s] }))}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selected ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border text-muted-foreground hover:text-foreground hover:border-border"}`}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Оплата (₸)</label>
                  <Input type="number" value={newClient.revenue || ""} onChange={(e) => setNewClient(p => ({ ...p, revenue: Number(e.target.value) }))} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Дата оплаты</label>
                  <Input type="date" value={newClient.nextBilling} onChange={(e) => setNewClient(p => ({ ...p, nextBilling: e.target.value }))} className="h-10 rounded-xl" />
                </div>
                <Button onClick={handleAddClient} className="w-full h-11 rounded-xl text-sm mt-2"><Plus className="h-4 w-4 mr-2" /> Добавить клиента</Button>
              </div>
            </SheetContent>
          </Sheet>
        }
      >
        <div className="divide-y divide-border/20">
          {clientsData.map((c) => {
            const profit = c.revenue - c.expenses;
            const margin = c.revenue > 0 ? Math.round((profit / c.revenue) * 100) : 0;
            const statusStyle = billingLabels[c.billingStatus];
            return (
              <div key={c.id} className="group px-6 py-5 hover:bg-secondary/20 transition-colors">
                {/* Row 1: Name + Status + Actions */}
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{c.name.charAt(0)}</span>
                    </div>
                    <Input value={c.name} onChange={(e) => updateClient(c.id, "name", e.target.value)}
                      className="h-auto py-1 text-sm font-semibold bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 max-w-[280px]" />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <select value={c.billingStatus} onChange={(e) => updateClient(c.id, "billingStatus", e.target.value)}
                      className={`h-7 text-[11px] rounded-lg px-2.5 border cursor-pointer transition-colors ${statusStyle.cls}`}>
                      {statusOptions.map(s => (<option key={s} value={s} className="bg-popover text-foreground">{billingLabels[s].text}</option>))}
                    </select>
                    <Input type="date" value={c.nextBilling} onChange={(e) => updateClient(c.id, "nextBilling", e.target.value)}
                      className="h-7 py-0 text-[11px] tabular-nums bg-transparent border-border/30 rounded-lg px-2 w-[130px]" />
                    <button onClick={() => removeClient(c.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Services */}
                <div className="flex items-center gap-1.5 mb-3 ml-12">
                  {c.services.map(s => (
                    <Badge key={s} variant="outline" className="text-[11px] gap-1 pr-1.5 rounded-md border-border/40 cursor-pointer hover:border-destructive/40 transition-colors" onClick={() => toggleClientService(c.id, s)}>
                      {s} <X className="h-2.5 w-2.5 opacity-40 hover:opacity-100" />
                    </Badge>
                  ))}
                  <Select onValueChange={(v) => { if (!c.services.includes(v)) updateClient(c.id, "services", [...c.services, v]); }}>
                    <SelectTrigger className="h-6 w-6 p-0 border-dashed border-border/40 bg-transparent [&>svg]:hidden shrink-0 rounded-md hover:border-primary/40 transition-colors">
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </SelectTrigger>
                    <SelectContent>{services.filter(s => !c.services.includes(s)).map(s => (<SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                {/* Row 3: Financial metrics */}
                <div className="grid grid-cols-4 gap-4 ml-12">
                  <div className="flex items-center justify-between rounded-lg bg-secondary/30 border border-border/20 px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Оплата</span>
                    <Input type="number" value={c.revenue || ""} onChange={(e) => updateClient(c.id, "revenue", Number(e.target.value))}
                      className="h-auto py-0 text-sm tabular-nums font-semibold bg-transparent border-none text-right w-[100px] focus-visible:ring-0 px-0" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-secondary/30 border border-border/20 px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Расходы</span>
                    <Input type="number" value={c.expenses || ""} onChange={(e) => updateClient(c.id, "expenses", Number(e.target.value))}
                      className="h-auto py-0 text-sm tabular-nums font-semibold text-destructive bg-transparent border-none text-right w-[100px] focus-visible:ring-0 px-0" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-primary/[0.04] border border-primary/10 px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Прибыль</span>
                    <span className="text-sm font-semibold tabular-nums text-primary">{fmtCurrency(profit)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-secondary/30 border border-border/20 px-3 py-2">
                    <span className="text-[11px] text-muted-foreground">Маржа</span>
                    <span className={`text-sm font-semibold tabular-nums ${margin >= 80 ? "text-primary" : "text-muted-foreground"}`}>{margin}%</span>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Totals */}
          <div className="px-6 py-4 bg-secondary/20 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Итого · {clientsData.length} клиентов</span>
            <div className="flex items-center gap-6">
              <span className="text-sm tabular-nums"><span className="text-muted-foreground text-xs mr-1.5">Оплата</span><span className="font-bold text-foreground">{fmtCurrency(totalMrr)}</span></span>
              <span className="text-sm tabular-nums"><span className="text-muted-foreground text-xs mr-1.5">Расходы</span><span className="font-bold text-destructive">{fmtCurrency(totalExpenses)}</span></span>
              <span className="text-sm tabular-nums"><span className="text-muted-foreground text-xs mr-1.5">Прибыль</span><span className="font-bold text-primary">{fmtCurrency(totalMrr - totalExpenses)}</span></span>
            </div>
          </div>
        </div>
      </Section>

      {/* Team */}
      <Section
        title={`Команда · ${team.length} чел.`}
        action={
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1.5 h-8" onClick={addTeamMember}>
            <UserPlus className="h-3.5 w-3.5" /> Добавить
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="text-xs font-medium pl-6">Имя</TableHead>
              <TableHead className="text-xs font-medium">Должность</TableHead>
              <TableHead className="text-xs font-medium text-right">Зарплата (₸)</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map((m) => (
              <TableRow key={m.id} className="border-border/20 group hover:bg-secondary/30">
                <TableCell className="pl-6">
                  <Input value={m.name} onChange={(e) => updateMember(m.id, "name", e.target.value)}
                    className="h-9 text-sm font-medium bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2" />
                </TableCell>
                <TableCell>
                  <Input value={m.role} onChange={(e) => updateMember(m.id, "role", e.target.value)}
                    className="h-9 text-sm text-muted-foreground bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={m.salary || ""} onChange={(e) => updateMember(m.id, "salary", Number(e.target.value))}
                    className="h-9 text-sm tabular-nums font-semibold bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 text-right w-[150px] ml-auto" />
                </TableCell>
                <TableCell>
                  <button onClick={() => removeMember(m.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-border/30 bg-secondary/20 hover:bg-secondary/30">
              <TableCell className="pl-6 text-sm font-bold text-foreground" colSpan={2}>Итого ФОТ</TableCell>
              <TableCell className="text-right tabular-nums text-sm font-bold text-foreground">{fmtCurrency(totalSalaries)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════
   TAB 3 — ДИНАМИКА ПО МЕСЯЦАМ
   ══════════════════════════════════════════════ */

const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

interface MonthData {
  month: string;
  revenue: number;
  expenses: number;
  salaries: number;
  tax: number;
  profit: number;
}

function generateDefaultMonths(year: number): MonthData[] {
  return monthNames.map((m) => ({
    month: `${m} ${year}`, revenue: 0, expenses: 0, salaries: 0, tax: 0, profit: 0,
  }));
}

function DynamicsTab() {
  const [year, setYear] = useState(2026);
  const [monthsData, setMonthsData] = useState<MonthData[]>(generateDefaultMonths(2026));

  const updateMonth = (idx: number, field: keyof MonthData, value: number) => {
    setMonthsData(prev => prev.map((m, i) => {
      if (i !== idx) return m;
      const updated = { ...m, [field]: value };
      updated.tax = updated.revenue * 0.1;
      updated.profit = updated.revenue - updated.expenses - updated.salaries - updated.tax;
      return updated;
    }));
  };

  const changeYear = (delta: number) => {
    const newYear = year + delta;
    setYear(newYear);
    setMonthsData(generateDefaultMonths(newYear));
  };

  const totals = useMemo(() => ({
    revenue: monthsData.reduce((s, m) => s + m.revenue, 0),
    expenses: monthsData.reduce((s, m) => s + m.expenses, 0),
    salaries: monthsData.reduce((s, m) => s + m.salaries, 0),
    tax: monthsData.reduce((s, m) => s + m.tax, 0),
    profit: monthsData.reduce((s, m) => s + m.profit, 0),
  }), [monthsData]);

  const chartData = monthsData.map(m => ({
    name: m.month.split(" ")[0],
    Выручка: m.revenue,
    Расходы: m.expenses + m.salaries + m.tax,
    Прибыль: m.profit,
  }));

  return (
    <div className="space-y-8">
      {/* Year switcher */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/50" onClick={() => changeYear(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="rounded-xl bg-card border border-border/50 px-6 py-2">
          <span className="text-lg font-bold text-foreground tabular-nums">{year}</span>
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/50" onClick={() => changeYear(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Year KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={CircleDollarSign} label="Выручка за год" value={fmtCurrency(totals.revenue)} />
        <KpiCard icon={Target} label="Расходы" value={fmtCurrency(totals.expenses)} valueClass="text-destructive" />
        <KpiCard icon={Users} label="ФОТ" value={fmtCurrency(totals.salaries)} valueClass="text-destructive" />
        <KpiCard icon={Receipt} label="Налоги (10%)" value={fmtCurrency(totals.tax)} valueClass="text-status-warning" />
        <KpiCard icon={PiggyBank} label="Чистая прибыль" value={fmtCurrency(totals.profit)} valueClass={totals.profit >= 0 ? "text-primary" : "text-destructive"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Выручка vs Расходы">
          <div className="p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}k` : "0"} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13, padding: "10px 14px" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => fmtCurrency(value)}
                    cursor={{ fill: "hsl(var(--muted) / 0.3)", radius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="Выручка" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Расходы" fill="hsl(var(--destructive) / 0.7)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>

        <Section title="Чистая прибыль">
          <div className="p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v !== 0 ? `${(v / 1000).toFixed(0)}k` : "0"} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 13, padding: "10px 14px" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => fmtCurrency(value)}
                  />
                  <Area type="monotone" dataKey="Прибыль" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#profitGrad)" dot={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2, r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>
      </div>

      {/* Monthly table */}
      <Section title="Помесячная таблица">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="text-xs font-medium pl-6">Месяц</TableHead>
                <TableHead className="text-xs font-medium text-right">Выручка</TableHead>
                <TableHead className="text-xs font-medium text-right">Расходы</TableHead>
                <TableHead className="text-xs font-medium text-right">ФОТ</TableHead>
                <TableHead className="text-xs font-medium text-right">Налоги (10%)</TableHead>
                <TableHead className="text-xs font-medium text-right pr-6">Прибыль</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthsData.map((m, i) => (
                <TableRow key={m.month} className="border-border/20 hover:bg-secondary/30">
                  <TableCell className="text-sm font-medium text-foreground pl-6">{m.month}</TableCell>
                  <TableCell>
                    <Input type="number" value={m.revenue || ""} onChange={(e) => updateMonth(i, "revenue", Number(e.target.value))}
                      className="h-9 text-sm tabular-nums bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 text-right w-[130px] ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={m.expenses || ""} onChange={(e) => updateMonth(i, "expenses", Number(e.target.value))}
                      className="h-9 text-sm tabular-nums text-destructive bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 text-right w-[130px] ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={m.salaries || ""} onChange={(e) => updateMonth(i, "salaries", Number(e.target.value))}
                      className="h-9 text-sm tabular-nums bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 text-right w-[130px] ml-auto" />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm text-status-warning pr-4">{fmtCurrency(m.tax)}</TableCell>
                  <TableCell className={`text-right tabular-nums text-sm font-semibold pr-6 ${m.profit >= 0 ? "text-primary" : "text-destructive"}`}>{fmtCurrency(m.profit)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-border/30 bg-secondary/20 hover:bg-secondary/30">
                <TableCell className="pl-6 text-sm font-bold text-foreground">Итого</TableCell>
                <TableCell className="text-right tabular-nums text-sm font-bold text-foreground">{fmtCurrency(totals.revenue)}</TableCell>
                <TableCell className="text-right tabular-nums text-sm font-bold text-destructive">{fmtCurrency(totals.expenses)}</TableCell>
                <TableCell className="text-right tabular-nums text-sm font-bold text-foreground">{fmtCurrency(totals.salaries)}</TableCell>
                <TableCell className="text-right tabular-nums text-sm font-bold text-status-warning">{fmtCurrency(totals.tax)}</TableCell>
                <TableCell className={`text-right tabular-nums text-sm font-bold pr-6 ${totals.profit >= 0 ? "text-primary" : "text-destructive"}`}>{fmtCurrency(totals.profit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Section>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════ */

export default function FinancePage() {
  return (
    <DashboardLayout breadcrumb="Финансы">
      <div className="space-y-8 max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Финансы</h1>
          <p className="text-sm text-muted-foreground mt-1">Юнит-экономика, агентская P&L и динамика</p>
        </div>

        <Tabs defaultValue="decomposition" className="space-y-6">
          <TabsList className="bg-card border border-border/50 h-11 p-1 rounded-xl">
            <TabsTrigger value="decomposition" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
              <Calculator className="h-4 w-4" /> Декомпозиция
            </TabsTrigger>
            <TabsTrigger value="agency" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
              <DollarSign className="h-4 w-4" /> Агентская аналитика
            </TabsTrigger>
            <TabsTrigger value="dynamics" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
              <TrendingUp className="h-4 w-4" /> Динамика по месяцам
            </TabsTrigger>
          </TabsList>

          <TabsContent value="decomposition"><DecompositionTab /></TabsContent>
          <TabsContent value="agency"><AgencyTab /></TabsContent>
          <TabsContent value="dynamics"><DynamicsTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
