import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ChatsView from "@/components/crm/ChatsView";
import ClientDatabase from "@/components/crm/ClientDatabase";
import Automations from "@/components/crm/Automations";
import { Kanban, Database, Cpu, MessageCircle } from "lucide-react";

export default function CrmSystem() {
  return (
    <DashboardLayout breadcrumb="CRM System">
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-foreground tracking-tight">CRM System</h1>

        <Tabs defaultValue="chats" className="space-y-4">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="chats" className="gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageCircle className="h-4 w-4" />
              Чаты
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Kanban className="h-4 w-4" />
              Воронка
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-4 w-4" />
              База клиентов
            </TabsTrigger>
            <TabsTrigger value="automations" className="gap-1.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Cpu className="h-4 w-4" />
              Автоматизации
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chats"><ChatsView /></TabsContent>
          <TabsContent value="kanban"><KanbanBoard /></TabsContent>
          <TabsContent value="clients"><ClientDatabase /></TabsContent>
          <TabsContent value="automations"><Automations /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
