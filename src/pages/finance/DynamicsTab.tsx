import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    PiggyBank, Users, Download, TrendingUp,
    ChevronLeft, ChevronRight, Receipt, Target, CircleDollarSign,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { fmtCurrency, KpiCard, Section } from "./shared";

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

export default function DynamicsTab() {
    const [year, setYear] = useState(2026);
    const [monthsData, setMonthsData] = useState<MonthData[]>(generateDefaultMonths(2026));
    const [prevYearData, setPrevYearData] = useState<MonthData[]>(generateDefaultMonths(2025));
    const [viewMode, setViewMode] = useState<"fact" | "plan" | "compare">("fact");
    const [agencyMrr, setAgencyMrr] = useState(0);
    const [agencyFot, setAgencyFot] = useState(0);
    const [agencyExpenses, setAgencyExpenses] = useState(0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const fetchAgencyData = useCallback(async () => {
        const [{ data: clients }, { data: services }, { data: billing }, { data: team }] = await Promise.all([
            supabase.from("clients_config").select("id").eq("is_active", true),
            supabase.from("finance_client_services").select("price, client_config_id"),
            supabase.from("finance_client_billing").select("expenses, client_config_id"),
            supabase.from("finance_team").select("salary"),
        ]);
        const activeIds = new Set((clients || []).map(c => c.id));
        setAgencyMrr((services || []).filter(s => activeIds.has(s.client_config_id)).reduce((sum, s) => sum + Number(s.price), 0));
        setAgencyExpenses((billing || []).filter(b => activeIds.has(b.client_config_id)).reduce((sum, b) => sum + Number(b.expenses), 0));
        setAgencyFot((team || []).reduce((sum, t) => sum + Number(t.salary), 0));
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
        await supabase.from("finance_months").upsert({
            year, month_index: idx,
            revenue: field === "revenue" ? value : current.revenue,
            expenses: field === "expenses" ? value : current.expenses,
            salaries: field === "salaries" ? value : current.salaries,
            plan_revenue: field === "planRevenue" ? value : current.planRevenue,
            plan_expenses: field === "planExpenses" ? value : current.planExpenses,
            plan_salaries: field === "planSalaries" ? value : current.planSalaries,
            updated_at: new Date().toISOString(),
        }, { onConflict: "year,month_index" });
    };

    const autoFillCurrentMonth = async () => {
        if (year !== currentYear) return;
        await updateMonth(currentMonth, "revenue", agencyMrr);
        await updateMonth(currentMonth, "expenses", agencyExpenses);
        await updateMonth(currentMonth, "salaries", agencyFot);
    };

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
        const trend = filled.length >= 2 ? ((filled[filled.length - 1].revenue - filled[0].revenue) / filled[0].revenue * 100) || 0 : 0;
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
