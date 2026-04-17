import React from "react";
import { useServiceAnalytics } from "@/hooks/useServiceAnalytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Inbox, TrendingUp, RefreshCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatMoney, formatNum } from "@/components/analytics/analyticsData";
import { Skeleton } from "@/components/ui/skeleton";
import PeriodPicker from "@/components/agency/PeriodPicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export const ServiceAnalyticsTab = () => {
    const { data, loading, period, setPeriod, refresh } = useServiceAnalytics();

    if (loading && data.length === 0) {
        return (
            <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-[200px]" />
                </div>
                <Skeleton className="h-[300px] w-full rounded-2xl animate-pulse bg-muted/20" />
                <Skeleton className="h-[500px] w-full rounded-2xl animate-pulse bg-muted/20" />
            </div>
        );
    }

    const chartData = data.slice(0, 10).map(item => ({
        name: item.service_category,
        revenue: item.revenue,
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">Аналитика по направлениям</h3>
                </div>
                <div className="flex items-center gap-3">
                    <PeriodPicker value={period} onChange={(range: DateRange) => {
                        if (range.from && range.to) {
                            setPeriod({ from: range.from, to: range.to });
                        }
                    }} />
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl border-border bg-card"
                        onClick={() => refresh()}
                        disabled={loading}
                    >
                        <RefreshCcw className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card backdrop-blur-sm flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground shadow-sm">
                    <div className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                        <Inbox className="h-5 w-5 opacity-40 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-sm font-semibold text-foreground">Нет данных по направлениям</p>
                        <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto px-4">
                            Попробуйте изменить период или проверьте настройки UTM-меток.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Visual Header Chart */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/20 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                            <TrendingUp className="h-32 w-32 rotate-12" />
                        </div>
                        
                        <div className="flex items-center justify-between mb-8 relative">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none">Результативность</h3>
                                    <p className="text-sm font-black text-foreground mt-1.5 uppercase tracking-tight">Выручка по направлениям</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest px-2.5 py-1">
                                Top 10 Категорий
                            </Badge>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} strokeOpacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 }}
                                        interval={0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 500 }}
                                        tickFormatter={(val: any) => `${(val / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
                                        contentStyle={{
                                            background: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "12px",
                                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                                        }}
                                        labelStyle={{ fontWeight: 700, marginBottom: "4px", fontSize: "12px" }}
                                        itemStyle={{ color: "hsl(var(--primary))", fontSize: "12px" }}
                                        formatter={(val: number) => [formatMoney(val), "Выручка"]}
                                    />
                                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={32}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.7)"}
                                                className="transition-all duration-300 hover:opacity-100 opacity-90"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* High-Density Data Table */}
                    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase px-6 py-4 tracking-wider">Направление</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right tracking-wider">Расходы</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right tracking-wider">Лиды & CPL</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right tracking-wider">Визиты</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right tracking-wider">Продажи</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right tracking-wider">CAC</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right tracking-wider">Выручка</TableHead>
                                        <TableHead className="text-[10px] font-bold text-muted-foreground uppercase text-right tracking-wider">ROMI</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((item, idx) => (
                                        <TableRow key={item.service_category} className="border-border hover:bg-muted/30 transition-colors">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]" />
                                                    <span className="font-bold text-foreground text-sm tracking-tight">{item.service_category}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                                {formatMoney(item.spend)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-sm font-bold tabular-nums text-foreground">{formatNum(item.leads)}</span>
                                                    <span className="text-[9px] font-medium text-muted-foreground/60 uppercase">CPL: {formatMoney(item.cpl)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                                {formatNum(item.visits)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm tabular-nums text-foreground">
                                                {formatNum(item.sales)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                                {formatMoney(item.cac)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-primary font-black text-sm tabular-nums">
                                                    {formatMoney(item.revenue)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={`font-black tabular-nums border-none px-0 ${item.romi > 0
                                                            ? "text-[hsl(var(--status-good))]"
                                                            : item.romi < 0
                                                                ? "text-destructive"
                                                                : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {item.romi > 0 ? "+" : ""}{item.romi.toFixed(0)}%
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
