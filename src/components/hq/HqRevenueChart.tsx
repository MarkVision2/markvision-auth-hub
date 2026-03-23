import { useState, useEffect, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PremiumCard } from "./PremiumCard";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface DailyRow {
  date: string;
  spend: number;
  leads: number;
}

interface Props {
  projectId?: string | null;
}

function aggregateByDate(rows: DailyRow[]) {
  const byDate: Record<string, { spend: number; leads: number }> = {};
  for (const r of rows) {
    if (!byDate[r.date]) byDate[r.date] = { spend: 0, leads: 0 };
    byDate[r.date].spend += Number(r.spend) || 0;
    byDate[r.date].leads += Number(r.leads) || 0;
  }
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
    const dayLabel = format(parseISO(dateStr), "EE", { locale: ru });
    const d = byDate[dateStr] || { spend: 0, leads: 0 };
    result.push({
      day: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
      date: format(parseISO(dateStr), "d MMM", { locale: ru }),
      spend: Math.round(d.spend),
      leads: d.leads,
    });
  }
  return result;
}

export default function HqRevenueChart({ projectId }: Props) {
  const [rows, setRows] = useState<DailyRow[]>([]);

  useEffect(() => {
    if (!projectId) return;

    async function fetchData() {
      const from = format(subDays(new Date(), 6), "yyyy-MM-dd");
      const to = format(new Date(), "yyyy-MM-dd");

      const { data } = await (supabase as any)
        .from("daily_data")
        .select("date, spend, leads")
        .eq("project_id", projectId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true });

      setRows(data || []);
    }
    fetchData();
  }, [projectId]);

  const chartData = useMemo(() => aggregateByDate(rows), [rows]);
  const totalSpend = chartData.reduce((s, d) => s + d.spend, 0);
  const totalLeads = chartData.reduce((s, d) => s + d.leads, 0);

  if (totalSpend === 0 && totalLeads === 0) {
    return (
      <PremiumCard icon={<TrendingUp size={18} />} label="Динамика за неделю" secondaryLabel="Нет данных за последние 7 дней">
        <div className="py-12 text-center text-muted-foreground text-sm">Данные появятся когда рекламные кабинеты начнут работать</div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard
      icon={<TrendingUp size={18} />}
      label="Динамика за неделю"
      secondaryLabel={`Расходы: ${totalSpend.toLocaleString("ru-RU")} ₸ · Лиды: ${totalLeads}`}
      headerRight={
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Расходы</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Лиды</span>
          </div>
        </div>
      }
    >
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.15)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis yAxisId="spend" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))} width={45} />
            <YAxis yAxisId="leads" orientation="right" tick={{ fontSize: 10, fill: "#60a5fa", fontWeight: 500 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: 11, padding: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
              itemStyle={{ fontWeight: 600, padding: "2px 0" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", fontSize: "9px" }}
              formatter={(value: number, name: string) => {
                if (name === "spend") return [`${value.toLocaleString("ru-RU")} ₸`, "Расходы"];
                if (name === "leads") return [value, "Лиды"];
                return [value, name];
              }}
              labelFormatter={(_: string, payload: any[]) => payload[0]?.payload?.date || ""}
            />
            <Area yAxisId="spend" type="monotone" dataKey="spend" name="spend" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#spendGrad)" dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }} activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }} />
            <Area yAxisId="leads" type="monotone" dataKey="leads" name="leads" stroke="#60a5fa" strokeWidth={2} fill="url(#leadsGrad)" dot={{ r: 3, fill: "#60a5fa", strokeWidth: 2, stroke: "hsl(var(--card))" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </PremiumCard>
  );
}
