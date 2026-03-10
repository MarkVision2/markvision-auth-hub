import { forwardRef } from "react";
import { DollarSign, ShoppingCart, Users, TrendingUp, Lock, BarChart3 } from "lucide-react";
import { fmtMoney, PageFooter, SectionTitle, MiniHeader } from "./shared";

interface Page3Props {
    clientName: string;
    dateRange: string;
    leadQuality: unknown[];
    cur: Record<string, number>;
    avgCheck: number;
    cac: number;
    romi: number;
    hasRevenue: boolean;
}

export const Page3LeadQualityUnitEcon = forwardRef<HTMLDivElement, Page3Props>(
    ({ clientName, dateRange, leadQuality, cur, avgCheck, cac, romi, hasRevenue }, ref) => {
        return (
            <div ref={ref} className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-2xl shadow-black/30">
                <MiniHeader clientName={clientName} dateRange={dateRange} subtitle="Продажи и Юнит-экономика" />

                <div className="px-10 py-7">
                    <SectionTitle>Качество трафика (AI Scoring)</SectionTitle>
                    <div className="rounded-xl bg-accent/10 border border-border/15 p-6">
                        <div className="h-6 rounded-full overflow-hidden flex mb-5 ring-1 ring-border/10">
                            {leadQuality.map((seg, i) => (
                                <div key={i} className={`${seg.color} h-full transition-all`} style={{ width: `${seg.pct}%` }} />
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {leadQuality.map((seg, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-sm font-medium text-foreground">{seg.label}</p>
                                    <p className={`text-2xl font-bold tabular-nums mt-1 ${seg.textColor}`}>{seg.pct}%</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{seg.count} лидов</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-10 py-7 border-t border-border/10">
                    <SectionTitle>Юнит-экономика</SectionTitle>
                    <div className="relative">
                        <div>
                            <div className="rounded-xl bg-primary/[0.04] border border-primary/15 overflow-hidden">
                                <div className="px-6 py-4 border-b border-primary/10 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BarChart3 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Финансовая сводка</p>
                                        <p className="text-[10px] text-muted-foreground">Unit Economics · {dateRange}</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-primary/10">
                                    {[
                                        { label: "Общая выручка", value: fmtMoney(cur.revenue), sub: "Total Revenue", icon: DollarSign },
                                        { label: "Средний чек", value: fmtMoney(avgCheck), sub: "Average Order Value", icon: ShoppingCart },
                                        { label: "CAC", value: fmtMoney(cac), sub: "Customer Acquisition Cost", icon: Users },
                                        { label: "ROMI", value: `${romi}%`, sub: "Return on Marketing", icon: TrendingUp },
                                    ].map(item => (
                                        <div key={item.label} className="px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                    <item.icon className="h-3.5 w-3.5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-foreground font-medium">{item.label}</p>
                                                    <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                                                </div>
                                            </div>
                                            <p className="text-xl font-bold text-foreground tabular-nums">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {!hasRevenue && cur.spend > 0 && (
                            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                <Lock className="h-3 w-3 text-amber-500" />
                                <p className="text-[10px] text-amber-500 font-medium">
                                    Данные о выручке не переданы. ROMI и Средний чек рассчитаны как 0.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <PageFooter page={3} total={3} />
            </div>
        );
    }
);
Page3LeadQualityUnitEcon.displayName = "Page3LeadQualityUnitEcon";
