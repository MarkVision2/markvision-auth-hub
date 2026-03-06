import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Target, Handshake, Activity, ChevronRight } from "lucide-react";

const roles = [
  {
    title: "Таргетолог",
    description: "Кампании, бюджеты, креативы, алерты по кабинетам",
    icon: Target,
    path: "/dashboard/target",
    color: "text-[hsl(var(--status-ai))]",
    border: "hover:border-[hsl(var(--status-ai)/0.3)]",
  },
  {
    title: "Отдел продаж",
    description: "Воронка лидов, AI-скоринг, конверсии, план/факт",
    icon: Handshake,
    path: "/dashboard/sales",
    color: "text-[hsl(var(--status-good))]",
    border: "hover:border-[hsl(var(--status-good)/0.3)]",
  },
  {
    title: "Управляющий / PM",
    description: "Обзор проектов, команда, финансы, ИИ-сводка",
    icon: Activity,
    path: "/dashboard/pm",
    color: "text-primary",
    border: "hover:border-primary/30",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout breadcrumb="Штаб-квартира">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Штаб-квартира
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Выберите рабочую панель
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {roles.map((role) => (
            <Card
              key={role.path}
              onClick={() => navigate(role.path)}
              className={`bg-card border-border ${role.border} transition-all cursor-pointer group`}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className={`h-12 w-12 rounded-xl bg-secondary/60 flex items-center justify-center group-hover:bg-secondary transition-colors`}>
                  <role.icon className={`h-6 w-6 ${role.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{role.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{role.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
