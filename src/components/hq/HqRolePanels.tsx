import { useNavigate } from "react-router-dom";
import { Target, Handshake, Activity, ChevronRight } from "lucide-react";

const roles = [
  {
    title: "Таргетолог",
    description: "Кампании, бюджеты, алерты",
    icon: Target,
    path: "/dashboard/target",
    color: "text-[hsl(var(--status-ai))]",
    border: "border-[hsl(var(--status-ai)/0.1)] hover:border-[hsl(var(--status-ai)/0.3)]",
  },
  {
    title: "Отдел продаж",
    description: "Воронка лидов, конверсии, план/факт",
    icon: Handshake,
    path: "/dashboard/sales",
    color: "text-primary",
    border: "border-primary/10 hover:border-primary/30",
  },
  {
    title: "Управляющий / PM",
    description: "Проекты, визиты, продажи, задачи команды",
    icon: Activity,
    path: "/dashboard/pm",
    color: "text-primary",
    border: "border-primary/10 hover:border-primary/30",
  },
];

export default function HqRolePanels() {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-3">Рабочие панели</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {roles.map((role) => (
          <div
            key={role.path}
            onClick={() => navigate(role.path)}
            className={`rounded-xl border ${role.border} bg-white/[0.02] backdrop-blur-xl p-4 flex items-center gap-3 cursor-pointer group transition-colors hover:bg-white/[0.04]`}
          >
            <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <role.icon className={`h-5 w-5 ${role.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{role.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{role.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
