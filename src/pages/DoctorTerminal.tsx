import DashboardLayout from "@/components/DashboardLayout";
import { Activity, Users } from "lucide-react";

const DoctorTerminal = () => {
  return (
    <DashboardLayout breadcrumb="Терминал Врача">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Терминал Врача</h2>
          <p className="text-sm text-muted-foreground mt-1">Рабочее пространство для диагностики и ведения пациентов</p>
        </div>

        {/* Empty state */}
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Раздел в разработке</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Терминал врача станет доступен после подключения модуля записи пациентов.
            Здесь будет очередь пациентов, диагностика и оформление планов лечения.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Очередь пациентов</p>
                <p className="text-xs text-muted-foreground">Нет пациентов в очереди</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Сессии сегодня</p>
                <p className="text-xs text-muted-foreground">—</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorTerminal;
