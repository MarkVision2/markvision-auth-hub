import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SparklineChart from "@/components/agency/SparklineChart";
import CampaignDetailSheet from "@/components/sheets/CampaignDetailSheet";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Rocket,
  ChevronDown,
  MoreHorizontal,
  Copy,
  Pencil,
  Megaphone,
  Search,
  AlertTriangle,
  TrendingDown,
  CreditCard,
  Play,
  Pause,
  Download,
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
  sparkline: number[];
}

interface ClientAccount {
  id: string;
  name: string;
  campaigns: Campaign[];
}

/* ── Alerts (mock — later from DB/edge function) ── */
const alerts = [
  { account: "Дентал Тайм", campaign: "Протезирование_Конверсии", issue: "Бюджет исчерпан на 100%", icon: CreditCard, severity: "critical" as const },
  { account: "Технология позвоночника", campaign: "Осмотр_позвоночника_Февр", issue: "CPL ×3 выше нормы", icon: TrendingDown, severity: "warning" as const },
  { account: "Клиника AIVA", campaign: "Виниры_Алматы_Март", issue: "73% бюджета за 10 дней", icon: AlertTriangle, severity: "warning" as const },
];

const alertSeverityColor = {
  critical: "text-[hsl(var(--status-critical))]",
  warning: "text-[hsl(var(--status-warning))]",
};

/* ── Mock campaigns per client (later from Meta API) ── */
const mockCampaigns: Record<string, Campaign[]> = {
  "Клиника AIVA": [
    { name: "Имплантация_Алматы_Март", project: "Клиника AIVA", status: "active", spend: "82K ₸", budget: "180K ₸", budgetPct: 46, cpl: "2 158 ₸", leads: 38, visits: 64, sales: 9, objective: "WhatsApp", sparkline: [3, 5, 4, 7, 6, 8, 5] },
    { name: "Виниры_Алматы_Март", project: "Клиника AIVA", status: "active", spend: "145K ₸", budget: "200K ₸", budgetPct: 73, cpl: "3 222 ₸", leads: 45, visits: 78, sales: 9, objective: "Лид-форма", sparkline: [6, 8, 7, 9, 5, 4, 6] },
  ],
  "NeoVision Eye": [
    { name: "Лазерная_коррекция_Март", project: "NeoVision Eye", status: "active", spend: "98K ₸", budget: "140K ₸", budgetPct: 70, cpl: "3 500 ₸", leads: 28, visits: 41, sales: 6, objective: "WhatsApp", sparkline: [2, 4, 3, 5, 6, 4, 4] },
  ],
  "Дентал Тайм": [
    { name: "Протезирование_Конверсии", project: "Дентал Тайм", status: "error", spend: "95K ₸", budget: "95K ₸", budgetPct: 100, cpl: "7 917 ₸", leads: 12, visits: 15, sales: 2, objective: "Лиды с сайта", sparkline: [1, 2, 1, 2, 3, 1, 2] },
  ],
  "Технология позвоночника": [
    { name: "Осмотр_позвоночника_Февр", project: "Технология позвоночника", status: "paused", spend: "60K ₸", budget: "150K ₸", budgetPct: 40, cpl: "15 000 ₸", leads: 4, visits: 5, sales: 0, objective: "Лид-форма", sparkline: [1, 0, 1, 0, 1, 1, 0] },
  ],
};

const statusBadge = {
  active: { label: "Активна", cls: "border-[hsl(var(--status-good)/0.3)] bg-[hsl(var(--status-good)/0.08)] text-[hsl(var(--status-good))]" },
  error: { label: "Ошибка", cls: "border-[hsl(var(--status-critical)/0.3)] bg-[hsl(var(--status-critical)/0.08)] text-[hsl(var(--status-critical))]" },
  paused: { label: "Пауза", cls: "border-border bg-secondary/30 text-muted-foreground" },
};

type StatusFilter = "all" | "active" | "error" | "paused";

