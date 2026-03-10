import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Phone } from "lucide-react";

const PROJECT_ID = "c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STAGES = [
  "Новая заявка", "Без ответа", "В работе", "Счет выставлен",
  "Записан", "Визит совершен", "Оплачен", "Отказ",
];

export default function AddLeadSheet({ open, onOpenChange }: Props) {
  const [form, setForm] = useState({ name: "", phone: "", source: "WhatsApp", amount: "", status: "Новая заявка" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast({ title: "Укажите имя клиента" }); return; }
    setSaving(true);
    const { error } = await (supabase as any).from("leads").insert({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      source: form.source || null,
      amount: form.amount ? Number(form.amount) : 0,
      status: form.status,
      project_id: PROJECT_ID,
    });
    setSaving(false);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Лид создан", description: form.name });
    setForm({ name: "", phone: "", source: "WhatsApp", amount: "", status: "Новая заявка" });
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
                placeholder="+7 (777) 777-77-77"
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
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="Telegram">Telegram</SelectItem>
                <SelectItem value="Сайт">Сайт</SelectItem>
                <SelectItem value="Звонок">Звонок</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Сумма сделки (₸)</label>
            <Input className="mt-1 bg-secondary/50 border-border text-sm" placeholder="0" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Этап</label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger className="mt-1 bg-secondary/50 border-border text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={saving}>
            {saving ? "Сохранение..." : "Создать лид"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
