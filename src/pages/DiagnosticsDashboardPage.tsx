import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Stethoscope, Users, FileText, Activity, DollarSign, 
  TrendingUp, ArrowUpRight, Award, UserCheck, Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/components/crm/KanbanBoard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const DiagnosticsDashboardPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("leads_crm")
        .select("*")
        .eq("is_diagnostic", true);
      
      if (!error && data) {
        setLeads(data);
      }
      setLoading(false);
    };

    fetchLeads();
  }, []);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("ru-RU").format(amount);
  };

  const stats = useMemo(() => {
    const total = leads.length;
    const completed = leads.filter(l => l.status === "Визит совершен" || l.pipeline === "doctor").length;
    const revenue = leads.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const avgTicket = total > 0 ? revenue / (leads.filter(l => Number(l.amount) > 0).length || 1) : 0;

    return [
      { 
        title: "Записей на диагностику", 
        value: total, 
        icon: Users, 
        color: "text-blue-500", 
        bg: "bg-blue-500/10",
        trend: "+14% за неделю"
      },
      { 
        title: "Проведено диагностик", 
        value: completed, 
        icon: Activity, 
        color: "text-purple-500", 
        bg: "bg-purple-500/10",
        trend: `${Math.round((completed / (total || 1)) * 100)}% конверсия`
      },
      { 
        title: "Общая выручка", 
        value: `${formatAmount(revenue)} ₸`, 
        icon: DollarSign, 
        color: "text-emerald-500", 
        bg: "bg-emerald-500/10",
        trend: "Назначено лечений"
      },
      { 
        title: "Средний чек пакета", 
        value: `${formatAmount(Math.round(avgTicket))} ₸`, 
        icon: TrendingUp, 
        color: "text-orange-500", 
        bg: "bg-orange-500/10",
        trend: "По назначениям"
      },
    ];
  }, [leads]);

  const adminStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    leads.forEach(l => {
      const admin = l.serviced_by || "Не указан";
      if (!map[admin]) map[admin] = { count: 0, revenue: 0 };
      map[admin].count++;
      map[admin].revenue += (Number(l.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [leads]);

  const doctorStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; packages: Set<string> }> = {};
    leads.forEach(l => {
      const doctor = l.doctor_name || "Не назначен";
      if (!map[doctor]) map[doctor] = { count: 0, revenue: 0, packages: new Set() };
      
      if (l.status === "Визит совершен" || l.pipeline === "doctor") {
        map[doctor].count++;
        map[doctor].revenue += (Number(l.amount) || 0);
        ((l.prescribed_packages as string[]) || []).forEach(p => { if (p) map[doctor].packages.add(p); });
      }
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [leads]);

  return (
    <DashboardLayout breadcrumb="Дашборд Диагностики">
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Activity className="h-6 w-6" />
              </div>
              Аналитика Диагностик
            </h2>
            <p className="text-sm font-medium text-muted-foreground mt-1 ml-13">Мониторинг эффективности воронки и команды</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="h-10 px-4 rounded-xl font-bold bg-background/50 border-border/60">Последние 30 дней</Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Загрузка данных...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.title} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <stat.icon className="h-14 w-14" />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                      <stat.icon className="w-4.5 h-4.5" />
                    </div>
                    <Badge variant="outline" className="border-none bg-secondary/30 text-[8px] font-black tracking-widest px-1.5 py-0 uppercase opacity-50">Live</Badge>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.title}</span>
                  <div className="text-2xl font-black text-foreground tabular-nums tracking-tighter mt-1">{stat.value}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">{stat.trend}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Admins Table */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      Эффективность Администраторов
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-11">Конверсия в запись и продажу</p>
                  </div>
                  <Award className="h-6 w-6 text-yellow-500 opacity-20" />
                </div>

                <div className="space-y-4">
                  {adminStats.length === 0 ? (
                    <div className="py-8 text-center text-xs font-bold text-muted-foreground opacity-40 italic">Нет данных по администраторам</div>
                  ) : (
                    adminStats.map(([name, data], i) => (
                      <div key={name} className="group relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-secondary/30 flex items-center justify-center font-black text-xs text-muted-foreground">
                              #{i+1}
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground">{name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{data.count} записей на диагностику</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-foreground tabular-nums">{formatAmount(data.revenue)} ₸</p>
                            <p className="text-[9px] font-bold text-emerald-500 uppercase">Top Performer</p>
                          </div>
                        </div>
                        <Progress value={(data.count / (leads.length || 1)) * 100} className="h-2 rounded-full bg-secondary/20" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Doctors Table */}
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      Эффективность Врачей
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-11">Результативность приемов и пакетов</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-emerald-500 opacity-20" />
                </div>

                <div className="space-y-4">
                   {doctorStats.length === 0 ? (
                    <div className="py-8 text-center text-xs font-bold text-muted-foreground opacity-40 italic">Нет данных по врачам</div>
                  ) : (
                    doctorStats.map(([name, data], i) => (
                      <div key={name} className="p-4 rounded-2xl border border-border/40 hover:border-primary/30 transition-all group overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:rotate-12 transition-transform">
                            <Briefcase className="h-10 w-10" />
                         </div>
                         <div className="flex items-start justify-between mb-3">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                {name[0]}
                              </div>
                              <div>
                                <h4 className="font-black text-foreground">{name}</h4>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="secondary" className="bg-primary/5 text-primary text-[9px] font-black border-none uppercase px-1.5 py-0">
                                    {data.count} ПРИЕМОВ
                                  </Badge>
                                </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-lg font-black text-foreground tabular-nums tracking-tighter">{formatAmount(data.revenue)} ₸</div>
                              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Общая выручка</div>
                           </div>
                         </div>
                         <div className="flex flex-wrap gap-1.5 mt-2">
                            {Array.from(data.packages).map(pkg => (
                              <Badge key={pkg} variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-border/60 py-0 px-2">
                                {pkg}
                              </Badge>
                            ))}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DiagnosticsDashboardPage;
