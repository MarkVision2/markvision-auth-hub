import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import KanbanBoard from "@/components/crm/KanbanBoard";
import ChatsView from "@/components/crm/ChatsView";
import ClientDatabase from "@/components/crm/ClientDatabase";
import Automations from "@/components/crm/Automations";
import AddLeadSheet from "@/components/crm/AddLeadSheet";
import { Kanban, Database, Cpu, MessageCircle, Plus } from "lucide-react";

export default function CrmSystem() {
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  return (
    <DashboardLayout breadcrumb="CRM System">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground tracking-tight">CRM System</h1>
          <Button size="sm" className="gap-1.5" onClick={() => setAddLeadOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Новый лид
          </Button>
        </div>

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

        <AddLeadSheet open={addLeadOpen} onOpenChange={setAddLeadOpen} />
      </div>
    </DashboardLayout>
  );
}
