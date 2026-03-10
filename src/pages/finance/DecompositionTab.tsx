import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
    Save, Calculator, DollarSign, ArrowRight, Wallet, PiggyBank,
    Target, Users, UserPlus, TrendingUp, Coins,
    ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { fmt, fmtCurrency, KpiCard } from "./shared";
import { useWorkspace } from "@/hooks/useWorkspace";

interface SummaryRow {
    type?: "header" | "row";
    label: string;
    value?: string;
    isAccent?: boolean;
    isRevenue?: boolean;
    isRomi?: boolean;
}

export default function DecompositionTab() {
    const { active } = useWorkspace();
    const MONTHS_RU = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const now = new Date();
    const [planMonthIndex, setPlanMonthIndex] = useState(now.getMonth());
    const [planYear, setPlanYear] = useState(now.getFullYear());
    const [savingPlan, setSavingPlan] = useState(false);

    const [mode, setMode] = useState<"revenue" | "budget">("revenue");
    const [targetRevenue, setTargetRevenue] = useState(5_000_000);
    const [targetBudget, setTargetBudget] = useState(1_000_000);
    const [avgCheck, setAvgCheck] = useState(1_000_000);
    const [crDiagToSale, setCrDiagToSale] = useState(20);
    const [crLeadToDiag, setCrLeadToDiag] = useState(10);
    const [cpl, setCpl] = useState(2000);
    const [salary, setSalary] = useState(150000);

    const calc = useMemo(() => {
        let sales = 0, diagnostics = 0, leads = 0, adBudget = 0, revenue = 0;

        if (mode === "revenue") {
            sales = avgCheck > 0 ? Math.ceil(targetRevenue / avgCheck) : 0;
            diagnostics = crDiagToSale > 0 ? Math.ceil(sales / (crDiagToSale / 100)) : 0;
            leads = crLeadToDiag > 0 ? Math.ceil(diagnostics / (crLeadToDiag / 100)) : 0;
            adBudget = leads * cpl;
            revenue = sales * avgCheck;
        } else {
            leads = cpl > 0 ? Math.floor(targetBudget / cpl) : 0;
            diagnostics = Math.floor(leads * (crLeadToDiag / 100));
            sales = Math.floor(diagnostics * (crDiagToSale / 100));
            adBudget = targetBudget;
            revenue = sales * avgCheck;
        }

        const costPerDiag = diagnostics > 0 ? adBudget / diagnostics : 0;
        const costPerSale = sales > 0 ? adBudget / sales : 0;

        const totalCosts = adBudget + salary;
        const netProfit = revenue - totalCosts;
        const romi = totalCosts > 0 ? Math.round((netProfit / totalCosts) * 100) : 0;

        return { sales, diagnostics, leads, adBudget, revenue, costPerDiag, costPerSale, romi, totalCosts, netProfit };
    }, [mode, targetRevenue, targetBudget, avgCheck, crDiagToSale, crLeadToDiag, cpl, salary]);

    const funnelSteps = mode === "revenue" ? [
        { label: "Целевая выручка", value: `${fmt(targetRevenue)} ₸`, icon: DollarSign, accent: true, sub: null },
        { label: "Нужно продаж", value: String(calc.sales), icon: Target, accent: false, sub: `чек ${fmt(avgCheck)} ₸` },
        { label: "Нужно диагностик", value: String(calc.diagnostics), icon: Users, accent: false, sub: `CR ${crDiagToSale}% → продажа` },
        { label: "Нужно лидов", value: String(calc.leads), icon: UserPlus, accent: false, sub: `CR ${crLeadToDiag}% → диагностика` },
        { label: "Бюджет на рекламу", value: `${fmt(calc.adBudget)} ₸`, icon: Wallet, accent: true, sub: `CPL ${fmt(cpl)} ₸` },
    ] : [
        { label: "Бюджет на рекламу", value: `${fmt(targetBudget)} ₸`, icon: Wallet, accent: true, sub: `CPL ${fmt(cpl)} ₸` },
        { label: "Прогноз лидов", value: String(calc.leads), icon: UserPlus, accent: false, sub: `CR ${crLeadToDiag}% → диагностика` },
        { label: "Прогноз диагностик", value: String(calc.diagnostics), icon: Users, accent: false, sub: `CR ${crDiagToSale}% → продажа` },
        { label: "Прогноз продаж", value: String(calc.sales), icon: Target, accent: false, sub: `чек ${fmt(avgCheck)} ₸` },
        { label: "Прогноз выручки", value: `${fmt(calc.revenue)} ₸`, icon: DollarSign, accent: true, sub: null },
    ];

    const summaryRows: SummaryRow[] = [
        { type: "header", label: "БЛОК 1: ЗАТРАТЫ" },
        { label: "Расходы на рекламу (Бюджет)", value: `${fmt(calc.adBudget)} ₸` },
        { label: "Расходы на маркетинг (Fix ЗП)", value: `${fmt(salary)} ₸` },
        { label: "Общие инвестиции (Бюджет + ЗП)", value: `${fmt(calc.totalCosts)} ₸`, isAccent: true },

        { type: "header", label: "БЛОК 2: ВОРОНКА И СТОИМОСТЬ" },
        { label: "Количество лидов", value: String(calc.leads) },
        { label: "Стоимость лида (CPL)", value: `${fmt(cpl)} ₸` },
        { label: "Количество визитов/диагностик", value: String(calc.diagnostics) },
        { label: "Стоимость визита (CPV)", value: `${fmt(Math.round(calc.adBudget / Math.max(1, calc.diagnostics)))} ₸` },
        { label: "Количество продаж", value: String(calc.sales) },
        { label: "Стоимость продажи/клиента (CAC)", value: `${fmt(Math.round(calc.totalCosts / Math.max(1, calc.sales)))} ₸`, isAccent: true },

        { type: "header", label: "БЛОК 3: ФИНАНСОВЫЙ ИТОГ" },
        { label: "Прогнозная Выручка", value: `${fmt(calc.revenue)} ₸`, isRevenue: true },
        { label: "Реальный ROMI", value: `${calc.romi}%`, isRomi: true },
    ];

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Mode Switcher */}
            <div className="flex bg-secondary/30 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setMode("revenue")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "revenue" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                    От целевой выручки
                </button>
                <button
                    onClick={() => setMode("budget")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "budget" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                    От бюджета
                </button>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                {[
                    mode === "revenue"
                        ? { label: "🎯 Целевая выручка", value: targetRevenue, onChange: setTargetRevenue, suffix: "₸", step: 100000 }
                        : { label: "🎯 Бюджет на рекламу", value: targetBudget, onChange: setTargetBudget, suffix: "₸", step: 100000 },
                    { label: "💼 Зарплата (Fix)", value: salary, onChange: setSalary, suffix: "₸", step: 10000 },
                    { label: "💰 Средний чек", value: avgCheck, onChange: setAvgCheck, suffix: "₸", step: 10000 },
                    { label: "📈 CR лид → диагностика", value: crLeadToDiag, onChange: setCrLeadToDiag, suffix: "%", step: 1 },
                    { label: "📊 CR диагностика → продажа", value: crDiagToSale, onChange: setCrDiagToSale, suffix: "%", step: 1 },
                    { label: "💵 Стоимость лида (CPL)", value: cpl, onChange: setCpl, suffix: "₸", step: 100 },
                ].map((field) => (
                    <div key={field.label} className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between min-h-[88px]">
                        <label className="text-[11px] text-muted-foreground font-medium leading-tight line-clamp-2 min-h-[28px]">{field.label}</label>
                        <div className="relative mt-auto">
                            <Input
                                type="number"
                                value={field.value || ""}
                                onChange={(e) => { const n = Number(e.target.value); if (!isNaN(n)) field.onChange(Math.max(0, n)); }}
                                step={field.step}
                                className="h-10 text-sm font-bold tabular-nums font-mono bg-secondary/50 border-transparent rounded-lg pr-8 focus:border-primary/40"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{field.suffix}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual Reverse Funnel */}
            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    {mode === "revenue" ? "Обратная воронка — от выручки к бюджету" : "Прямая воронка — от бюджета к выручке"}
                </h3>
                <div className="grid grid-cols-5 gap-0 items-stretch">
                    {funnelSteps.map((step, i) => (
                        <div key={step.label} className="flex items-stretch">
                            <div className={`rounded-xl p-4 flex-1 flex flex-col items-center justify-between text-center min-h-[160px] ${step.accent
                                ? "border-2 border-primary/30 bg-primary/[0.06]"
                                : "border border-border bg-secondary/20"
                                }`}>
                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${step.accent ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                                    }`}>
                                    <step.icon className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-tight mt-2 min-h-[24px] flex items-center">{step.label}</p>
                                <p className={`text-lg font-bold tabular-nums font-mono mt-1 ${step.accent ? "text-primary" : "text-foreground"}`}>{step.value}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 min-h-[14px]">{step.sub || "\u00A0"}</p>
                            </div>
                            {i < funnelSteps.length - 1 && (
                                <div className="shrink-0 flex items-center px-1.5">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Сводная таблица</h3>
                </div>
                <div className="divide-y divide-border/50">
                    {summaryRows.map((row, i) => (
                        row.type === "header" ? (
                            <div key={i} className="px-5 py-2 bg-secondary/20 border-y border-border/50 first:border-t-0">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{row.label}</span>
                            </div>
                        ) : (
                            <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                                <span className="text-sm text-foreground">{row.label}</span>
                                <span className={cn(
                                    "text-sm font-bold font-mono tabular-nums",
                                    row.isAccent ? "text-primary" : "text-foreground",
                                    row.isRevenue ? "text-[#10b981]" : "",
                                    row.isRomi ? "text-[#10b981] font-extrabold" : ""
                                )}>
                                    {row.value}
                                </span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard icon={Wallet} label="Расходы" value={fmtCurrency(calc.adBudget)} sub={`${calc.leads} лидов × ${fmt(cpl)} ₸`} />
                <KpiCard icon={UserPlus} label="Лиды" value={String(calc.leads)} sub={`CR ${crLeadToDiag}% → визит`} />
                <KpiCard icon={DollarSign} label="CPL" value={`${fmt(cpl)} ₸`} sub="Стоимость лида" />
                <KpiCard icon={Users} label="Визиты" value={String(calc.diagnostics)} sub={`CR ${crDiagToSale}% → продажа`} />
                <KpiCard icon={Target} label="Оплаты" value={String(calc.sales)} sub="Стоимость CAC с учетом ЗП" />
                <KpiCard icon={Coins} label="Выручка" value={fmtCurrency(calc.revenue)} valueClass="text-[#10b981]" sub="Прогноз по чеку и продажам" />
            </div>

            {/* Save to Plan */}
            <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Save className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Сохранить план в Таблицу показателей</p>
                </div>
                <p className="text-xs text-muted-foreground">
                    План будет сохранён: Расходы {fmtCurrency(calc.adBudget)} · Лиды {calc.leads} · CPL {fmt(cpl)} ₸ · Визиты {calc.diagnostics} · Оплаты {calc.sales} · Выручка {fmtCurrency(calc.revenue)}
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
                                    project_id: active.id === "hq" ? null : active.id
                                };

                                const query = (supabase as any).from("monthly_plans").select("id").eq("month_year", monthYear);
                                if (active.id === "hq") {
                                    query.is("project_id", null);
                                } else {
                                    query.eq("project_id", active.id);
                                }

                                const { data: existing } = await query.limit(1);

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
