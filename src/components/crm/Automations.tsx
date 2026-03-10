import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Zap, MessageCircle, Clock, Bell, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";

interface Automation {
  id: string;
  trigger_type: string;
  trigger_value: string;
  action_type: string;
  action_detail: string | null;
  icon: string | null;
  is_enabled: boolean;
}

const iconMap: Record<string, any> = { message: MessageCircle, clock: Clock, bell: Bell, zap: Zap };
const TRIGGER_TYPES = [
  { value: "stage_change", label: "Смена этапа" },
  { value: "no_response", label: "Нет ответа (таймер)" },
  { value: "new_lead", label: "Новый лид" },
];
const ACTION_TYPES = [
  { value: "send_whatsapp", label: "Отправить WhatsApp" },
  { value: "send_notification", label: "Уведомление" },
  { value: "reactivation", label: "Реактивация" },
  { value: "request_review", label: "Запросить отзыв" },
];

export default function Automations() {
  const { active } = useWorkspace();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ trigger_type: "stage_change", trigger_value: "", action_type: "send_whatsapp", action_detail: "", icon: "zap" });

  const fetchAutomations = useCallback(async () => {
    if (active.id === "hq") {
      setAutomations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("crm_automations")
      .select("*")
      .eq("project_id", active.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setAutomations((data as Automation[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAutomations(); }, [fetchAutomations]);

  const toggle = async (id: string, current: boolean) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_enabled: !current } : a));
    const { error } = await (supabase as any).from("crm_automations").update({ is_enabled: !current }).eq("id", id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); fetchAutomations(); }
  };

  const handleCreate = async () => {
    if (!form.trigger_value.trim()) { toast({ title: "Укажите значение триггера" }); return; }
    const { error } = await (supabase as any).from("crm_automations").insert({
      project_id: active.id,
      trigger_type: form.trigger_type,
      trigger_value: form.trigger_value.trim(),
      action_type: form.action_type,
      action_detail: form.action_detail.trim() || null,
      icon: form.icon,
      is_enabled: true,
    });
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Сценарий создан" });
    setSheetOpen(false);
    setForm({ trigger_type: "stage_change", trigger_value: "", action_type: "send_whatsapp", action_detail: "", icon: "zap" });
    fetchAutomations();
  };

  const handleDelete = async (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
    const { error } = await (supabase as any).from("crm_automations").delete().eq("id", id);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); fetchAutomations(); }
    else toast({ title: "Удалено" });
  };

  const triggerLabel = (t: string) => TRIGGER_TYPES.find(x => x.value === t)?.label || t;
  const actionLabel = (a: string) => ACTION_TYPES.find(x => x.value === a)?.label || a;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => setSheetOpen(true)}>
          <Plus className="h-3.5 w-3.5" />Создать сценарий
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : automations.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Нет автоматизаций. Создайте первый сценарий.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {automations.map((auto) => {
            const Icon = iconMap[auto.icon || "zap"] || Zap;
            return (
              <div key={auto.id} className={`bg-card border rounded-lg p-4 transition-all ${auto.is_enabled ? "border-border" : "border-border/50 opacity-60"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <Badge variant="outline" className="border-border text-xs text-muted-foreground">{auto.is_enabled ? "Активно" : "Выкл"}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(auto.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Switch checked={auto.is_enabled} onCheckedChange={() => toggle(auto.id, auto.is_enabled)} className="scale-75" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Триггер</span>
                    <p className="text-sm text-foreground mt-0.5">{triggerLabel(auto.trigger_type)}: <span className="text-primary font-medium">[{auto.trigger_value}]</span></p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Действие</span>
                    <p className="text-sm text-foreground mt-0.5">{actionLabel(auto.action_type)}{auto.action_detail ? `: ${auto.action_detail}` : ""}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md bg-card border-border">
          <SheetHeader>
            <SheetTitle className="text-base font-semibold">Новый сценарий</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Тип триггера</label>
              <Select value={form.trigger_type} onValueChange={v => setForm(f => ({ ...f, trigger_type: v }))}>
                <SelectTrigger className="mt-1 bg-secondary/50 border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Значение триггера</label>
              <Input
                className="mt-1 bg-secondary/50 border-border text-sm"
                placeholder={form.trigger_type === "stage_change" ? "Напр: Новая заявка" : form.trigger_type === "no_response" ? "Напр: 24 часа" : "Описание..."}
                value={form.trigger_value}
                onChange={e => setForm(f => ({ ...f, trigger_value: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Действие</label>
              <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v }))}>
                <SelectTrigger className="mt-1 bg-secondary/50 border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Описание действия</label>
              <Textarea
                className="mt-1 bg-secondary/50 border-border text-sm min-h-[60px] resize-none"
                placeholder="Что именно отправить / сделать..."
                value={form.action_detail}
                onChange={e => setForm(f => ({ ...f, action_detail: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Иконка</label>
              <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                <SelectTrigger className="mt-1 bg-secondary/50 border-border text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zap">⚡ Zap</SelectItem>
                  <SelectItem value="message">💬 Message</SelectItem>
                  <SelectItem value="clock">⏰ Clock</SelectItem>
                  <SelectItem value="bell">🔔 Bell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreate}>Создать сценарий</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
