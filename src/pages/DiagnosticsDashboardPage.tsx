import DashboardLayout from "@/components/DashboardLayout";
import { Stethoscope, Users, FileText, Activity, DollarSign } from "lucide-react";

const emptyStats = [
  { title: "Записей на диагностику", icon: Users },
  { title: "Проведено диагностик", icon: Activity },
  { title: "Выдано планов лечения", icon: FileText },
  { title: "Оплачено курсов", icon: DollarSign },
];

const DiagnosticsDashboardPage = () => {
  return (
    <DashboardLayout breadcrumb="Дашборд Диагностики">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Статистика Диагностики</h2>
          <p className="text-sm text-muted-foreground mt-1">Воронка от записи до оплаты лечения</p>
        </div>

        {/* KPI cards — empty state */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {emptyStats.map((stat) => (
            <div key={stat.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                <stat.icon className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <div className="text-2xl font-bold text-foreground">—</div>
              <p className="text-xs text-muted-foreground mt-1">Нет данных</p>
            </div>
          ))}
        </div>

        {/* Empty state message */}
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Stethoscope className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Раздел в разработке</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Статистика диагностик появится после подключения модуля записи пациентов.
            Здесь будет воронка: заявка, запись, приход, план лечения, оплата.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DiagnosticsDashboardPage;
