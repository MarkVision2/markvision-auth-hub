import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Play, Pause, RefreshCw, TrendingUp, TrendingDown, Eye, MousePointerClick } from "lucide-react";

interface Campaign {
  name: string; project: string; status: "active" | "error" | "paused";
  spend: string; budget: string; budgetPct: number; cpl: string;
  leads: number; visits: number; sales: number;
}

const statusMap = {
  active: { label: "Активна", cls: "border-[hsl(var(--status-good)/0.3)] bg-[hsl(var(--status-good)/0.1)] text-[hsl(var(--status-good))]" },
  error: { label: "Ошибка", cls: "border-[hsl(var(--status-critical)/0.3)] bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]" },
  paused: { label: "Пауза", cls: "border-border bg-secondary/40 text-muted-foreground" },
};

interface Props { campaign: Campaign | null; open: boolean; onOpenChange: (open: boolean) => void; }

export default function CampaignDetailSheet({ campaign, open, onOpenChange }: Props) {
  if (!campaign) return null;
  const st = statusMap[campaign.status];
  const cplNum = parseInt(campaign.cpl.replace(/\D/g, ""));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs font-mono ${st.cls}`}>{st.label}</Badge>
          </div>
          <SheetTitle className="text-base font-semibold">{campaign.name}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">{campaign.project}</SheetDescription>
        </SheetHeader>

        <Separator className="bg-border" />

        <div className="py-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Бюджет</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Расход / Бюджет</span>
            <span className="text-sm font-mono font-semibold tabular-nums">{campaign.spend} / {campaign.budget}</span>
          </div>
          <Progress value={campaign.budgetPct} className="h-2 bg-secondary" />
          <p className={`text-right text-xs font-mono ${campaign.budgetPct >= 90 ? "text-[hsl(var(--status-critical))]" : campaign.budgetPct >= 70 ? "text-[hsl(var(--status-warning))]" : "text-muted-foreground"}`}>
            {campaign.budgetPct}% использовано
          </p>
        </div>

        <Separator className="bg-border" />

        <div className="py-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Метрики</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "CPL", value: campaign.cpl, icon: cplNum > 5000 ? TrendingDown : TrendingUp, color: cplNum > 5000 ? "text-[hsl(var(--status-critical))]" : "text-[hsl(var(--status-good))]" },
              { label: "Лиды", value: String(campaign.leads), icon: MousePointerClick, color: "text-foreground" },
              { label: "Визиты", value: String(campaign.visits ?? 0), icon: Eye, color: "text-foreground" },
              { label: "Продажи", value: String(campaign.sales ?? 0), icon: TrendingUp, color: "text-foreground" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-secondary/20 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</span>
                </div>
                <p className={`text-lg font-bold font-mono tabular-nums ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="py-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">Действия</h3>
          <div className="grid grid-cols-2 gap-2">
            {campaign.status === "active" ? (
              <Button variant="outline" size="sm" className="text-sm border-border"><Pause className="h-3.5 w-3.5 mr-1.5" />Пауза</Button>
            ) : (
              <Button variant="outline" size="sm" className="text-sm border-border"><Play className="h-3.5 w-3.5 mr-1.5" />Запуск</Button>
            )}
            <Button variant="outline" size="sm" className="text-sm border-border"><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Обновить</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
