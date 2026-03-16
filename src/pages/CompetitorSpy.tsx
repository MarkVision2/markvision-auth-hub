import DashboardLayout from "@/components/DashboardLayout";
import { CompetitorAnalysis } from "@/components/content/CompetitorAnalysis";

export default function CompetitorSpy() {
  return (
    <DashboardLayout breadcrumb="Мониторинг конкурентов">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Конкуренты & Анализ Instagram</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Слежка за конкурентами · AI-анализ профилей · Разбор контента · Генерация сценариев
          </p>
        </div>
        <CompetitorAnalysis />
      </div>
    </DashboardLayout>
  );
}