export default function DashboardTarget() {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [campaignStates, setCampaignStates] = useState<Record<string, boolean>>({});

  // Fetch real client accounts from Supabase, attach mock campaigns
  const fetchAccounts = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("clients_config")
      .select("id, client_name, is_active")
      .eq("is_active", true);

    if (data) {
      const mapped: ClientAccount[] = (data as any[]).map((c) => ({
        id: c.id,
        name: c.client_name,
        campaigns: mockCampaigns[c.client_name] ?? [],
      })).filter((a: ClientAccount) => a.campaigns.length > 0);

      setAccounts(mapped);
      setExpandedAccounts(new Set(mapped.map((a: ClientAccount) => a.name)));

      // Init campaign states
      const states: Record<string, boolean> = {};
      mapped.forEach((acc: ClientAccount) =>
        acc.campaigns.forEach((c) => {
          if (!(c.name in campaignStates)) {
            states[c.name] = c.status === "active";
          }
        })
      );
      setCampaignStates((prev) => ({ ...states, ...prev }));
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  /* ── Filtered data ── */
  const filteredAccounts = useMemo(() => {
    return accounts
      .map((acc) => ({
        ...acc,
        campaigns: acc.campaigns.filter((c) => {
          const matchesStatus = statusFilter === "all" || c.status === statusFilter;
          const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || acc.name.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesStatus && matchesSearch;
        }),
      }))
      .filter((acc) => acc.campaigns.length > 0);
  }, [accounts, searchQuery, statusFilter]);

  const totalCampaigns = accounts.reduce((s, a) => s + a.campaigns.length, 0);
  const totalActive = Object.values(campaignStates).filter(Boolean).length;

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

  const bulkToggleAll = (on: boolean) => {
    setCampaignStates((prev) => {
      const next = { ...prev };
      filteredAccounts.forEach((acc) => acc.campaigns.forEach((c) => { next[c.name] = on; }));
      return next;
    });
    toast(on ? "Все кампании включены" : "Все кампании на паузе");
  };

  return (
    <DashboardLayout breadcrumb="Таргетолог">
      <StaggerContainer className="space-y-4">
        {/* ── Header ── */}
        <FadeUpItem className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Центр управления рекламой
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {accounts.length} кабинетов · {totalCampaigns} кампаний · {totalActive} активных
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

        {/* ── Alerts ── */}
        {alerts.length > 0 && (
          <FadeUpItem>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-[hsl(var(--status-critical))]" />
                  Алерты · {alerts.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {alerts.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/10 p-2.5">
                      <a.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${alertSeverityColor[a.severity]}`} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground/90 truncate">{a.campaign}</p>
                        <p className="text-[10px] text-muted-foreground">{a.issue}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">{a.account}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeUpItem>
        )}

        {/* ── Filters + Search + Bulk Actions ── */}
        <FadeUpItem className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск кампании..."
              className="pl-8 h-8 text-xs bg-secondary/30 border-border"
            />
          </div>

          <div className="flex items-center gap-1">
            {([
              { value: "all" as StatusFilter, label: "Все" },
              { value: "active" as StatusFilter, label: "Активные" },
              { value: "paused" as StatusFilter, label: "Пауза" },
              { value: "error" as StatusFilter, label: "Ошибки" },
            ]).map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === f.value
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground/70 hover:bg-secondary/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-border gap-1" onClick={() => bulkToggleAll(true)}>
              <Play className="h-3 w-3" /> Вкл. все
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-border gap-1" onClick={() => bulkToggleAll(false)}>
              <Pause className="h-3 w-3" /> Выкл. все
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-border gap-1" onClick={() => toast("Экспорт данных", { description: "CSV файл скачивается" })}>
              <Download className="h-3 w-3" /> Экспорт
            </Button>
          </div>
        </FadeUpItem>

        {/* ── Campaign Table ── */}
        <FadeUpItem>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_90px_80px_60px_60px_64px_36px] items-center px-4 py-2 border-b border-border bg-secondary/20">
              {["", "Кампания", "Цель", "Бюджет", "Лиды", "Визиты", "7д", ""].map((h, i) => (
                <span key={i} className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground whitespace-nowrap">
                  {h}
                </span>
              ))}
            </div>

            {filteredAccounts.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                Ничего не найдено
              </div>
            )}

            {filteredAccounts.map((account) => {
              const isOpen = expandedAccounts.has(account.name);
              return (
                <Collapsible key={account.name} open={isOpen} onOpenChange={() => toggleAccount(account.name)}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer group">
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{account.name}</p>
                        <p className="text-[10px] text-muted-foreground">{account.campaigns.length} кампаний</p>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    {account.campaigns.map((c) => {
                      const st = statusBadge[c.status];
                      const isOn = campaignStates[c.name] ?? false;
                      return (
                        <div
                          key={c.name}
                          className="grid grid-cols-[40px_1fr_90px_80px_60px_60px_64px_36px] items-center px-4 py-2.5 border-b border-border last:border-0 bg-secondary/5 hover:bg-accent/20 transition-colors"
                        >
                          <div className="pl-1">
                            <Switch
                              checked={isOn}
                              onCheckedChange={() => toggleCampaign(c.name)}
                              className="scale-75 origin-left"
                            />
                          </div>

                          <button
                            onClick={() => setSelectedCampaign(c)}
                            className="text-left hover:underline underline-offset-2"
                          >
                            <p className="text-xs font-medium text-foreground/90 truncate">{c.name}</p>
                            <Badge variant="outline" className={`text-[9px] font-mono mt-0.5 ${st.cls}`}>{st.label}</Badge>
                          </button>

                          <span className="text-[11px] text-muted-foreground">{c.objective}</span>
                          <div>
                            <span className="text-xs font-mono tabular-nums text-foreground/80">{c.spend}</span>
                            <p className="text-[9px] text-muted-foreground">/ {c.budget}</p>
                          </div>
                          <span className="text-xs font-mono tabular-nums text-foreground/80">{c.leads}</span>
                          <span className="text-xs font-mono tabular-nums text-foreground/80">{c.visits}</span>

                          <div className="w-14">
                            <SparklineChart
                              data={c.sparkline}
                              color={c.status === "error" ? "hsl(350 89% 60%)" : "hsl(160 84% 39%)"}
                            />
                          </div>

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

      <CampaignDetailSheet campaign={selectedCampaign} open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)} />
      <CampaignBuilderSheet open={builderOpen} onOpenChange={setBuilderOpen} />
    </DashboardLayout>
  );
}
