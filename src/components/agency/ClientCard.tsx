import { MoreVertical, MousePointer, User, MapPin, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SparklineChart from "./SparklineChart";

export interface ClientAccount {
  id: string; client_name: string; status: "active" | "paused";
  spend: { fact: number; plan: number }; leads: { fact: number; plan: number };
  visits: { fact: number; plan: number }; sales: { fact: number; plan: number };
  clicks: number; followers: number;
  convClickLead: number; convLeadVisit: number; convVisitSale: number;
  sparkSpend?: number[]; sparkLeads?: number[];
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return new Intl.NumberFormat("ru-RU").format(n);
  return n.toString();
}

function formatCompact(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return n.toString();
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const gradients = [
  "from-emerald-500 to-teal-600", "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600", "from-sky-500 to-blue-600", "from-rose-500 to-pink-600",
];

function KpiCell({ label, fact, plan, suffix, trend, spark }: {
  label: string; fact: number; plan: number; suffix?: string; trend: number; spark?: number[];
}) {
  const isUp = trend >= 0;
  return (
    <div className="relative p-4 rounded-xl bg-secondary/20 border border-border">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl xl:text-3xl font-bold text-foreground tracking-tight">
          {formatNum(fact)}
          {suffix && <span className="text-lg font-normal text-muted-foreground ml-0.5">{suffix}</span>}
        </span>
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
          isUp ? "bg-[hsl(var(--status-good)/0.1)] text-[hsl(var(--status-good))]" : "bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]"
        }`}>
          {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isUp ? "+" : ""}{trend}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Цель: {formatCompact(plan)}{suffix || ""}</p>
      {spark && <SparklineChart data={spark} />}
    </div>
  );
}

function FunnelStep({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function FunnelArrow({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <div className="w-4 h-px bg-border" />
      <span className="text-xs font-medium text-[hsl(var(--status-good))]">{rate}%</span>
      <div className="w-4 h-px bg-border" />
    </div>
  );
}

export default function ClientCard({ client }: { client: ClientAccount }) {
  const gradientIdx = parseInt(client.id, 10) % gradients.length;

  return (
    <div className="group rounded-2xl border border-border bg-card backdrop-blur-2xl p-6 shadow-sm transition-all hover:border-muted">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradients[gradientIdx]} flex items-center justify-center text-sm font-bold text-white shadow-lg`}>
            {getInitials(client.client_name)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{client.client_name}</h3>
            <Badge variant="secondary" className="mt-0.5 text-xs px-1.5 py-0 h-4 bg-secondary text-muted-foreground border-0">Meta Ads</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${client.status === "active" ? "bg-[hsl(var(--status-good))] shadow-[0_0_6px_hsl(var(--status-good)/0.5)]" : "bg-muted-foreground"}`} />
            {client.status === "active" ? "Active" : "Paused"}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem>Редактировать</DropdownMenuItem>
              <DropdownMenuItem>Приостановить</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Удалить</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <KpiCell label="Расходы" fact={client.spend.fact} plan={client.spend.plan} suffix=" ₸" trend={12} spark={client.sparkSpend} />
        <KpiCell label="Лиды" fact={client.leads.fact} plan={client.leads.plan} trend={8} spark={client.sparkLeads} />
        <KpiCell label="Визиты" fact={client.visits.fact} plan={client.visits.plan} trend={-5} />
        <KpiCell label="Продажи" fact={client.sales.fact} plan={client.sales.plan} trend={15} />
      </div>

      <div className="flex items-center gap-1.5 pt-4 border-t border-border flex-wrap">
        <FunnelStep icon={MousePointer} value={formatCompact(client.clicks)} label="кликов" />
        <FunnelArrow rate={client.convClickLead} />
        <FunnelStep icon={User} value={String(client.leads.fact)} label="лидов" />
        <FunnelArrow rate={client.convLeadVisit} />
        <FunnelStep icon={MapPin} value={String(client.visits.fact)} label="визитов" />
        <FunnelArrow rate={client.convVisitSale} />
        <FunnelStep icon={CheckCircle} value={String(client.sales.fact)} label="продаж" />
      </div>
    </div>
  );
}
