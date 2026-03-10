import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";
import { Phone, AlertCircle } from "lucide-react";



interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STAGES = [
  "Новая заявка", "Без ответа", "В работе", "Счет выставлен",
  "Записан", "Визит совершен", "Оплачен", "Отказ",
];

export default function AddLeadSheet({ open, onOpenChange }: Props) {
  const { active } = useWorkspace();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    source: "WhatsApp",
    amount: "",
    status: "Новая заявка",
    doctor_name: "",
    office_name: ""
  });
  const [saving, setSaving] = useState(false);

  const DOCTORS = ["Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Смирнова А.В."];
  const OFFICES = ["Кабинет 101", "Кабинет 102", "Кабинет 203", "Кабинет 205"];

  const handleCreate = async () => {
    if (!form.name.trim()) { toast({ title: "Укажите имя клиента" }); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("leads").insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      source: form.source || null,
      amount: form.amount ? Number(form.amount) : 0,
      status: form.status,
      doctor_name: form.doctor_name || null,
      office_name: form.office_name || null,
      project_id: active.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Лид создан", description: form.name });
    setForm({
      name: "",
      phone: "",
      source: "WhatsApp",
      amount: "",
      status: "Новая заявка",
      doctor_name: "",
      office_name: ""
    });
    onOpenChange(false);
  };
  const handlePhoneChange = (v: string) => {
    // Only allow numbers
    const clean = v.replace(/\D/g, "");
    if (clean.length === 0) {
      setForm(f => ({ ...f, phone: "" }));
      return;
    }

    // Always start with 7
    let numbers = clean;
    if (numbers[0] !== "7") {
      numbers = "7" + numbers;
    }

    // Limit to 11 digits (7 + 10 digits)
    numbers = numbers.slice(0, 11);

    let formatted = "+7";
    if (numbers.length > 1) {
      formatted += " (" + numbers.slice(1, 4);
      if (numbers.length > 4) {
        formatted += ") " + numbers.slice(4, 7);
        if (numbers.length > 7) {
          formatted += "-" + numbers.slice(7, 9);
          if (numbers.length > 9) {
            formatted += "-" + numbers.slice(9, 11);
          }
        }
      }
    }
    setForm(f => ({ ...f, phone: formatted }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md bg-card border-border">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">Новый лид</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Имя *</label>
            <Input className="mt-1 bg-secondary/50 border-border text-sm" placeholder="Имя клиента" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Телефон</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="mt-1 bg-secondary/50 border-border text-sm pl-9"
                placeholder="+7"
                value={form.phone}
                onChange={e => handlePhoneChange(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Источник</label>
            <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
              <SelectTrigger className="mt-1 bg-secondary/50 border-border text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Сайт">Сайт</SelectItem>
                <SelectItem value="Звонок">Звонок</SelectItem>
                <SelectItem value="2 ГИС">2 ГИС</SelectItem>
                <SelectItem value="Сарафан">Сарафан</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Сумма сделки (₸)</label>
            <Input className="mt-1 bg-secondary/50 border-border text-sm" placeholder="0" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          {form.status === "Записан" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Врач</label>
                <Select value={form.doctor_name} onValueChange={v => setForm(f => ({ ...f, doctor_name: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border text-xs h-9"><SelectValue placeholder="Врач" /></SelectTrigger>
                  <SelectContent>
                    {DOCTORS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Кабинет</label>
                <Select value={form.office_name} onValueChange={v => setForm(f => ({ ...f, office_name: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary/50 border-border text-xs h-9"><SelectValue placeholder="Кабинет" /></SelectTrigger>
                  <SelectContent>
                    {OFFICES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Этап</label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="mt-1 bg-secondary/50 border-border text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={saving || active.id === "hq"}>
            {active.id === "hq" ? "Выберите проект" : (saving ? "Сохранение..." : "Создать лид")}
          </Button>
          {active.id === "hq" && (
            <p className="text-[10px] text-destructive flex items-center gap-1 justify-center">
              <AlertCircle className="h-3 w-3" /> Для создания лида выберите конкретный проект
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
