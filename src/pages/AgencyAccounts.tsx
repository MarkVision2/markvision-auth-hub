import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddAccountSheet from "@/components/agency/AddAccountSheet";
import type { ClientAccount } from "@/components/agency/ClientCard";

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return new Intl.NumberFormat("ru-RU").format(n);
  return n.toString();
}

type StatusType = "active" | "paused" | "error";

interface TableClient extends Omit<ClientAccount, "status"> {
  status: StatusType;
  cpl: number;
}

const statusConfig: Record<StatusType, { label: string; dot: string; text: string }> = {
  active: { label: "Активен", dot: "bg-emerald-400", text: "text-emerald-400" },
  error: { label: "Ошибка оплаты", dot: "bg-red-500", text: "text-red-400" },
  paused: { label: "Остановлен", dot: "bg-zinc-500", text: "text-zinc-500" },
};

const initialClients: TableClient[] = [
  {
    id: "1",
    client_name: "TechFlow Solutions",
    status: "active",
    spend: { fact: 250000, plan: 500000 },
    leads: { fact: 124, plan: 200 },
    visits: { fact: 48, plan: 80 },
    sales: { fact: 29, plan: 50 },
    clicks: 3420,
    followers: 350,
    cpl: 2016,
    convClickLead: 5,
    convLeadVisit: 40,
    convVisitSale: 60,
  },
  {
    id: "2",
    client_name: "GreenMart Kazakhstan",
    status: "active",
    spend: { fact: 180000, plan: 300000 },
    leads: { fact: 89, plan: 150 },
    visits: { fact: 35, plan: 60 },
    sales: { fact: 18, plan: 35 },
    clicks: 2100,
    followers: 210,
    cpl: 2022,
    convClickLead: 4.2,
    convLeadVisit: 39,
    convVisitSale: 51,
  },
  {
    id: "3",
    client_name: "Astana Motors",
    status: "error",
    spend: { fact: 95000, plan: 200000 },
    leads: { fact: 42, plan: 100 },
    visits: { fact: 15, plan: 40 },
    sales: { fact: 7, plan: 25 },
    clicks: 1800,
    followers: 120,
    cpl: 2262,
    convClickLead: 2.3,
    convLeadVisit: 36,
    convVisitSale: 47,
  },
  {
    id: "4",
    client_name: "Almaty Digital Hub",
    status: "paused",
    spend: { fact: 0, plan: 150000 },
    leads: { fact: 0, plan: 80 },
    visits: { fact: 0, plan: 30 },
    sales: { fact: 0, plan: 15 },
    clicks: 0,
    followers: 45,
    cpl: 0,
    convClickLead: 0,
    convLeadVisit: 0,
    convVisitSale: 0,
  },
];

function FactPlan({ fact, plan, suffix = "" }: { fact: number; plan: number; suffix?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground tabular-nums">{formatNum(fact)}{suffix}</p>
      <p className="text-xs text-muted-foreground tabular-nums">План: {formatNum(plan)}{suffix}</p>
    </div>
  );
}

export default function AgencyAccounts() {
  const [clients, setClients] = useState<TableClient[]>(initialClients);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? clients
      : filter === "paused"
      ? clients.filter((c) => c.status === "paused")
      : clients.filter((c) => c.status === "error" || (c.status === "active" && c.leads.fact < c.leads.plan * 0.5));

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
        <Button variant="outline" className="gap-2 text-xs border-white/[0.06] bg-transparent text-zinc-400 hover:text-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          За 30 дней
        </Button>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-xs font-medium text-zinc-500 w-[200px]">Кабинет</TableHead>
              <TableHead className="text-xs font-medium text-zinc-500">Расходы</TableHead>
              <TableHead className="text-xs font-medium text-zinc-500">Лиды</TableHead>
              <TableHead className="text-xs font-medium text-zinc-500">CPL</TableHead>
              <TableHead className="text-xs font-medium text-zinc-500">Подписчики</TableHead>
              <TableHead className="text-xs font-medium text-zinc-500">Визиты</TableHead>
              <TableHead className="text-xs font-medium text-zinc-500">Продажи</TableHead>
              <TableHead className="text-xs font-medium text-zinc-500 text-right">Конверсии</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const s = statusConfig[c.status];
              return (
                <TableRow key={c.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <TableCell className="py-4">
                    <p className="text-sm font-semibold text-foreground">{c.client_name}</p>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] mt-1 ${s.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <FactPlan fact={c.spend.fact} plan={c.spend.plan} suffix=" ₸" />
                  </TableCell>
                  <TableCell className="py-4">
                    <FactPlan fact={c.leads.fact} plan={c.leads.plan} />
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {c.cpl > 0 ? formatNum(c.cpl) + " ₸" : "—"}
                    </p>
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {c.followers > 0 ? `+${formatNum(c.followers)}` : "—"}
                    </p>
                  </TableCell>
                  <TableCell className="py-4">
                    <FactPlan fact={c.visits.fact} plan={c.visits.plan} />
                  </TableCell>
                  <TableCell className="py-4">
                    <FactPlan fact={c.sales.fact} plan={c.sales.plan} />
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-zinc-500 tabular-nums">Клик → Лид: <span className="text-zinc-400">{c.convClickLead}%</span></p>
                      <p className="text-[11px] text-zinc-500 tabular-nums">Лид → Визит: <span className="text-zinc-400">{c.convLeadVisit}%</span></p>
                      <p className="text-[11px] text-zinc-500 tabular-nums">Визит → Продажа: <span className="text-zinc-400">{c.convVisitSale}%</span></p>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AddAccountSheet open={sheetOpen} onOpenChange={setSheetOpen} onAdd={(client) => setClients((prev) => [{ ...client, cpl: 0, status: "active" as StatusType } as TableClient, ...prev])} />
    </DashboardLayout>
  );
}
