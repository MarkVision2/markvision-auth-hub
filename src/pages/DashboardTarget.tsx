import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Rocket,
  AlertTriangle,
  Palette,
  Play,
  RefreshCw,
  TrendingDown,
  CreditCard,
  Users,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";

/* ── Quick Actions ── */
const quickActions = [
  { label: "Создать кампанию", icon: Rocket, color: "text-[hsl(var(--status-good))]", bg: "bg-[hsl(var(--status-good)/0.1)]" },
  { label: "Обновить креативы", icon: Palette, color: "text-[hsl(var(--status-ai))]", bg: "bg-[hsl(var(--status-ai)/0.1)]" },
  { label: "Контент-Завод", icon: Zap, color: "text-[hsl(var(--status-warning))]", bg: "bg-[hsl(var(--status-warning)/0.1)]" },
  { label: "A/B Тест", icon: BarChart3, color: "text-blue-400", bg: "bg-blue-500/10" },
];

/* ── Campaigns ── */
interface Campaign {
  name: string;
  project: string;
  status: "active" | "error" | "paused";
  spend: string;
  budget: string;
  budgetPct: number;
  cpl: string;
  leads: number;
  ctr: string;
}

const campaigns: Campaign[] = [
  { name: "Имплантация — Лид-форма", project: "Avicenna Clinic", status: "active", spend: "82K ₸", budget: "180K ₸", budgetPct: 46, cpl: "2 158 ₸", leads: 38, ctr: "3.2%" },
  { name: "Виниры — Трафик", project: "Beauty Lab", status: "active", spend: "145K ₸", budget: "200K ₸", budgetPct: 73, cpl: "3 222 ₸", leads: 45, ctr: "2.8%" },
  { name: "Лазерная коррекция", project: "NeoVision Eye", status: "active", spend: "98K ₸", budget: "140K ₸", budgetPct: 70, cpl: "3 500 ₸", leads: 28, ctr: "2.1%" },
  { name: "Протезирование — Конверсии", project: "Дентал Тайм", status: "error", spend: "95K ₸", budget: "95K ₸", budgetPct: 100, cpl: "7 917 ₸", leads: 12, ctr: "1.4%" },
  { name: "Осмотр позвоночника", project: "Технология позвоночника", status: "paused", spend: "60K ₸", budget: "150K ₸", budgetPct: 40, cpl: "15 000 ₸", leads: 4, ctr: "0.8%" },
];

const statusMap = {
  active: { label: "Активна", cls: "border-[hsl(var(--status-good)/0.3)] bg-[hsl(var(--status-good)/0.1)] text-[hsl(var(--status-good))]" },
  error: { label: "Ошибка", cls: "border-[hsl(var(--status-critical)/0.3)] bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]" },
  paused: { label: "Пауза", cls: "border-border bg-secondary/40 text-muted-foreground" },
};

/* ── Alerts ── */
const alerts = [
  { project: "Дентал Тайм", issue: "CPL выше нормы ×3", icon: TrendingDown, severity: "warning" as const },
  { project: "Технология позвоночника", issue: "Отвал карты Meta", icon: CreditCard, severity: "critical" as const },
  { project: "Kitarov Clinic", issue: "Выгорание аудитории", icon: Users, severity: "warning" as const },
];

const alertColors = {
  critical: "text-[hsl(var(--status-critical))]",
  warning: "text-[hsl(var(--status-warning))]",
};

export default function DashboardTarget() {
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  return (
    <DashboardLayout breadcrumb="Таргетолог">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Target className="h-5 w-5 text-[hsl(var(--status-ai))]" />
              Панель таргетолога
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Кампании · Бюджеты · Быстрые действия
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono border-[hsl(var(--status-good)/0.3)] text-[hsl(var(--status-good))]">
              {activeCampaigns} активных
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono border-[hsl(var(--status-critical)/0.3)] text-[hsl(var(--status-critical))]">
              {alerts.length} алертов
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              className={`h-auto py-3 flex-col gap-2 border-border hover:border-muted bg-card ${a.color}`}
            >
              <div className={`h-8 w-8 rounded-lg ${a.bg} flex items-center justify-center`}>
                <a.icon className={`h-4 w-4 ${a.color}`} />
              </div>
              <span className="text-[11px] font-medium text-foreground/80">{a.label}</span>
            </Button>
          ))}
        </div>

        {/* Campaigns Table + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Campaigns */}
          <Card className="bg-card border-border lg:col-span-3">
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Play className="h-3.5 w-3.5 text-muted-foreground" />
                <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Кампании
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Кампания", "Статус", "Расход", "Бюджет", "CPL", "Лиды", "CTR"].map((h) => (
                      <th key={h} className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.08em] px-5 py-2 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const st = statusMap[c.status];
                    return (
                      <tr key={c.name} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors cursor-pointer">
                        <td className="px-5 py-2.5">
                          <p className="font-medium text-foreground/90 whitespace-nowrap">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.project}</p>
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge variant="outline" className={`text-[10px] font-mono ${st.cls}`}>{st.label}</Badge>
                        </td>
                        <td className="px-5 py-2.5 font-mono tabular-nums text-foreground/80">{c.spend}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress value={c.budgetPct} className="h-1 w-10 bg-secondary" />
                            <span className="font-mono tabular-nums text-muted-foreground">{c.budgetPct}%</span>
                          </div>
                        </td>
                        <td className={`px-5 py-2.5 font-mono tabular-nums ${parseFloat(c.cpl) > 5000 ? "text-[hsl(var(--status-critical))]" : "text-foreground/80"}`}>
                          {c.cpl}
                        </td>
                        <td className="px-5 py-2.5 font-mono tabular-nums text-foreground/80">{c.leads}</td>
                        <td className="px-5 py-2.5 font-mono tabular-nums text-foreground/70">{c.ctr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Alerts sidebar */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3 text-[hsl(var(--status-critical))]" />
                Алерты
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                  <a.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${alertColors[a.severity]}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground/90 truncate">{a.project}</p>
                    <p className="text-[10px] text-muted-foreground">{a.issue}</p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-[10px] text-muted-foreground h-7">
                <RefreshCw className="h-3 w-3 mr-1" />
                Обновить статусы
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
