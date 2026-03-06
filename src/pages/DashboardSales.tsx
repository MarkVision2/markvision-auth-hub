import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SalesLeadDetailSheet from "@/components/sheets/LeadDetailSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  MessageSquare,
  Clock,
  ChevronRight,
  Bot,
  UserCheck,
  Handshake,
  DollarSign,
  TrendingUp,
} from "lucide-react";

/* ── Funnel Stages ── */
interface Stage {
  name: string;
  count: number;
  value: string;
  color: string;
  icon: typeof Phone;
}

const stages: Stage[] = [
  { name: "Новые заявки", count: 18, value: "—", color: "text-blue-400", icon: MessageSquare },
  { name: "Квалификация", count: 12, value: "180K ₸", color: "text-[hsl(var(--status-warning))]", icon: UserCheck },
  { name: "Встреча/Консультация", count: 8, value: "640K ₸", color: "text-[hsl(var(--status-ai))]", icon: Handshake },
  { name: "КП отправлено", count: 5, value: "1.2M ₸", color: "text-purple-400", icon: DollarSign },
  { name: "Оплата", count: 3, value: "750K ₸", color: "text-[hsl(var(--status-good))]", icon: TrendingUp },
];

/* ── Leads Queue ── */
interface Lead {
  name: string;
  project: string;
  source: string;
  aiScore: number;
  time: string;
  phone: string;
  assignedTo: "ai" | "manager";
}

const leadsQueue: Lead[] = [
  { name: "Асель Тұрсынова", project: "Avicenna Clinic", source: "Instagram", aiScore: 92, time: "3 мин", phone: "+7 707 ***", assignedTo: "ai" },
  { name: "Ержан Қасымов", project: "Beauty Lab", source: "Meta Ads", aiScore: 87, time: "12 мин", phone: "+7 747 ***", assignedTo: "manager" },
  { name: "Дина Ахметова", project: "NeoVision Eye", source: "Google Ads", aiScore: 78, time: "25 мин", phone: "+7 701 ***", assignedTo: "ai" },
  { name: "Марат Сериков", project: "Kitarov Clinic", source: "Сайт", aiScore: 65, time: "1ч", phone: "+7 778 ***", assignedTo: "manager" },
  { name: "Айгуль Нурланова", project: "Avicenna Clinic", source: "WhatsApp", aiScore: 95, time: "5 мин", phone: "+7 702 ***", assignedTo: "ai" },
  { name: "Болат Жумабаев", project: "Дентал Тайм", source: "Instagram", aiScore: 42, time: "2ч", phone: "+7 771 ***", assignedTo: "manager" },
];

/* ── KPIs ── */
const salesKpis = [
  { label: "Конверсия", value: "18%", sub: "из лида в оплату", color: "text-[hsl(var(--status-good))]" },
  { label: "Ср. чек", value: "250K ₸", sub: "+12% к пред. мес.", color: "text-foreground" },
  { label: "AI обработал", value: "67%", sub: "лидов автоматически", color: "text-[hsl(var(--status-ai))]" },
  { label: "План/Факт", value: "72%", sub: "до конца месяца", color: "text-[hsl(var(--status-warning))]" },
];

export default function DashboardSales() {
  return (
    <DashboardLayout breadcrumb="Отдел продаж">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Handshake className="h-5 w-5 text-[hsl(var(--status-good))]" />
            Отдел продаж
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Воронка · Лиды · Конверсии
          </p>
        </div>

        {/* Sales KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {salesKpis.map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-medium">{kpi.label}</p>
                <p className={`text-xl font-bold tracking-tight mt-1 ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Funnel */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Воронка продаж
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex items-center gap-1">
              {stages.map((stage, i) => (
                <div key={stage.name} className="flex items-center gap-1 flex-1 min-w-0">
                  <div className="flex-1 rounded-md border border-border bg-secondary/30 p-3 text-center">
                    <stage.icon className={`h-4 w-4 mx-auto mb-1.5 ${stage.color}`} />
                    <p className="text-[10px] text-muted-foreground truncate">{stage.name}</p>
                    <p className={`text-lg font-bold mt-0.5 ${stage.color}`}>{stage.count}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{stage.value}</p>
                  </div>
                  {i < stages.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leads Queue */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Лиды на обработку
              </CardTitle>
              <Badge variant="outline" className="ml-auto text-[10px] font-mono border-[hsl(var(--status-ai)/0.3)] text-[hsl(var(--status-ai))]">
                {leadsQueue.filter(l => l.assignedTo === "ai").length} на AI
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Имя", "Проект", "Источник", "AI Score", "Время", "Кто ведёт"].map((h) => (
                    <th key={h} className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.08em] px-5 py-2 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsQueue.map((lead, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors cursor-pointer">
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-foreground/90">{lead.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{lead.phone}</p>
                    </td>
                    <td className="px-5 py-2.5 text-foreground/70">{lead.project}</td>
                    <td className="px-5 py-2.5 text-muted-foreground">{lead.source}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={lead.aiScore} className="h-1 w-8 bg-secondary" />
                        <span className={`font-mono tabular-nums ${lead.aiScore >= 80 ? "text-[hsl(var(--status-good))]" : lead.aiScore >= 60 ? "text-[hsl(var(--status-warning))]" : "text-muted-foreground"}`}>
                          {lead.aiScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 font-mono tabular-nums text-muted-foreground">{lead.time}</td>
                    <td className="px-5 py-2.5">
                      {lead.assignedTo === "ai" ? (
                        <Badge variant="outline" className="text-[10px] font-mono border-[hsl(var(--status-ai)/0.3)] bg-[hsl(var(--status-ai)/0.1)] text-[hsl(var(--status-ai))]">
                          <Bot className="h-2.5 w-2.5 mr-1" />AI
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                          <Phone className="h-2.5 w-2.5 mr-1" />Менеджер
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
