import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ClientDatabase from "@/components/crm/ClientDatabase";
import Automations from "@/components/crm/Automations";
import { Kanban, Database, Cpu } from "lucide-react";

export default function CrmSystem() {
  return (
    <DashboardLayout breadcrumb="CRM System">
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight">CRM System</h1>

        <Tabs defaultValue="kanban" className="space-y-5">
          <TabsList className="bg-secondary/50 border border-white/[0.06]">
            <TabsTrigger value="kanban" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Kanban className="h-3.5 w-3.5" />
              Канбан (Воронка)
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-3.5 w-3.5" />
              База клиентов
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Cpu className="h-3.5 w-3.5" />
              Автоматизации
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <KanbanBoard />
          </TabsContent>
          <TabsContent value="clients">
            <ClientDatabase />
          </TabsContent>
          <TabsContent value="automations">
            <Automations />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
