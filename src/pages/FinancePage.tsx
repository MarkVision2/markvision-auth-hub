import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
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
  ChevronLeft, ChevronRight, ChevronDown, Receipt, Percent, Target, CircleDollarSign, Loader2
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
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-lg font-bold tracking-tight font-mono tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground -mt-0.5">{sub}</p>}
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
   TAB 1 — ДЕКОМПОЗИЦИЯ ЦЕЛИ (Обратная воронка)
   ══════════════════════════════════════════════ */

function DecompositionTab() {
  const MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const now = new Date();
  const [planMonthIndex, setPlanMonthIndex] = useState(now.getMonth());
  const [planYear, setPlanYear] = useState(now.getFullYear());
  const [savingPlan, setSavingPlan] = useState(false);

  // ── Step 1: Целевая выручка
  const [targetRevenue, setTargetRevenue] = useState(5_000_000);
  // ── Step 2: Средний чек
  const [avgCheck, setAvgCheck] = useState(1_000_000);
  // ── Step 3: CR диагностика → продажа
  const [crDiagToSale, setCrDiagToSale] = useState(20);
  // ── Step 4: CR лид → диагностика
  const [crLeadToDiag, setCrLeadToDiag] = useState(10);
  // ── Step 5: Стоимость лида (CPL)
  const [cpl, setCpl] = useState(2000);

  // ── Computed (обратная воронка) ──
  const calc = useMemo(() => {
    const sales = avgCheck > 0 ? Math.ceil(targetRevenue / avgCheck) : 0;
    const diagnostics = crDiagToSale > 0 ? Math.ceil(sales / (crDiagToSale / 100)) : 0;
    const leads = crLeadToDiag > 0 ? Math.ceil(diagnostics / (crLeadToDiag / 100)) : 0;
    const adBudget = leads * cpl;
    const revenue = sales * avgCheck;
    const costPerDiag = diagnostics > 0 ? adBudget / diagnostics : 0;
    const costPerSale = sales > 0 ? adBudget / sales : 0;
    const romi = adBudget > 0 ? Math.round(((revenue - adBudget) / adBudget) * 100) : 0;
    return { sales, diagnostics, leads, adBudget, revenue, costPerDiag, costPerSale, romi };
  }, [targetRevenue, avgCheck, crDiagToSale, crLeadToDiag, cpl]);

  const funnelSteps = [
    { label: "Целевая выручка", value: `${fmt(targetRevenue)} ₸`, icon: DollarSign, accent: true, sub: null },
    { label: "Нужно продаж", value: String(calc.sales), icon: Target, accent: false, sub: `чек ${fmt(avgCheck)} ₸` },
    { label: "Нужно диагностик", value: String(calc.diagnostics), icon: Users, accent: false, sub: `CR ${crDiagToSale}% → продажа` },
    { label: "Нужно лидов", value: String(calc.leads), icon: UserPlus, accent: false, sub: `CR ${crLeadToDiag}% → диагностика` },
    { label: "Бюджет на рекламу", value: `${fmt(calc.adBudget)} ₸`, icon: Wallet, accent: true, sub: `CPL ${fmt(cpl)} ₸` },
  ];

  const summaryRows = [
    { label: "Кол-во диагностик", value: String(calc.diagnostics) },
    { label: "Кол-во продаж", value: String(calc.sales) },
    { label: "Средний чек", value: `${fmt(avgCheck)} ₸` },
    { label: "CR лид → диагностика", value: `${crLeadToDiag}%` },
    { label: "Стоимость диагностики", value: `${fmt(Math.round(calc.costPerDiag))} ₸` },
    { label: "CR диагностика → продажа", value: `${crDiagToSale}%` },
    { label: "Стоимость клиента (CAC)", value: `${fmt(Math.round(calc.costPerSale))} ₸` },
    { label: "Выручка", value: `${fmt(calc.revenue)} ₸` },
    { label: "ROMI", value: `${calc.romi}%` },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Input Fields (Horizontal cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "🎯 Целевая выручка", value: targetRevenue, onChange: setTargetRevenue, suffix: "₸", step: 100000 },
          { label: "💰 Средний чек", value: avgCheck, onChange: setAvgCheck, suffix: "₸", step: 10000 },
          { label: "📊 CR диагностика → продажа", value: crDiagToSale, onChange: setCrDiagToSale, suffix: "%", step: 1 },
          { label: "📈 CR лид → диагностика", value: crLeadToDiag, onChange: setCrLeadToDiag, suffix: "%", step: 1 },
          { label: "💵 Стоимость лида (CPL)", value: cpl, onChange: setCpl, suffix: "₸", step: 100 },
        ].map((field) => (
          <div key={field.label} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <label className="text-[11px] text-muted-foreground font-medium leading-tight">{field.label}</label>
            <div className="relative">
              <Input
                type="number"
                value={field.value || ""}
                onChange={(e) => { const n = Number(e.target.value); if (!isNaN(n)) field.onChange(Math.max(0, n)); }}
                step={field.step}
                className="h-10 text-base font-bold tabular-nums bg-secondary/50 border-transparent rounded-lg pr-8 focus:border-primary/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{field.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Visual Reverse Funnel ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Обратная воронка — от выручки к бюджету
        </h3>
        <div className="flex items-stretch gap-0">
          {funnelSteps.map((step, i) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className={`rounded-xl p-4 flex-1 text-center transition-all ${
                step.accent
                  ? "border-2 border-primary/30 bg-primary/[0.06]"
                  : "border border-border bg-secondary/20"
              }`}>
                <div className={`h-9 w-9 rounded-lg mx-auto mb-2.5 flex items-center justify-center ${
                  step.accent ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium leading-tight">{step.label}</p>
                <p className={`text-lg font-bold tabular-nums mt-1.5 font-mono ${step.accent ? "text-primary" : "text-foreground"}`}>{step.value}</p>
                {step.sub && <p className="text-[10px] text-muted-foreground mt-1">{step.sub}</p>}
              </div>
              {i < funnelSteps.length - 1 && (
                <div className="shrink-0 px-1.5">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary Table ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Сводная таблица</h3>
        </div>
        <div className="divide-y divide-border">
          {summaryRows.map((row, i) => (
            <div key={i} className={`px-5 py-3 flex items-center justify-between ${
              row.label === "ROMI" ? "bg-primary/[0.04]" : ""
            }`}>
              <span className="text-sm text-foreground">{row.label}</span>
              <span className={`text-sm font-bold font-mono tabular-nums ${
                row.label === "ROMI"
                  ? calc.romi >= 0 ? "text-primary" : "text-destructive"
                  : row.label === "Выручка" ? "text-primary" : "text-foreground"
              }`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Wallet} label="Бюджет на рекламу" value={fmtCurrency(calc.adBudget)} sub={`${calc.leads} лидов × ${fmt(cpl)} ₸`} />
        <KpiCard icon={Target} label="Стоимость клиента" value={fmtCurrency(Math.round(calc.costPerSale))} sub="CAC маркетинг" />
        <KpiCard icon={TrendingUp} label="ROMI" value={`${calc.romi}%`} valueClass={calc.romi >= 100 ? "text-primary" : calc.romi >= 0 ? "text-foreground" : "text-destructive"} />
        <KpiCard icon={PiggyBank} label="Прибыль с рекламы" value={fmtCurrency(calc.revenue - calc.adBudget)} valueClass={calc.revenue - calc.adBudget >= 0 ? "text-primary" : "text-destructive"} sub="выручка − бюджет" />
      </div>

      {/* ── Save to Plan ── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Save className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Сохранить план в Таблицу показателей</p>
        </div>
        <p className="text-xs text-muted-foreground">
          План будет сохранён: {calc.leads} лидов · {calc.sales} продаж · {fmtCurrency(calc.adBudget)} бюджет · {fmtCurrency(calc.revenue)} выручка
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => { if (planMonthIndex === 0) { setPlanMonthIndex(11); setPlanYear(y => y - 1); } else setPlanMonthIndex(i => i - 1); }}
              className="h-9 w-9 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center transition-colors">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground px-3 select-none min-w-[140px] text-center">{MONTHS_RU[planMonthIndex]} {planYear}</span>
            <button onClick={() => { if (planMonthIndex === 11) { setPlanMonthIndex(0); setPlanYear(y => y + 1); } else setPlanMonthIndex(i => i + 1); }}
              className="h-9 w-9 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center transition-colors">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <Button
            disabled={savingPlan}
            onClick={async () => {
              setSavingPlan(true);
              try {
                const monthYear = `${planYear}-${String(planMonthIndex + 1).padStart(2, "0")}`;
                const payload: Record<string, any> = {
                  month_year: monthYear,
                  plan_spend: Math.round(calc.adBudget),
                  plan_leads: calc.leads,
                  plan_visits: calc.diagnostics,
                  plan_sales: calc.sales,
                  plan_revenue: Math.round(calc.revenue),
                };

                const { data: existing } = await (supabase as any).from("monthly_plans")
                  .select("id").eq("month_year", monthYear).limit(1);

                if (existing && existing.length > 0) {
                  const { error } = await (supabase as any).from("monthly_plans")
                    .update(payload).eq("id", existing[0].id);
                  if (error) throw error;
                } else {
                  const { error } = await (supabase as any).from("monthly_plans").insert(payload);
                  if (error) throw error;
                }

                toast({ title: "✅ План сохранён!", description: `${MONTHS_RU[planMonthIndex]} ${planYear} — данные перенесены в Таблицу показателей` });
              } catch (e: unknown) {
                toast({ title: "Ошибка", description: e instanceof Error ? e.message : "Не удалось сохранить", variant: "destructive" });
              } finally { setSavingPlan(false); }
            }}
            className="flex-1 h-11 text-sm font-semibold gap-2 rounded-xl"
          >
            {savingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Сохранить план на {MONTHS_RU[planMonthIndex]}
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
                className="h-7 w-[100px] text-xs tabular-nums text-right bg-secondary/50 border-transparent rounded-md px-2" placeholder="Сумма" />
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
              className="h-8 text-xs flex-1 bg-secondary/50 border-transparent rounded-md" />
            <Input type="number" value={newPrice || ""} onChange={(e) => setNewPrice(Number(e.target.value))} placeholder="₸"
              className="h-8 w-[80px] text-xs text-right bg-secondary/50 border-transparent rounded-md tabular-nums" />
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
            <SheetContent className="w-[420px]">
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
  monthIndex: number;
  revenue: number;
  expenses: number;
  salaries: number;
  tax: number;
  profit: number;
  planRevenue: number;
  planExpenses: number;
  planSalaries: number;
  planProfit: number;
}

function generateDefaultMonths(year: number): MonthData[] {
  return monthNames.map((m, i) => ({
    month: `${m} ${year}`, monthIndex: i,
    revenue: 0, expenses: 0, salaries: 0, tax: 0, profit: 0,
    planRevenue: 0, planExpenses: 0, planSalaries: 0, planProfit: 0,
  }));
}

function DynamicsTab() {
  const [year, setYear] = useState(2026);
  const [monthsData, setMonthsData] = useState<MonthData[]>(generateDefaultMonths(2026));
  const [prevYearData, setPrevYearData] = useState<MonthData[]>(generateDefaultMonths(2025));
  const [viewMode, setViewMode] = useState<"fact" | "plan" | "compare">("fact");
  const [agencyMrr, setAgencyMrr] = useState(0);
  const [agencyFot, setAgencyFot] = useState(0);
  const [agencyExpenses, setAgencyExpenses] = useState(0);

  // Get current month index (0-based)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Fetch agency data for auto-fill
  const fetchAgencyData = useCallback(async () => {
    const [{ data: clients }, { data: services }, { data: billing }, { data: team }] = await Promise.all([
      supabase.from("clients_config").select("id").eq("is_active", true),
      supabase.from("finance_client_services").select("price, client_config_id"),
      supabase.from("finance_client_billing").select("expenses, client_config_id"),
      supabase.from("finance_team").select("salary"),
    ]);

    const activeIds = new Set((clients || []).map(c => c.id));
    const mrr = (services || []).filter(s => activeIds.has(s.client_config_id)).reduce((sum, s) => sum + Number(s.price), 0);
    const exp = (billing || []).filter(b => activeIds.has(b.client_config_id)).reduce((sum, b) => sum + Number(b.expenses), 0);
    const fot = (team || []).reduce((sum, t) => sum + Number(t.salary), 0);

    setAgencyMrr(mrr);
    setAgencyFot(fot);
    setAgencyExpenses(exp);
  }, []);

  const parseMonthRows = useCallback((rows: any[], y: number): MonthData[] => {
    const defaults = generateDefaultMonths(y);
    if (rows && rows.length > 0) {
      rows.forEach(row => {
        if (row.month_index >= 0 && row.month_index < 12) {
          const revenue = Number(row.revenue);
          const expenses = Number(row.expenses);
          const salaries = Number(row.salaries);
          const tax = revenue * 0.1;
          const planRevenue = Number(row.plan_revenue || 0);
          const planExpenses = Number(row.plan_expenses || 0);
          const planSalaries = Number(row.plan_salaries || 0);
          const planTax = planRevenue * 0.1;
          defaults[row.month_index] = {
            ...defaults[row.month_index],
            revenue, expenses, salaries, tax,
            profit: revenue - expenses - salaries - tax,
            planRevenue, planExpenses, planSalaries,
            planProfit: planRevenue - planExpenses - planSalaries - planTax,
          };
        }
      });
    }
    return defaults;
  }, []);

  const fetchMonths = useCallback(async (y: number) => {
    const [{ data }, { data: prevData }] = await Promise.all([
      supabase.from("finance_months").select("*").eq("year", y).order("month_index"),
      supabase.from("finance_months").select("*").eq("year", y - 1).order("month_index"),
    ]);
    setMonthsData(parseMonthRows(data || [], y));
    setPrevYearData(parseMonthRows(prevData || [], y - 1));
  }, [parseMonthRows]);

  useEffect(() => { fetchMonths(year); fetchAgencyData(); }, [year, fetchMonths, fetchAgencyData]);

  const updateMonth = async (idx: number, field: string, value: number) => {
    setMonthsData(prev => prev.map((m, i) => {
      if (i !== idx) return m;
      const updated = { ...m, [field]: value };
      updated.tax = updated.revenue * 0.1;
      updated.profit = updated.revenue - updated.expenses - updated.salaries - updated.tax;
      const planTax = updated.planRevenue * 0.1;
      updated.planProfit = updated.planRevenue - updated.planExpenses - updated.planSalaries - planTax;
      return updated;
    }));

    const current = monthsData[idx];
    const dbField = field === "planRevenue" ? "plan_revenue" : field === "planExpenses" ? "plan_expenses" : field === "planSalaries" ? "plan_salaries" : field;

    await supabase.from("finance_months").upsert({
      year,
      month_index: idx,
      revenue: field === "revenue" ? value : current.revenue,
      expenses: field === "expenses" ? value : current.expenses,
      salaries: field === "salaries" ? value : current.salaries,
      plan_revenue: field === "planRevenue" ? value : current.planRevenue,
      plan_expenses: field === "planExpenses" ? value : current.planExpenses,
      plan_salaries: field === "planSalaries" ? value : current.planSalaries,
      updated_at: new Date().toISOString(),
    }, { onConflict: "year,month_index" });
  };

  // Auto-fill current month from agency data
  const autoFillCurrentMonth = async () => {
    if (year !== currentYear) return;
    await updateMonth(currentMonth, "revenue", agencyMrr);
    await updateMonth(currentMonth, "expenses", agencyExpenses);
    await updateMonth(currentMonth, "salaries", agencyFot);
  };

  // Simple forecast: average of filled months projected forward
  const forecast = useMemo(() => {
    const filled = monthsData.filter(m => m.revenue > 0);
    if (filled.length === 0) return null;
    const avgRevenue = filled.reduce((s, m) => s + m.revenue, 0) / filled.length;
    const avgExpenses = filled.reduce((s, m) => s + m.expenses, 0) / filled.length;
    const avgSalaries = filled.reduce((s, m) => s + m.salaries, 0) / filled.length;
    const remaining = 12 - filled.length;
    const projectedRevenue = filled.reduce((s, m) => s + m.revenue, 0) + avgRevenue * remaining;
    const projectedExpenses = filled.reduce((s, m) => s + m.expenses, 0) + avgExpenses * remaining;
    const projectedSalaries = filled.reduce((s, m) => s + m.salaries, 0) + avgSalaries * remaining;
    const projectedTax = projectedRevenue * 0.1;
    const projectedProfit = projectedRevenue - projectedExpenses - projectedSalaries - projectedTax;
    const trend = filled.length >= 2
      ? ((filled[filled.length - 1].revenue - filled[0].revenue) / filled[0].revenue * 100) || 0
      : 0;
    return { projectedRevenue, projectedExpenses, projectedSalaries, projectedTax, projectedProfit, avgRevenue, remaining, trend, filledCount: filled.length };
  }, [monthsData]);

  const changeYear = (delta: number) => setYear(prev => prev + delta);

  const totals = useMemo(() => ({
    revenue: monthsData.reduce((s, m) => s + m.revenue, 0),
    expenses: monthsData.reduce((s, m) => s + m.expenses, 0),
    salaries: monthsData.reduce((s, m) => s + m.salaries, 0),
    tax: monthsData.reduce((s, m) => s + m.tax, 0),
    profit: monthsData.reduce((s, m) => s + m.profit, 0),
    planRevenue: monthsData.reduce((s, m) => s + m.planRevenue, 0),
    planExpenses: monthsData.reduce((s, m) => s + m.planExpenses, 0),
    planSalaries: monthsData.reduce((s, m) => s + m.planSalaries, 0),
    planProfit: monthsData.reduce((s, m) => s + m.planProfit, 0),
  }), [monthsData]);

  const prevTotals = useMemo(() => ({
    revenue: prevYearData.reduce((s, m) => s + m.revenue, 0),
    profit: prevYearData.reduce((s, m) => s + m.profit, 0),
  }), [prevYearData]);

  const yoyGrowth = prevTotals.revenue > 0 ? ((totals.revenue - prevTotals.revenue) / prevTotals.revenue * 100) : null;
  const planCompletion = totals.planRevenue > 0 ? Math.round((totals.revenue / totals.planRevenue) * 100) : null;

  const chartData = monthsData.map((m, i) => ({
    name: m.month.split(" ")[0],
    Факт: m.revenue,
    План: m.planRevenue,
    Расходы: m.expenses + m.salaries + m.tax,
    Прибыль: m.profit,
    "Прогноз": (forecast && m.revenue === 0 && i > (forecast.filledCount - 1)) ? forecast.avgRevenue : null,
    "Прошлый год": prevYearData[i]?.revenue || 0,
  }));

  return (
    <div className="space-y-8">
      {/* Year switcher + controls */}
      <div className="flex items-center gap-4 flex-wrap">
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

        <div className="flex items-center gap-1.5 bg-secondary/50 rounded-xl p-1">
          {([["fact", "Факт"], ["plan", "План vs Факт"], ["compare", "Год к году"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setViewMode(key)}
              className={`text-xs font-medium py-2 px-3.5 rounded-lg transition-all ${viewMode === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        {year === currentYear && (
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1.5 h-8 ml-auto" onClick={autoFillCurrentMonth}>
            <Download className="h-3.5 w-3.5" /> Подтянуть из агентской ({monthNames[currentMonth]})
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={CircleDollarSign} label="Выручка за год" value={fmtCurrency(totals.revenue)}
          sub={planCompletion !== null ? `${planCompletion}% от плана` : undefined} />
        <KpiCard icon={Target} label="Расходы" value={fmtCurrency(totals.expenses)} valueClass="text-destructive" />
        <KpiCard icon={Users} label="ФОТ" value={fmtCurrency(totals.salaries)} valueClass="text-destructive" />
        <KpiCard icon={PiggyBank} label="Чистая прибыль" value={fmtCurrency(totals.profit)}
          valueClass={totals.profit >= 0 ? "text-primary" : "text-destructive"}
          sub={yoyGrowth !== null ? `${yoyGrowth >= 0 ? "+" : ""}${yoyGrowth.toFixed(0)}% к ${year - 1}` : undefined} />
        {forecast ? (
          <KpiCard icon={TrendingUp} label="Прогноз на год" value={fmtCurrency(forecast.projectedRevenue)}
            sub={`${forecast.filledCount}/12 мес. заполнено`} valueClass="text-primary" />
        ) : (
          <KpiCard icon={Receipt} label="Налоги (10%)" value={fmtCurrency(totals.tax)} valueClass="text-status-warning" />
        )}
      </div>

      {/* Forecast card */}
      {forecast && forecast.remaining > 0 && (
        <div className="rounded-2xl bg-primary/[0.04] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Прогноз до конца года</span>
            {forecast.trend !== 0 && (
              <Badge variant="secondary" className={`text-[10px] ${forecast.trend > 0 ? "text-primary" : "text-destructive"}`}>
                {forecast.trend > 0 ? "↑" : "↓"} {Math.abs(forecast.trend).toFixed(0)}% тренд
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Прогноз выручки</p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-1">{fmtCurrency(forecast.projectedRevenue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Прогноз прибыли</p>
              <p className={`text-lg font-bold tabular-nums mt-1 ${forecast.projectedProfit >= 0 ? "text-primary" : "text-destructive"}`}>{fmtCurrency(forecast.projectedProfit)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Ср. выручка/мес</p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-1">{fmtCurrency(forecast.avgRevenue)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Осталось месяцев</p>
              <p className="text-lg font-bold text-foreground tabular-nums mt-1">{forecast.remaining}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title={viewMode === "compare" ? `Выручка: ${year} vs ${year - 1}` : viewMode === "plan" ? "План vs Факт" : "Выручка vs Расходы"}>
          <div className="p-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 0 ? `${(v / 1000000).toFixed(1)}M` : "0"} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "none", borderRadius: 12, fontSize: 13, padding: "10px 14px" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => fmtCurrency(value)}
                    cursor={{ fill: "hsl(var(--muted) / 0.3)", radius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  {viewMode === "compare" ? (
                    <>
                      <Bar dataKey="Факт" name={String(year)} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Прошлый год" name={String(year - 1)} fill="hsl(var(--muted-foreground) / 0.3)" radius={[6, 6, 0, 0]} />
                    </>
                  ) : viewMode === "plan" ? (
                    <>
                      <Bar dataKey="План" fill="hsl(var(--muted-foreground) / 0.2)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Факт" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="Факт" name="Выручка" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Расходы" fill="hsl(var(--destructive) / 0.7)" radius={[6, 6, 0, 0]} />
                    </>
                  )}
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
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => v !== 0 ? `${(v / 1000000).toFixed(1)}M` : "0"} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "none", borderRadius: 12, fontSize: 13, padding: "10px 14px" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => value ? fmtCurrency(value) : "—"}
                  />
                  <Area type="monotone" dataKey="Прибыль" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#profitGrad)" dot={{ fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2, r: 5 }} />
                  <Area type="monotone" dataKey="Прогноз" stroke="hsl(var(--primary) / 0.4)" strokeWidth={2} strokeDasharray="6 4" fill="url(#forecastGrad)" dot={false} connectNulls={false} />
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
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium pl-6">Месяц</TableHead>
                <TableHead className="text-xs font-medium text-right">Выручка</TableHead>
                {viewMode === "plan" && <TableHead className="text-xs font-medium text-right text-muted-foreground/60">План</TableHead>}
                {viewMode === "plan" && <TableHead className="text-xs font-medium text-right">%</TableHead>}
                <TableHead className="text-xs font-medium text-right">Расходы</TableHead>
                <TableHead className="text-xs font-medium text-right">ФОТ</TableHead>
                {viewMode === "compare" && <TableHead className="text-xs font-medium text-right text-muted-foreground/60">{year - 1}</TableHead>}
                <TableHead className="text-xs font-medium text-right">Налоги</TableHead>
                <TableHead className="text-xs font-medium text-right pr-6">Прибыль</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthsData.map((m, i) => {
                const completion = m.planRevenue > 0 ? Math.round((m.revenue / m.planRevenue) * 100) : null;
                const isCurrentMonth = year === currentYear && i === currentMonth;
                return (
                  <TableRow key={m.month} className={`hover:bg-secondary/30 ${isCurrentMonth ? "bg-primary/[0.03]" : ""}`}>
                    <TableCell className={`text-sm font-medium pl-6 ${isCurrentMonth ? "text-primary" : "text-foreground"}`}>
                      {m.month} {isCurrentMonth && <span className="text-[10px] text-primary ml-1">●</span>}
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={m.revenue || ""} onChange={(e) => updateMonth(i, "revenue", Number(e.target.value))}
                        className="h-9 text-sm tabular-nums bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 text-right w-[130px] ml-auto" />
                    </TableCell>
                    {viewMode === "plan" && (
                      <TableCell>
                        <Input type="number" value={m.planRevenue || ""} onChange={(e) => updateMonth(i, "planRevenue", Number(e.target.value))}
                          className="h-9 text-sm tabular-nums text-muted-foreground/60 bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 text-right w-[130px] ml-auto" />
                      </TableCell>
                    )}
                    {viewMode === "plan" && (
                      <TableCell className="text-right tabular-nums text-sm pr-2">
                        {completion !== null ? (
                          <span className={`font-semibold ${completion >= 100 ? "text-primary" : completion >= 70 ? "text-status-warning" : "text-destructive"}`}>
                            {completion}%
                          </span>
                        ) : <span className="text-muted-foreground/30">—</span>}
                      </TableCell>
                    )}
                    <TableCell>
                      <Input type="number" value={m.expenses || ""} onChange={(e) => updateMonth(i, "expenses", Number(e.target.value))}
                        className="h-9 text-sm tabular-nums text-destructive bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 text-right w-[130px] ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={m.salaries || ""} onChange={(e) => updateMonth(i, "salaries", Number(e.target.value))}
                        className="h-9 text-sm tabular-nums bg-transparent border-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus:border-primary/40 rounded-lg px-2 text-right w-[130px] ml-auto" />
                    </TableCell>
                    {viewMode === "compare" && (
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground/50 pr-4">
                        {prevYearData[i]?.revenue > 0 ? fmtCurrency(prevYearData[i].revenue) : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-right tabular-nums text-sm text-status-warning pr-4">{m.tax > 0 ? fmtCurrency(m.tax) : "—"}</TableCell>
                    <TableCell className={`text-right tabular-nums text-sm font-semibold pr-6 ${m.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                      {m.revenue > 0 ? fmtCurrency(m.profit) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-secondary/20 hover:bg-secondary/30">
                <TableCell className="pl-6 text-sm font-bold text-foreground">Итого</TableCell>
                <TableCell className="text-right tabular-nums text-sm font-bold text-foreground">{fmtCurrency(totals.revenue)}</TableCell>
                {viewMode === "plan" && <TableCell className="text-right tabular-nums text-sm font-bold text-muted-foreground/60">{fmtCurrency(totals.planRevenue)}</TableCell>}
                {viewMode === "plan" && (
                  <TableCell className="text-right tabular-nums text-sm font-bold">
                    {totals.planRevenue > 0 ? (
                      <span className={Math.round(totals.revenue / totals.planRevenue * 100) >= 100 ? "text-primary" : "text-status-warning"}>
                        {Math.round(totals.revenue / totals.planRevenue * 100)}%
                      </span>
                    ) : "—"}
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums text-sm font-bold text-destructive">{fmtCurrency(totals.expenses)}</TableCell>
                <TableCell className="text-right tabular-nums text-sm font-bold text-foreground">{fmtCurrency(totals.salaries)}</TableCell>
                {viewMode === "compare" && <TableCell className="text-right tabular-nums text-sm font-bold text-muted-foreground/50">{prevTotals.revenue > 0 ? fmtCurrency(prevTotals.revenue) : "—"}</TableCell>}
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
  const { isSuperadmin } = useRole();

  return (
    <DashboardLayout breadcrumb="Финансы">
      <div className="space-y-8 max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Финансы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperadmin ? "Юнит-экономика, агентская P&L и динамика" : "Юнит-экономика и планирование"}
          </p>
        </div>

        <Tabs defaultValue="decomposition" className="space-y-6">
          <TabsList className="bg-card h-11 p-1 rounded-xl">
            <TabsTrigger value="decomposition" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
              <Calculator className="h-4 w-4" /> Декомпозиция
            </TabsTrigger>
            {isSuperadmin && (
              <TabsTrigger value="agency" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
                <DollarSign className="h-4 w-4" /> Агентская аналитика
              </TabsTrigger>
            )}
            {isSuperadmin && (
              <TabsTrigger value="dynamics" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
                <TrendingUp className="h-4 w-4" /> Динамика по месяцам
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="decomposition"><DecompositionTab /></TabsContent>
          {isSuperadmin && <TabsContent value="agency"><AgencyTab /></TabsContent>}
          {isSuperadmin && <TabsContent value="dynamics"><DynamicsTab /></TabsContent>}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
