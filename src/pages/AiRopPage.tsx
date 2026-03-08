import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhoneCall, MessageSquare, Trophy, Shield, Activity } from "lucide-react";
import AiRopKpiCards from "@/components/ai-rop/AiRopKpiCards";
import AuditCallsFeed from "@/components/ai-rop/AuditCallsFeed";
import AuditChatsFeed from "@/components/ai-rop/AuditChatsFeed";
import ManagerRating from "@/components/ai-rop/ManagerRating";
import { useAiRopAudits } from "@/hooks/useAiRopAudits";

export default function AiRopPage() {
  const { audits, loading } = useAiRopAudits();
  const [activeTab, setActiveTab] = useState("calls");

  const callsCount = useMemo(() => audits.filter(a => a.interaction_type === "call").length, [audits]);
  const chatsCount = useMemo(() => audits.filter(a => a.interaction_type === "whatsapp").length, [audits]);
  const managersCount = useMemo(() => new Set(audits.map(a => a.manager_name)).size, [audits]);

  return (
    <DashboardLayout breadcrumb="AI-РОП">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">AI-РОП: Контроль качества</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Автоматический аудит звонков и чатов отдела продаж</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/[0.06] border border-primary/15">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary tabular-nums">{audits.length} аудитов</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <AiRopKpiCards audits={audits} loading={loading} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="bg-card border border-border p-1 h-auto gap-1">
            <TabsTrigger
              value="calls"
              className="gap-2 text-xs px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              Звонки
              <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-background/20 text-[10px] font-bold tabular-nums">{callsCount}</span>
            </TabsTrigger>
            <TabsTrigger
              value="chats"
              className="gap-2 text-xs px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Чаты
              <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-background/20 text-[10px] font-bold tabular-nums">{chatsCount}</span>
            </TabsTrigger>
            <TabsTrigger
              value="rating"
              className="gap-2 text-xs px-4 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Trophy className="h-3.5 w-3.5" />
              Рейтинг
              <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-background/20 text-[10px] font-bold tabular-nums">{managersCount}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calls"><AuditCallsFeed audits={audits} loading={loading} /></TabsContent>
          <TabsContent value="chats"><AuditChatsFeed audits={audits} loading={loading} /></TabsContent>
          <TabsContent value="rating"><ManagerRating audits={audits} loading={loading} /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
