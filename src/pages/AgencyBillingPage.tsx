import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign, TrendingUp, Percent, Bell, Inbox,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Types ── */
interface ClientBilling {
  id: string;
  clientName: string;
  fee: number;
  costs: number;
  profit: number;
  nextBilling: string | null;
  status: "paid" | "pending" | "overdue";
}

/* ── Helpers ── */
const fmt = (v: number) => Math.round(v).toLocaleString("ru-RU") + " ₸";

const statusConfig: Record<string, { label: string; emoji: string; className: string }> = {
  paid: { label: "Оплачено", emoji: "🟢", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending: { label: "Ожидается", emoji: "🟡", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  overdue: { label: "Просрочено", emoji: "🔴", className: "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" },
};

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, valueClass = "text-foreground", sub }: {
  icon: React.ElementType; label: string; value: string; valueClass?: string; sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-bold tracking-tight tabular-nums ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ── Main Page ── */
export default function AgencyBillingPage() {
  const { toast } = useToast();
  const [billings, setBillings] = useState<ClientBilling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        // Fetch clients with their billing and services data
        const { data: clients, error: clientsErr } = await supabase
          .from("clients_config")
          .select("id, client_name")
          .eq("is_active", true)
          .order("client_name");
        if (clientsErr) throw clientsErr;

        const { data: billingData, error: billErr } = await supabase
          .from("finance_client_billing")
          .select("client_config_id, billing_status, expenses, next_billing");
        if (billErr) throw billErr;

        const { data: servicesData, error: servErr } = await supabase
          .from("finance_client_services")
          .select("client_config_id, price");
        if (servErr) throw servErr;

        // Aggregate services fee per client
        const feeMap = new Map<string, number>();
        for (const s of servicesData || []) {
          feeMap.set(s.client_config_id, (feeMap.get(s.client_config_id) || 0) + Number(s.price));
        }

        // Build billing map
        const billingMap = new Map<string, { status: string; expenses: number; next_billing: string | null }>();
        for (const b of billingData || []) {
          billingMap.set(b.client_config_id, {
            status: b.billing_status,
            expenses: Number(b.expenses),
            next_billing: b.next_billing,
          });
        }

        const result: ClientBilling[] = (clients || []).map(c => {
          const fee = feeMap.get(c.id) || 0;
          const billing = billingMap.get(c.id);
          const costs = billing?.expenses || 0;
          const statusRaw = billing?.status || "pending";
          const status = (statusRaw === "paid" || statusRaw === "overdue" ? statusRaw : "pending") as ClientBilling["status"];

          return {
            id: c.id,
            clientName: c.client_name,
            fee,
            costs,
            profit: fee - costs,
            nextBilling: billing?.next_billing || null,
            status,
          };
        });

        setBillings(result);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Ошибка загрузки биллинга";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  const mrr = useMemo(() => billings.reduce((s, b) => s + b.fee, 0), [billings]);
  const totalCosts = useMemo(() => billings.reduce((s, b) => s + b.costs, 0), [billings]);
  const netProfit = mrr - totalCosts;
  const margin = mrr > 0 ? Math.round((netProfit / mrr) * 100) : 0;

  const handleRemind = (clientName: string) => {
    toast({ title: "Напоминание отправлено", description: `Уведомление об оплате отправлено клиенту "${clientName}"` });
  };

  if (loading) {
    return (
      <DashboardLayout breadcrumb="Агентская аналитика">
        <div className="space-y-6 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[140px] rounded-2xl" />)}
          </div>
          <Skeleton className="h-[500px] rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumb="Агентская аналитика">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Агентская аналитика</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Финансовый хаб · биллинг клиентов · юнит-экономика агентства</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            icon={DollarSign}
            label="MRR"
            value={fmt(mrr)}
            valueClass="text-foreground"
            sub={`${billings.length} активных клиентов`}
          />
          <KpiCard
            icon={TrendingUp}
            label="Чистая прибыль"
            value={fmt(netProfit)}
            valueClass={netProfit >= 0 ? "text-primary" : "text-destructive"}
            sub={`MRR − расходы на ИИ инфраструктуру`}
          />
          <KpiCard
            icon={Percent}
            label="Маржинальность"
            value={`${margin}%`}
            valueClass={margin >= 50 ? "text-primary" : margin >= 30 ? "text-amber-400" : "text-destructive"}
            sub="Средняя маржа по всем проектам"
          />
        </div>

        {/* Billing Table */}
        {billings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Inbox className="h-10 w-10 opacity-40" />
            <p className="text-sm">Нет клиентов для отображения</p>
            <p className="text-xs">Добавьте клиентов в clients_config и настройте услуги в finance_client_services</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Биллинг клиентов</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/30 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground px-6">Клиент</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Тариф / Оплата</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Себестоимость ИИ</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-right">Ваша прибыль</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Дата оплаты</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Статус</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-center">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billings.map((b) => {
                    const sc = statusConfig[b.status];
                    return (
                      <TableRow key={b.id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                        <TableCell className="px-6 py-4">
                          <span className="text-sm font-semibold text-foreground">{b.clientName}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono font-semibold text-foreground tabular-nums">{fmt(b.fee)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono text-muted-foreground tabular-nums">{fmt(b.costs)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono font-bold text-primary tabular-nums">{fmt(b.profit)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs text-muted-foreground font-mono">
                            {b.nextBilling ? new Date(b.nextBilling).toLocaleDateString("ru-RU") : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[11px] font-medium ${sc.className}`}>
                            {sc.emoji} {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-primary h-8 gap-1.5"
                            onClick={() => handleRemind(b.clientName)}
                          >
                            <Bell className="h-3.5 w-3.5" />
                            Напомнить
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Totals row */}
                  <TableRow className="bg-secondary/30 border-t border-border/30 hover:bg-secondary/40">
                    <TableCell className="px-6 py-4">
                      <span className="text-sm font-bold text-foreground uppercase tracking-wider">Итого</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-mono font-bold text-foreground tabular-nums">{fmt(mrr)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-mono font-semibold text-muted-foreground tabular-nums">{fmt(totalCosts)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-mono font-bold text-primary tabular-nums">{fmt(netProfit)}</span>
                    </TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
