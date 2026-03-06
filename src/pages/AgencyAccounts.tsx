import { useState, useEffect, useCallback } from "react";
import { Plus, CalendarDays, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import AddAccountSheet from "@/components/agency/AddAccountSheet";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ClientRow = Tables<"clients_config">;

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return new Intl.NumberFormat("ru-RU").format(n);
  return n.toString();
}

const statusConfig = {
  active: { label: "Активен", dot: "bg-emerald-400", text: "text-emerald-400" },
  paused: { label: "Остановлен", dot: "bg-zinc-500", text: "text-zinc-500" },
};

export default function AgencyAccounts() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients_config")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered =
    filter === "all"
      ? clients
      : filter === "paused"
      ? clients.filter((c) => !c.is_active)
      : clients.filter((c) => c.is_active && (c.meta_leads ?? 0) === 0);

  return (
    <DashboardLayout breadcrumb="Агентские кабинеты">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Агентские кабинеты</h1>
        <Button onClick={() => setSheetOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить кабинет
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6 gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">Все кабинеты</TabsTrigger>
            <TabsTrigger value="attention" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">Требуют внимания</TabsTrigger>
            <TabsTrigger value="paused" className="data-[state=active]:bg-accent data-[state=active]:text-foreground text-xs">Остановлены</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" className="gap-2 text-xs border-border bg-secondary text-secondary-foreground hover:text-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          За 30 дней
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent bg-secondary/50">
              <TableHead className="text-xs font-medium text-muted-foreground w-[200px]">Кабинет</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Расходы</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Лиды</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">CPL</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Город</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Бюджет/день</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Нет кабинетов. Добавьте первый!
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const active = c.is_active !== false;
                const s = active ? statusConfig.active : statusConfig.paused;
                const spend = Number(c.spend) || 0;
                const leads = c.meta_leads ?? 0;
                const cpl = leads > 0 ? Math.round(spend / leads) : 0;

                return (
                  <TableRow key={c.id} className="border-b border-border hover:bg-accent/50 transition-colors cursor-pointer">
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground">{c.client_name}</p>
                      <span className={`inline-flex items-center gap-1.5 text-[11px] mt-1 ${s.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{formatNum(spend)} ₸</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">{leads}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {cpl > 0 ? formatNum(cpl) + " ₸" : "—"}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm text-foreground">{c.city || "—"}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {Number(c.daily_budget) > 0 ? formatNum(Number(c.daily_budget)) + " ₸" : "—"}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] ${s.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddAccountSheet open={sheetOpen} onOpenChange={setSheetOpen} onSaved={fetchClients} />
    </DashboardLayout>
  );
}
