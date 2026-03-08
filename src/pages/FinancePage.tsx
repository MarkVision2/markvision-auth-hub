import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Save, Calculator, DollarSign, ArrowRight, Wallet, PiggyBank,
  BarChart3, Plus, Trash2, Download, Users, UserPlus, X, TrendingUp,
  ChevronLeft, ChevronRight, ChevronDown, Receipt, Percent, Target, CircleDollarSign
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
const inlineInput = "h-9 bg-secondary/50 border-transparent rounded-lg text-sm tabular-nums focus:border-primary/60 focus:bg-secondary/80 transition-colors placeholder:text-muted-foreground/40";
const inlineInputRight = `${inlineInput} text-right`;

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, valueClass = "text-foreground", sub }: {
  icon: React.ElementType; label: string; value: string; valueClass?: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 flex flex-col gap-3">
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
    <div className={`rounded-2xl bg-card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-6 py-4">
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
        <div className="rounded-2xl bg-card p-5">
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
        <div className="rounded-2xl bg-card p-5 space-y-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Целевые метрики</p>
          <NumField label="Целевая Выручка" value={targetRevenue} onChange={setTargetRevenue} />
          <NumField label="Целевая Прибыль" value={targetProfit} onChange={setTargetProfit} />
        </div>

        {/* Marketing */}
        <div className="rounded-2xl bg-card p-5 space-y-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Маркетинг</p>
          <NumField label="CPL (Стоимость лида)" value={cpl} onChange={setCpl} />
          <NumField label="CR1: Просмотр → Лид" value={cr1} onChange={setCr1} suffix="%" />
          <NumField label="CR2: Лид → Продажа" value={cr2} onChange={setCr2} suffix="%" />
        </div>

        {/* Products */}
        <div className="rounded-2xl bg-card p-5 space-y-3">
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
        <div className="rounded-2xl bg-card p-5 space-y-3">
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
                  <div className={`rounded-xl p-4 flex-1 text-center transition-colors ${step.highlight ? "border border-primary/30 bg-primary/[0.06]" : "bg-secondary/40"}`}>
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
                <div key={i} className="flex justify-between items-center py-3.5 last:border-b-0">
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
              <div className="flex justify-between text-sm pt-4">
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
          <Button variant="outline" className="h-11 text-sm gap-2 rounded-xl border-border/10">
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

interface ClientService {
  name: string;
  price: number;
}

interface ClientFinance {
  id: string;
  name: string;
  services: ClientService[];
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

const billingLabels: Record<string, { text: string; cls: string }> = {
  paid: { text: "Оплачено", cls: "bg-primary/10 text-primary border-primary/20" },
  upcoming: { text: "Ожидается", cls: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  overdue: { text: "Просрочено", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

const statusOptions: ClientFinance["billingStatus"][] = ["paid", "upcoming", "overdue"];

/* ── Services Popover for a single client ── */
function ServicesPopover({ client, allServices, onUpdate }: {
  client: ClientFinance;
  allServices: string[];
  onUpdate: (services: ClientService[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState(0);

  const totalRevenue = client.services.reduce((s, sv) => s + sv.price, 0);
  const hasServices = client.services.length > 0;
  const displayLabel = hasServices ? client.services.map(s => s.name).join(", ") : "Нет услуг";

  const removeService = (name: string) => {
    onUpdate(client.services.filter(s => s.name !== name));
  };

  const updateServicePrice = (name: string, price: number) => {
    onUpdate(client.services.map(s => s.name === name ? { ...s, price } : s));
  };

  const addExistingService = (name: string) => {
    if (!client.services.find(s => s.name === name)) {
      onUpdate([...client.services, { name, price: 0 }]);
    }
  };

  const addNewService = () => {
    if (newName.trim() && newPrice > 0 && !client.services.find(s => s.name === newName.trim())) {
      onUpdate([...client.services, { name: newName.trim(), price: newPrice }]);
      setNewName("");
      setNewPrice(0);
    }
  };

  const availableServices = allServices.filter(s => !client.services.find(sv => sv.name === s));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 text-left hover:bg-secondary/50 rounded-lg px-2 py-1.5 transition-colors w-full group/svc">
          <span className="text-sm text-foreground truncate flex-1">{displayLabel}</span>
          <Badge variant="secondary" className="text-[10px] shrink-0 tabular-nums">{client.services.length}</Badge>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover/svc:opacity-100 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="p-4">
          <p className="text-sm font-semibold text-foreground">{client.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Итого: <span className="font-semibold text-foreground">{fmtCurrency(totalRevenue)}</span></p>
        </div>

        {/* Current services */}
        <div className="p-2 max-h-[240px] overflow-y-auto">
          {client.services.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Нет добавленных услуг</p>
          )}
          {client.services.map(sv => (
            <div key={sv.name} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/40 transition-colors">
              <span className="text-sm text-foreground flex-1 truncate">{sv.name}</span>
              <Input type="number" value={sv.price || ""} onChange={(e) => updateServicePrice(sv.name, Number(e.target.value))}
                className="h-7 w-[100px] text-xs tabular-nums text-right bg-secondary/50 border-border/10 rounded-md px-2" placeholder="Сумма" />
              <span className="text-[10px] text-muted-foreground shrink-0">₸</span>
              <button onClick={() => removeService(sv.name)} className="text-muted-foreground/50 hover:text-destructive transition-colors shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add existing service */}
        {availableServices.length > 0 && (
          <div className="p-3">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Добавить услугу</p>
            <div className="flex flex-wrap gap-1.5">
              {availableServices.map(s => (
                <button key={s} onClick={() => addExistingService(s)}
                  className="text-[11px] px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all">
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add custom service */}
        <div className="p-3">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Новая услуга</p>
          <div className="flex items-center gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Название"
              className="h-8 text-xs flex-1 bg-secondary/50 border-border/10 rounded-md" />
            <Input type="number" value={newPrice || ""} onChange={(e) => setNewPrice(Number(e.target.value))} placeholder="₸"
              className="h-8 w-[80px] text-xs text-right bg-secondary/50 border-border/10 rounded-md tabular-nums" />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-primary" onClick={addNewService}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AgencyTab() {
  const [clientsData, setClientsData] = useState<ClientFinance[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<string[]>(defaultServices);
  const [newServiceName, setNewServiceName] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", services: [] as ClientService[], nextBilling: "" });
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      // Fetch clients from clients_config
      const { data: clients } = await supabase.from("clients_config").select("id, client_name, is_active").eq("is_active", true);
      
      // Fetch all services
      const { data: allServices } = await supabase.from("finance_client_services").select("*");
      
      // Fetch all billing
      const { data: allBilling } = await supabase.from("finance_client_billing").select("*");
      
      // Fetch team
      const { data: teamData } = await supabase.from("finance_team").select("*").order("created_at");

      if (clients) {
        const mapped: ClientFinance[] = clients.map(c => {
          const svcs = (allServices || []).filter(s => s.client_config_id === c.id).map(s => ({ name: s.service_name, price: Number(s.price) }));
          const billing = (allBilling || []).find(b => b.client_config_id === c.id);
          return {
            id: c.id,
            name: c.client_name,
            services: svcs,
            expenses: billing ? Number(billing.expenses) : 0,
            nextBilling: billing?.next_billing || "",
            billingStatus: (billing?.billing_status || "upcoming") as ClientFinance["billingStatus"],
          };
        });
        setClientsData(mapped);
      }

      if (teamData) {
        setTeam(teamData.map(t => ({ id: t.id, name: t.name, role: t.role, salary: Number(t.salary) })));
      }
    } catch (err) {
      console.error("Finance fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Save services to Supabase
  const saveServices = async (clientId: string, svcs: ClientService[]) => {
    // Delete existing and re-insert
    await supabase.from("finance_client_services").delete().eq("client_config_id", clientId);
    if (svcs.length > 0) {
      await supabase.from("finance_client_services").insert(
        svcs.map(s => ({ client_config_id: clientId, service_name: s.name, price: s.price }))
      );
    }
  };

  // Save billing to Supabase
  const saveBilling = async (clientId: string, expenses: number, nextBilling: string, billingStatus: string) => {
    await supabase.from("finance_client_billing").upsert({
      client_config_id: clientId,
      expenses,
      next_billing: nextBilling || null,
      billing_status: billingStatus,
      updated_at: new Date().toISOString(),
    }, { onConflict: "client_config_id" });
  };

  const handleAddClient = async () => {
    if (!newClient.name) return;
    // Create client in clients_config
    const { data: inserted } = await supabase.from("clients_config").insert({ client_name: newClient.name }).select("id").single();
    if (inserted) {
      if (newClient.services.length > 0) {
        await saveServices(inserted.id, newClient.services);
      }
      await saveBilling(inserted.id, 0, newClient.nextBilling, "upcoming");
    }
    setNewClient({ name: "", services: [], nextBilling: "" });
    setAddOpen(false);
    fetchData();
  };

  const updateClient = async (id: string, field: keyof ClientFinance, value: unknown) => {
    setClientsData(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    const client = clientsData.find(c => c.id === id);
    if (!client) return;

    if (field === "services") {
      await saveServices(id, value as ClientService[]);
    } else if (field === "expenses" || field === "nextBilling" || field === "billingStatus") {
      const updated = { ...client, [field]: value };
      await saveBilling(id, updated.expenses, updated.nextBilling, updated.billingStatus);
    }
  };

  const removeClient = async (id: string) => {
    setClientsData(prev => prev.filter(c => c.id !== id));
    await supabase.from("finance_client_services").delete().eq("client_config_id", id);
    await supabase.from("finance_client_billing").delete().eq("client_config_id", id);
    // Deactivate client instead of deleting
    await supabase.from("clients_config").update({ is_active: false }).eq("id", id);
  };

  const addTeamMember = async () => {
    const { data } = await supabase.from("finance_team").insert({ name: "Новый сотрудник", role: "Должность", salary: 0 }).select().single();
    if (data) {
      setTeam(prev => [...prev, { id: data.id, name: data.name, role: data.role, salary: Number(data.salary) }]);
    }
  };

  const updateMember = async (id: string, field: keyof TeamMember, value: string | number) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    await supabase.from("finance_team").update({ [field]: value }).eq("id", id);
  };

  const removeMember = async (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
    await supabase.from("finance_team").delete().eq("id", id);
  };

  const addService = () => {
    if (newServiceName.trim() && !services.includes(newServiceName.trim())) {
      setServices(prev => [...prev, newServiceName.trim()]);
      setNewServiceName("");
    }
  };

  const getClientRevenue = (c: ClientFinance) => c.services.reduce((s, sv) => s + sv.price, 0);

  const totalMrr = clientsData.reduce((s, c) => s + getClientRevenue(c), 0);
  const totalExpenses = clientsData.reduce((s, c) => s + c.expenses, 0);
  const totalSalaries = team.reduce((s, m) => s + m.salary, 0);
  const taxRate = 0.10;
  const totalTax = totalMrr * taxRate;
  const totalProfit = totalMrr - totalExpenses - totalSalaries - totalTax;
  const avgMargin = totalMrr > 0 ? Math.round((totalProfit / totalMrr) * 100) : 0;

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">Загрузка данных...</div>;
  }

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

      {/* Clients Table */}
      <Section
        title={`Клиенты · ${clientsData.length}`}
        action={
          <Sheet open={addOpen} onOpenChange={setAddOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> Добавить клиента</Button>
            </SheetTrigger>
            <SheetContent className="w-[420px] border-border/10">
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
                      const selected = newClient.services.find(sv => sv.name === s);
                      return (
                        <button key={s} onClick={() => setNewClient(p => ({
                          ...p, services: selected ? p.services.filter(x => x.name !== s) : [...p.services, { name: s, price: 0 }]
                        }))}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selected ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border text-muted-foreground hover:text-foreground hover:border-border"}`}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {newClient.services.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">Стоимость услуг (₸)</label>
                    {newClient.services.map((sv, i) => (
                      <div key={sv.name} className="flex items-center gap-2">
                        <span className="text-xs text-foreground flex-1">{sv.name}</span>
                        <Input type="number" value={sv.price || ""} onChange={(e) => {
                          const updated = [...newClient.services];
                          updated[i] = { ...updated[i], price: Number(e.target.value) };
                          setNewClient(p => ({ ...p, services: updated }));
                        }} placeholder="0" className="h-9 w-[120px] text-right rounded-lg tabular-nums" />
                      </div>
                    ))}
                  </div>
                )}
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
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "3%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Клиент</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Услуги</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Оплата</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Расходы</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Прибыль</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Маржа</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Оплата до</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Статус</th>
                <th className="py-3 px-1" />
              </tr>
            </thead>
            <tbody>
              {clientsData.map((c) => {
                const revenue = getClientRevenue(c);
                const profit = revenue - c.expenses;
                const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
                const statusStyle = billingLabels[c.billingStatus] || billingLabels.upcoming;
                return (
                  <tr key={c.id} className="group hover:bg-secondary/20 transition-colors">
                    <td className="py-4 px-4 align-middle text-left">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    </td>
                    <td className="py-4 px-4 align-middle text-left">
                      <ServicesPopover
                        client={c}
                        allServices={services}
                        onUpdate={(svcs) => updateClient(c.id, "services", svcs)}
                      />
                    </td>
                    <td className="py-4 px-4 align-middle text-left">
                      <span className="text-sm font-semibold text-foreground tabular-nums">{fmtCurrency(revenue)}</span>
                    </td>
                    <td className="py-4 px-4 align-middle text-left">
                      <span className="text-sm font-semibold text-destructive tabular-nums">{fmtCurrency(c.expenses)}</span>
                    </td>
                    <td className="py-4 px-4 align-middle text-left">
                      <span className={`text-sm font-semibold tabular-nums ${profit >= 0 ? "text-primary" : "text-destructive"}`}>{fmtCurrency(profit)}</span>
                    </td>
                    <td className="py-4 px-4 align-middle text-left">
                      <span className={`text-xs font-semibold tabular-nums ${margin >= 50 ? "text-primary" : "text-muted-foreground"}`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="py-4 px-4 align-middle text-left">
                      <span className="text-xs tabular-nums text-muted-foreground">{c.nextBilling ? c.nextBilling.split("-").reverse().join(".") : "—"}</span>
                    </td>
                    <td className="py-4 px-4 align-middle text-left">
                      <select value={c.billingStatus} onChange={(e) => updateClient(c.id, "billingStatus", e.target.value)}
                        className={`h-7 text-[11px] rounded-lg px-2 border cursor-pointer transition-colors ${statusStyle.cls}`}>
                        {statusOptions.map(s => (<option key={s} value={s} className="bg-popover text-foreground">{billingLabels[s].text}</option>))}
                      </select>
                    </td>
                    <td className="py-4 px-1 align-middle">
                      <button onClick={() => removeClient(c.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-secondary/20">
                <td className="py-4 px-4 text-sm font-bold text-foreground text-left">Итого</td>
                <td className="py-4 px-4 text-sm text-muted-foreground text-left">{clientsData.reduce((s, c) => s + c.services.length, 0)} услуг</td>
                <td className="py-4 px-4 text-sm font-bold text-foreground tabular-nums text-left">{fmtCurrency(totalMrr)}</td>
                <td className="py-4 px-4 text-sm font-bold text-destructive tabular-nums text-left">{fmtCurrency(totalExpenses)}</td>
                <td className="py-4 px-4 text-sm font-bold text-primary tabular-nums text-left">{fmtCurrency(totalMrr - totalExpenses)}</td>
                <td className="py-4 px-4 text-sm font-bold tabular-nums text-left">
                  <span className={totalMrr > 0 ? "text-primary" : "text-muted-foreground"}>{totalMrr > 0 ? Math.round(((totalMrr - totalExpenses) / totalMrr) * 100) : 0}%</span>
                </td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
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
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "40%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "5%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Имя</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Должность</th>
                <th className="text-left text-xs font-medium text-muted-foreground py-3 px-4">Зарплата (₸)</th>
                <th className="py-3 px-1" />
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id} className="group hover:bg-secondary/20 transition-colors">
                  <td className="py-4 px-4 align-middle text-left">
                    <Input value={m.name} onChange={(e) => updateMember(m.id, "name", e.target.value)}
                      className="h-9 text-sm font-medium bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-0 w-full" />
                  </td>
                  <td className="py-4 px-4 align-middle text-left">
                    <Input value={m.role} onChange={(e) => updateMember(m.id, "role", e.target.value)}
                      className="h-9 text-sm text-muted-foreground bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-0 w-full" />
                  </td>
                  <td className="py-4 px-4 align-middle text-left">
                    <Input type="number" value={m.salary || ""} onChange={(e) => updateMember(m.id, "salary", Number(e.target.value))}
                      className="h-9 text-sm tabular-nums font-semibold bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-0 w-full" />
                  </td>
                  <td className="py-4 px-1 align-middle">
                    <button onClick={() => removeMember(m.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-secondary/20">
                <td className="py-4 px-4 text-sm font-bold text-foreground text-left" colSpan={2}>Итого ФОТ</td>
                <td className="py-4 px-4 text-sm font-bold text-foreground tabular-nums text-left">{fmtCurrency(totalSalaries)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
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

  // Fetch months from Supabase
  const fetchMonths = useCallback(async (y: number) => {
    const { data } = await supabase.from("finance_months").select("*").eq("year", y).order("month_index");
    const defaults = generateDefaultMonths(y);
    if (data && data.length > 0) {
      data.forEach(row => {
        if (row.month_index >= 0 && row.month_index < 12) {
          const revenue = Number(row.revenue);
          const expenses = Number(row.expenses);
          const salaries = Number(row.salaries);
          const tax = revenue * 0.1;
          defaults[row.month_index] = {
            ...defaults[row.month_index],
            revenue, expenses, salaries, tax,
            profit: revenue - expenses - salaries - tax,
          };
        }
      });
    }
    setMonthsData(defaults);
  }, []);

  useEffect(() => { fetchMonths(year); }, [year, fetchMonths]);

  const updateMonth = async (idx: number, field: keyof MonthData, value: number) => {
    setMonthsData(prev => prev.map((m, i) => {
      if (i !== idx) return m;
      const updated = { ...m, [field]: value };
      updated.tax = updated.revenue * 0.1;
      updated.profit = updated.revenue - updated.expenses - updated.salaries - updated.tax;
      return updated;
    }));

    // Save to Supabase
    const current = monthsData[idx];
    const updated = { ...current, [field]: value };
    await supabase.from("finance_months").upsert({
      year,
      month_index: idx,
      revenue: field === "revenue" ? value : current.revenue,
      expenses: field === "expenses" ? value : current.expenses,
      salaries: field === "salaries" ? value : current.salaries,
      updated_at: new Date().toISOString(),
    }, { onConflict: "year,month_index" });
  };

  const changeYear = (delta: number) => {
    setYear(prev => prev + delta);
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
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => changeYear(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="rounded-xl bg-card px-6 py-2">
          <span className="text-lg font-bold text-foreground tabular-nums">{year}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => changeYear(1)}>
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
              <TableRow className="border-border/10 hover:bg-transparent">
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
                <TableRow key={m.month} className="border-border/10 hover:bg-secondary/30">
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
              <TableRow className="border-border/10 bg-secondary/20 hover:bg-secondary/30">
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
          <TabsList className="bg-card h-11 p-1 rounded-xl">
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
