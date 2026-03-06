import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhoneCall, MessageSquare, Trophy } from "lucide-react";
import AiRopKpiCards from "@/components/ai-rop/AiRopKpiCards";
import AuditFeed from "@/components/ai-rop/AuditFeed";
import ManagerRating from "@/components/ai-rop/ManagerRating";

export default function AiRopPage() {
  return (
    <DashboardLayout breadcrumb="AI-РОП">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">AI-РОП: Контроль качества</h1>
          <p className="text-sm text-muted-foreground mt-1">Автоматический аудит звонков и чатов отдела продаж</p>
        </div>

        <AiRopKpiCards />

        <Tabs defaultValue="feed" className="space-y-4">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="feed" className="gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PhoneCall className="h-4 w-4" />
              Аудит звонков и чатов
            </TabsTrigger>
            <TabsTrigger value="rating" className="gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="h-4 w-4" />
              Рейтинг менеджеров
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed"><AuditFeed /></TabsContent>
          <TabsContent value="rating"><ManagerRating /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
