import { useRole } from "@/hooks/useRole";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, TrendingUp } from "lucide-react";

import DecompositionTab from "./finance/DecompositionTab";
import AgencyTab from "./finance/AgencyTab";
import DynamicsTab from "./finance/DynamicsTab";

export default function FinancePage() {
  const { isSuperadmin } = useRole();

  return (
    <DashboardLayout breadcrumb="Финансы">
      <div className="space-y-8 max-w-[1600px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Финансы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Юнит-экономика, агентская аналитика и динамика
          </p>
        </div>

        <Tabs defaultValue="decomposition" className="space-y-6">
          <TabsList className="bg-card h-11 p-1 rounded-xl">
            <TabsTrigger value="decomposition" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
              <Calculator className="h-4 w-4" /> Декомпозиция
            </TabsTrigger>
            <TabsTrigger value="agency" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
              <DollarSign className="h-4 w-4" /> Агентская аналитика
            </TabsTrigger>
            {isSuperadmin && (
              <TabsTrigger value="dynamics" className="text-sm gap-2 rounded-lg data-[state=active]:shadow-sm px-4">
                <TrendingUp className="h-4 w-4" /> Динамика по месяцам
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="decomposition"><DecompositionTab /></TabsContent>
          <TabsContent value="agency"><AgencyTab /></TabsContent>
          {isSuperadmin && <TabsContent value="dynamics"><DynamicsTab /></TabsContent>}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
