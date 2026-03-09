import { forwardRef } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Sparkles, DollarSign, Users, Target, Eye, MapPin, ShoppingCart, Flame, TrendingUp } from "lucide-react";
import { fmtMoney, fmtNum, pctChange, TrendPill, PageFooter, SectionTitle, type DailyRow } from "./shared";

interface Page1Props {
    clientName: string;
    dateRange: string;
    now: Date;
    cur: Record<string, number>;
    prev: Record<string, number>;
    compareEnabled: boolean;
}

export const Page1KpiFunnel = forwardRef<HTMLDivElement, Page1Props>(
    ({ clientName, dateRange, now, cur, prev, compareEnabled }, ref) => {

        const cpl = cur.leads > 0 ? cur.spend / cur.leads : 0;
        const cpv = cur.visits > 0 ? cur.spend / cur.visits : 0;
        const cac = cur.sales > 0 ? cur.spend / cur.sales : 0;
        const prevCpl = prev.leads > 0 ? prev.spend / prev.leads : 0;
        const prevCpv = prev.visits > 0 ? prev.spend / prev.visits : 0;
        const prevCac = prev.sales > 0 ? prev.spend / prev.sales : 0;

        const kpis7 = [
            { label: "Расходы", value: fmtMoney(cur.spend), trend: pctChange(cur.spend, prev.spend), good: cur.spend <= prev.spend, icon: DollarSign, accent: false },
            { label: "Лиды", value: fmtNum(cur.leads), trend: pctChange(cur.leads, prev.leads), good: cur.leads >= prev.leads, icon: Users, accent: false },
            { label: "CPL", value: fmtMoney(cpl), trend: pctChange(cpl, prevCpl), good: cpl <= prevCpl, icon: Target, accent: false },
            { label: "Визиты", value: fmtNum(cur.visits), trend: pctChange(cur.visits, prev.visits), good: cur.visits >= prev.visits, icon: Eye, accent: false },
            { label: "CPV", value: fmtMoney(cpv), trend: pctChange(cpv, prevCpv), good: cpv <= prevCpv, icon: MapPin, accent: false },
            { label: "Продажи", value: fmtNum(cur.sales), trend: pctChange(cur.sales, prev.sales), good: cur.sales >= prev.sales, icon: ShoppingCart, accent: false },
            { label: "CAC", value: fmtMoney(cac), trend: pctChange(cac, prevCac), good: cac <= prevCac, icon: Flame, accent: true },
        ];

        const funnel = [
            { label: "Показы", value: cur.impressions, short: fmtNum(cur.impressions) },
            { label: "Клики", value: cur.clicks, short: fmtNum(cur.clicks) },
            { label: "Лиды", value: cur.leads, short: fmtNum(cur.leads) },
            { label: "Визиты", value: cur.visits, short: fmtNum(cur.visits) },
            { label: "Продажи", value: cur.sales, short: fmtNum(cur.sales) },
        ];

        return (
            <div ref={ref} className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30">
                <div className="px-10 pt-10 pb-8 border-b border-border/20">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <span className="text-xl">📊</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground tracking-tight">Маркетинговый отчёт</h1>
                                <p className="text-sm text-muted-foreground mt-0.5">{clientName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-foreground tabular-nums">{dateRange}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">{format(now, "d MMMM yyyy, HH:mm", { locale: ru })}</p>
                            <Badge variant="outline" className="mt-2 text-[10px] border-primary/30 text-primary gap-1">
                                <Sparkles className="h-3 w-3" /> AI Generated
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-7">
                    <SectionTitle>Ключевые показатели</SectionTitle>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        {kpis7.slice(0, 4).map(kpi => (
                            <div key={kpi.label} className="rounded-xl bg-accent/20 border border-border/10 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <kpi.icon className="h-3.5 w-3.5 text-muted-foreground/60" />
                                    <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
                                </div>
                                <p className="text-lg font-bold text-foreground tabular-nums">{kpi.value}</p>
                                {compareEnabled && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <TrendPill value={kpi.trend} good={kpi.good} />
                                        <span className="text-[9px] text-muted-foreground/50">vs нед.</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {kpis7.slice(4).map(kpi => (
                            <div
                                key={kpi.label}
                                className={`rounded-xl p-4 border ${kpi.accent
                                    ? "bg-primary/[0.06] border-primary/25 ring-1 ring-primary/10"
                                    : "bg-accent/20 border-border/10"
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.accent ? "text-primary" : "text-muted-foreground/60"}`} />
                                    <span className={`text-[11px] font-medium ${kpi.accent ? "text-primary" : "text-muted-foreground"}`}>{kpi.label}</span>
                                    {kpi.accent && (
                                        <Badge className="ml-auto text-[8px] h-4 px-1.5 bg-primary/15 text-primary border-primary/20">KEY</Badge>
                                    )}
                                </div>
                                <p className={`text-lg font-bold tabular-nums ${kpi.accent ? "text-primary" : "text-foreground"}`}>{kpi.value}</p>
                                {compareEnabled && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <TrendPill value={kpi.trend} good={kpi.good} />
                                        <span className="text-[9px] text-muted-foreground/50">vs нед.</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-10 py-7 border-t border-border/10">
                    <SectionTitle>Воронка конверсии</SectionTitle>
                    <div className="space-y-0">
                        {funnel.map((step, i) => {
                            const nextStep = funnel[i + 1];
                            const convRate = nextStep && step.value > 0 ? ((nextStep.value / step.value) * 100).toFixed(1) : null;
                            const dropOff = nextStep && step.value > 0 ? (100 - (nextStep.value / step.value) * 100).toFixed(1) : null;
                            const barWidth = funnel[0].value > 0 ? (step.value / funnel[0].value) * 100 : 0;

                            return (
                                <div key={step.label}>
                                    <div className="flex items-center gap-4 py-2">
                                        <span className="text-[11px] text-muted-foreground w-20 text-right shrink-0 font-medium">{step.label}</span>
                                        <div className="flex-1 relative">
                                            <div
                                                className="h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center px-3 transition-all"
                                                style={{ width: `${Math.max(barWidth, 8)}%` }}
                                            >
                                                <span className="text-sm font-bold text-foreground tabular-nums">{step.short}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {convRate && (
                                        <div className="flex items-center gap-4 py-1 ml-24">
                                            <div className="flex items-center gap-3 text-[10px]">
                                                <span className="text-primary font-bold tabular-nums">↓ {convRate}% конверсия</span>
                                                <span className="text-muted-foreground/40">·</span>
                                                <span className="text-destructive/70 tabular-nums">−{dropOff}% потери</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <PageFooter page={1} total={3} />
            </div>
        );
    }
);
Page1KpiFunnel.displayName = "Page1KpiFunnel";
