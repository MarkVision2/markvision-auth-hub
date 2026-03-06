import DashboardLayout from "@/components/DashboardLayout";
import HqAiSearch from "@/components/hq/HqAiSearch";
import HqKpiCards from "@/components/hq/HqKpiCards";
import HqAnomalyRadar from "@/components/hq/HqAnomalyRadar";
import HqAiDirector from "@/components/hq/HqAiDirector";
import HqDataFlow from "@/components/hq/HqDataFlow";
import HqRolePanels from "@/components/hq/HqRolePanels";

export default function Dashboard() {
  return (
    <DashboardLayout breadcrumb="Штаб-квартира">
      <div className="space-y-6">
        <HqAiSearch />
        <HqKpiCards />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <HqAnomalyRadar />
          </div>
          <div className="lg:col-span-2">
            <HqAiDirector />
          </div>
        </div>
        <HqDataFlow />
        <HqRolePanels />
      </div>
    </DashboardLayout>
  );
}
