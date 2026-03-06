import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CampaignDetailSheet from "@/components/sheets/CampaignDetailSheet";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import { toast } from "sonner";
import {
  Rocket,
  ChevronDown,
  MoreHorizontal,
  Copy,
  Pencil,
  Megaphone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── Types ── */
interface Campaign {
  name: string;
  project: string;
  status: "active" | "error" | "paused";
  spend: string;
  budget: string;
  budgetPct: number;
  cpl: string;
  leads: number;
  visits: number;
  sales: number;
  objective: string;
}

interface AdAccount {
  name: string;
  totalSpend: string;
  totalLeads: number;
  totalVisits: number;
  totalSales: number;
  avgCpl: string;
  campaigns: Campaign[];
}

/* ── Data ── */
const adAccounts: AdAccount[] = [
  {
    name: "Клиника AIVA",
    totalSpend: "227K ₸",
    totalLeads: 83,
    totalVisits: 142,
    totalSales: 18,
    avgCpl: "2 735 ₸",
    campaigns: [
      { name: "Имплантация_Алматы_Март", project: "Клиника AIVA", status: "active", spend: "82K ₸", budget: "180K ₸", budgetPct: 46, cpl: "2 158 ₸", leads: 38, visits: 64, sales: 9, objective: "WhatsApp" },
      { name: "Виниры_Алматы_Март", project: "Клиника AIVA", status: "active", spend: "145K ₸", budget: "200K ₸", budgetPct: 73, cpl: "3 222 ₸", leads: 45, visits: 78, sales: 9, objective: "Лид-форма" },
    ],
  },
  {
    name: "NeoVision Eye",
    totalSpend: "98K ₸",
    totalLeads: 28,
    totalVisits: 41,
    totalSales: 6,
    avgCpl: "3 500 ₸",
    campaigns: [
      { name: "Лазерная_коррекция_Март", project: "NeoVision Eye", status: "active", spend: "98K ₸", budget: "140K ₸", budgetPct: 70, cpl: "3 500 ₸", leads: 28, visits: 41, sales: 6, objective: "WhatsApp" },
    ],
  },
  {
    name: "Дентал Тайм",
    totalSpend: "95K ₸",
    totalLeads: 12,
    totalVisits: 15,
    totalSales: 2,
    avgCpl: "7 917 ₸",
    campaigns: [
      { name: "Протезирование_Конверсии", project: "Дентал Тайм", status: "error", spend: "95K ₸", budget: "95K ₸", budgetPct: 100, cpl: "7 917 ₸", leads: 12, visits: 15, sales: 2, objective: "Лиды с сайта" },
    ],
  },
  {
    name: "Технология позвоночника",
    totalSpend: "60K ₸",
    totalLeads: 4,
    totalVisits: 5,
    totalSales: 0,
    avgCpl: "15 000 ₸",
    campaigns: [
      { name: "Осмотр_позвоночника_Февр", project: "Технология позвоночника", status: "paused", spend: "60K ₸", budget: "150K ₸", budgetPct: 40, cpl: "15 000 ₸", leads: 4, visits: 5, sales: 0, objective: "Лид-форма" },
    ],
  },
];

const statusBadge = {
  active: { label: "Активна", cls: "border-[hsl(var(--status-good)/0.3)] bg-[hsl(var(--status-good)/0.08)] text-[hsl(var(--status-good))]" },
  error: { label: "Ошибка", cls: "border-[hsl(var(--status-critical)/0.3)] bg-[hsl(var(--status-critical)/0.08)] text-[hsl(var(--status-critical))]" },
  paused: { label: "Пауза", cls: "border-border bg-secondary/30 text-muted-foreground" },
};

const columns = ["", "Кампания", "Цель", "Расход", "Лиды", "Визиты", "Продажи", ""];

export default function DashboardTarget() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set(adAccounts.map((a) => a.name)));
  const [campaignStates, setCampaignStates] = useState<Record<string, boolean>>(() => {
    const states: Record<string, boolean> = {};
    adAccounts.forEach((acc) =>
      acc.campaigns.forEach((c) => {
        states[c.name] = c.status === "active";
      })
    );
    return states;
  });

  const totalActive = Object.values(campaignStates).filter(Boolean).length;
  const totalCampaigns = adAccounts.reduce((s, a) => s + a.campaigns.length, 0);

  const toggleAccount = (name: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleCampaign = (name: string) => {
    setCampaignStates((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      toast(next[name] ? "Кампания включена" : "Кампания на паузе", { description: name });
      return next;
    });
  };

  return (
    <DashboardLayout breadcrumb="Таргетолог">
      <StaggerContainer className="space-y-5">
        {/* ── Header ── */}
        <FadeUpItem className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Управление рекламой
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {adAccounts.length} кабинетов · {totalCampaigns} кампаний · {totalActive} активных
            </p>
          </div>
          <Button
            onClick={() => setBuilderOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs font-semibold gap-1.5"
          >
            <Rocket className="h-3.5 w-3.5" />
            Создать кампанию
          </Button>
        </FadeUpItem>

        {/* ── Expandable Account Table ── */}
        <FadeUpItem>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_100px_90px_70px_70px_70px_40px] items-center px-4 py-2 border-b border-border bg-secondary/20">
              {columns.map((h, i) => (
                <span key={i} className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
                  {h}
                </span>
              ))}
            </div>

            {/* Accounts */}
            {adAccounts.map((account) => {
              const isOpen = expandedAccounts.has(account.name);
              return (
                <Collapsible key={account.name} open={isOpen} onOpenChange={() => toggleAccount(account.name)}>
                  {/* Account row */}
                  <CollapsibleTrigger asChild>
                    <div className="grid grid-cols-[40px_1fr_100px_90px_70px_90px_70px_40px] items-center px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer group">
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{account.name}</p>
                        <p className="text-[10px] text-muted-foreground">{account.campaigns.length} кампаний</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60">—</span>
                      <span className="text-xs font-mono tabular-nums text-foreground/80">{account.totalSpend}</span>
                      <span className="text-xs font-mono tabular-nums text-foreground/80">{account.totalLeads}</span>
                      <span className="text-xs font-mono tabular-nums text-foreground/80">{account.avgCpl}</span>
                      <span className="text-[10px] text-muted-foreground/60">—</span>
                      <span />
                    </div>
                  </CollapsibleTrigger>

                  {/* Campaign rows */}
                  <CollapsibleContent>
                    {account.campaigns.map((c) => {
                      const st = statusBadge[c.status];
                      const isOn = campaignStates[c.name] ?? false;
                      const cplNum = parseInt(c.cpl.replace(/\D/g, ""));
                      return (
                        <div
                          key={c.name}
                          className="grid grid-cols-[40px_1fr_100px_90px_70px_90px_70px_40px] items-center px-4 py-2.5 border-b border-border last:border-0 bg-secondary/5 hover:bg-accent/20 transition-colors"
                        >
                          {/* Toggle */}
                          <div className="pl-1">
                            <Switch
                              checked={isOn}
                              onCheckedChange={() => toggleCampaign(c.name)}
                              className="scale-75 origin-left"
                            />
                          </div>

                          {/* Name */}
                          <button
                            onClick={() => setSelectedCampaign(c)}
                            className="text-left hover:underline underline-offset-2"
                          >
                            <p className="text-xs font-medium text-foreground/90 truncate">{c.name}</p>
                            <Badge variant="outline" className={`text-[9px] font-mono mt-0.5 ${st.cls}`}>{st.label}</Badge>
                          </button>

                          {/* Objective */}
                          <span className="text-[11px] text-muted-foreground">{c.objective}</span>

                          {/* Spend */}
                          <span className="text-xs font-mono tabular-nums text-foreground/80">{c.spend}</span>

                          {/* Leads */}
                          <span className="text-xs font-mono tabular-nums text-foreground/80">{c.leads}</span>

                          {/* CPL */}
                          <span className={`text-xs font-mono tabular-nums ${cplNum > 5000 ? "text-[hsl(var(--status-critical))]" : "text-foreground/80"}`}>
                            {c.cpl}
                          </span>

                          {/* CTR */}
                          <span className="text-xs font-mono tabular-nums text-foreground/70">{c.ctr}</span>

                          {/* Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem className="text-xs gap-2" onClick={() => toast("Редактирование", { description: c.name })}>
                                <Pencil className="h-3 w-3" /> Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs gap-2" onClick={() => toast("Дублировано", { description: c.name })}>
                                <Copy className="h-3 w-3" /> Дублировать
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </FadeUpItem>
      </StaggerContainer>

      {/* Sheets */}
      <CampaignDetailSheet campaign={selectedCampaign} open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)} />
      <CampaignBuilderSheet open={builderOpen} onOpenChange={setBuilderOpen} />
    </DashboardLayout>
  );
}
