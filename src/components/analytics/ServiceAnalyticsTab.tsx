import React from "react";
import { useServiceAnalytics, ServiceAnalyticsData } from "@/hooks/useServiceAnalytics";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Inbox, TrendingUp, DollarSign, Target, UserCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatMoney, formatNum } from "@/components/analytics/analyticsData";
import { Skeleton } from "@/components/ui/skeleton";

export const ServiceAnalyticsTab = () => {
    const { data, loading } = useServiceAnalytics();

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[300px] w-full rounded-2xl" />
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="rounded-2xl border border-border bg-[#0a0a0a] flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Inbox className="h-10 w-10 opacity-40" />
                <p className="text-sm font-medium text-white">Нет данных по направлениям</p>
                <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
                    Убедитесь, что UTM-метки настроены корректно и данные поступают в систему.
                </p>
            </div>
        );
    }

    const chartData = data.slice(0, 10).map(item => ({
        name: item.service_category,
        revenue: item.revenue,
    }));

    return (
        <div className="space-y-6">
            {/* Visual Header Chart */}
            <div className="rounded-2xl border border-border bg-[#0a0a0a] p-6 shadow-2xl">
                <h3 className="text-[13px] font-semibold text-foreground mb-6 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Выручка по направлениям
                </h3>
                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#666", fontSize: 11 }}
                                interval={0}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#666", fontSize: 11 }}
                                tickFormatter={(val: any) => `${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "12px" }}
                                itemStyle={{ color: "#10b981" }}
                                formatter={(val: number) => [formatMoney(val), "Выручка"]}
                            />
                            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#059669"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* High-Density Data Table */}
            <div className="rounded-2xl border border-border bg-[#0a0a0a] overflow-hidden shadow-2xl">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4">Направление</TableHead>
                            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">Расходы</TableHead>
                            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">Лиды & CPL</TableHead>
                            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">Визиты</TableHead>
                            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">Продажи</TableHead>
                            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">CAC</TableHead>
                            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">Выручка</TableHead>
                            <TableHead className="text-[11px] font-bold text-muted-foreground uppercase text-right">ROMI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, idx) => (
                            <TableRow key={item.service_category} className="border-border hover:bg-white/[0.03] transition-colors">
                                <TableCell className="font-semibold text-white py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        {item.service_category}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                    {formatMoney(item.spend)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    <div className="flex flex-col items-end">
                                        <span className="text-white font-medium">{formatNum(item.leads)}</span>
                                        <Badge variant="outline" className="text-[10px] mt-1 border-white/10 bg-white/5 text-muted-foreground font-normal">
                                            CPL: {formatMoney(item.cpl)}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                    {formatNum(item.visits)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-white">
                                    {formatNum(item.sales)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground text-[13px]">
                                    {formatMoney(item.cac)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    <span className="text-emerald-400 font-bold text-base">
                                        {formatMoney(item.revenue)}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right tabular-nums font-black">
                                    <span className={item.romi > 0 ? "text-emerald-500" : item.romi < 0 ? "text-red-500" : "text-muted-foreground"}>
                                        {item.romi > 0 ? "+" : ""}{item.romi.toFixed(0)}%
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
