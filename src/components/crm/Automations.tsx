import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Zap, MessageCircle, Clock, Bell } from "lucide-react";

interface Automation {
  id: string;
  trigger: string;
  triggerStage: string;
  action: string;
  actionDetail: string;
  enabled: boolean;
  icon: "message" | "clock" | "bell" | "zap";
}

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: "1",
    trigger: "Если сделка перешла в",
    triggerStage: "Новая заявка",
    action: "Отправить WhatsApp",
    actionDetail: "Приветственное сообщение с презентацией услуг и ценами",
    enabled: true,
    icon: "message",
  },
  {
    id: "2",
    trigger: "Если нет ответа более",
    triggerStage: "24 часа",
    action: "Повторное сообщение",
    actionDetail: "Напомнить о записи и предложить удобное время",
    enabled: true,
    icon: "clock",
  },
  {
    id: "3",
    trigger: "Если сделка перешла в",
    triggerStage: "Визит совершен",
    action: "Запросить отзыв",
    actionDetail: "Отправить ссылку на Google/2GIS отзыв через 2 часа",
    enabled: false,
    icon: "bell",
  },
  {
    id: "4",
    trigger: "Если сделка перешла в",
    triggerStage: "Отказ",
    action: "Реактивация",
    actionDetail: "Через 30 дней отправить спецпредложение со скидкой 15%",
    enabled: true,
    icon: "zap",
  },
];

const iconMap = {
  message: MessageCircle,
  clock: Clock,
  bell: Bell,
  zap: Zap,
};

export default function Automations() {
  const [automations, setAutomations] = useState(MOCK_AUTOMATIONS);

  const toggle = (id: string) => {
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Создать сценарий
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {automations.map((auto) => {
          const Icon = iconMap[auto.icon];
          return (
            <div
              key={auto.id}
              className={`bg-[#111] border rounded-lg p-4 transition-all ${
                auto.enabled ? "border-white/[0.08]" : "border-white/[0.04] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <Badge variant="outline" className="border-white/[0.1] text-[10px] text-muted-foreground">
                    {auto.enabled ? "Активно" : "Выкл"}
                  </Badge>
                </div>
                <Switch checked={auto.enabled} onCheckedChange={() => toggle(auto.id)} className="scale-75" />
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Триггер</span>
                  <p className="text-xs text-foreground mt-0.5">
                    {auto.trigger} <span className="text-primary font-medium">[{auto.triggerStage}]</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Действие</span>
                  <p className="text-xs text-foreground mt-0.5">{auto.action}: <span className="text-muted-foreground">{auto.actionDetail}</span></p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
