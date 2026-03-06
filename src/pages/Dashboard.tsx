import DashboardLayout from "@/components/DashboardLayout";
import KpiCards from "@/components/dashboard/KpiCards";
import ProjectHealthTable from "@/components/dashboard/ProjectHealthTable";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import AiBriefing from "@/components/dashboard/AiBriefing";
import TeamTasks from "@/components/dashboard/TeamTasks";
import DualCharts from "@/components/dashboard/DualCharts";

export default function Dashboard() {
  return (
    <DashboardLayout breadcrumb="Штаб-квартира">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Штаб-квартира
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Внутренний контроль проектов и AI-инфраструктуры
          </p>
        </div>

        {/* KPI Row */}
        <KpiCards />

        {/* Project Health Table */}
        <ProjectHealthTable />

        {/* Alerts + AI Briefing */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3">
            <AlertsPanel />
          </div>
          <div className="lg:col-span-2">
            <AiBriefing />
          </div>
        </div>

        {/* Team Tasks */}
        <TeamTasks />

        {/* Dual Charts */}
        <DualCharts />
      </div>
    </DashboardLayout>
  );
}
