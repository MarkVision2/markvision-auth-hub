import { useState } from "react";
import { Plus, CalendarDays } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientCard, { type ClientAccount } from "@/components/agency/ClientCard";
import AddAccountSheet from "@/components/agency/AddAccountSheet";

const initialClients: ClientAccount[] = [
  {
    id: "1",
    client_name: "TechFlow Solutions",
    status: "active",
    spend: { fact: 250000, plan: 500000 },
    leads: { fact: 124, plan: 200 },
    visits: { fact: 48, plan: 80 },
    sales: { fact: 29, plan: 50 },
    clicks: 3420,
    followers: 1250,
    convClickLead: 5,
    convLeadVisit: 40,
    convVisitSale: 60,
    sparkSpend: [18000, 32000, 28000, 42000, 38000, 45000, 47000],
    sparkLeads: [12, 18, 14, 22, 19, 21, 18],
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
    followers: 870,
    convClickLead: 4.2,
    convLeadVisit: 39,
    convVisitSale: 51,
    sparkSpend: [22000, 25000, 20000, 30000, 28000, 32000, 23000],
    sparkLeads: [10, 13, 11, 16, 14, 13, 12],
  },
  {
    id: "3",
    client_name: "Astana Motors",
    status: "paused",
    spend: { fact: 95000, plan: 200000 },
    leads: { fact: 42, plan: 100 },
    visits: { fact: 15, plan: 40 },
    sales: { fact: 7, plan: 25 },
    clicks: 1800,
    followers: 540,
    convClickLead: 2.3,
    convLeadVisit: 36,
    convVisitSale: 47,
    sparkSpend: [15000, 18000, 12000, 14000, 16000, 10000, 10000],
    sparkLeads: [8, 7, 5, 6, 7, 5, 4],
  },
];

export default function AgencyAccounts() {
  const [clients, setClients] = useState<ClientAccount[]>(initialClients);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? clients : filter === "paused" ? clients.filter((c) => c.status === "paused") : clients.filter((c) => c.status === "active" && c.leads.fact < c.leads.plan * 0.5);

  return (
    <DashboardLayout breadcrumb="Агентские кабинеты">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Агентские кабинеты</h1>
        <Button onClick={() => setSheetOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить кабинет
        </Button>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-white/[0.03] border border-white/[0.04]">
            <TabsTrigger value="all" className="data-[state=active]:bg-white/[0.06] text-xs">Все кабинеты</TabsTrigger>
            <TabsTrigger value="attention" className="data-[state=active]:bg-white/[0.06] text-xs">Требуют внимания</TabsTrigger>
            <TabsTrigger value="paused" className="data-[state=active]:bg-white/[0.06] text-xs">Остановлены</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" className="gap-2 text-xs border-white/[0.06] bg-transparent text-zinc-400 hover:text-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          За 30 дней
        </Button>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <ClientCard key={c.id} client={c} />
        ))}
      </div>

      <AddAccountSheet open={sheetOpen} onOpenChange={setSheetOpen} onAdd={(client) => setClients((prev) => [client, ...prev])} />
    </DashboardLayout>
  );
}
