import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import type { ClientAccount } from "./ClientCard";

const emptyForm = {
  client_name: "",
  daily_budget: "",
  city: "",
  region_key: "",
  brief: "",
  ad_account_id: "",
  page_id: "",
  page_name: "",
  instagram_user_id: "",
  telegram_group_id: "",
  whatsapp_number: "",
  fb_pixel_id: "",
  pixel_event: "",
  website_url: "",
};

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-zinc-500">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/[0.03] border-white/[0.06] text-foreground placeholder:text-zinc-700 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}

interface AddAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (client: ClientAccount) => void;
}

export default function AddAccountSheet({ open, onOpenChange, onAdd }: AddAccountSheetProps) {
  const [form, setForm] = useState(emptyForm);
  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) return;

    const newClient: ClientAccount = {
      id: Date.now().toString(),
      client_name: form.client_name,
      status: "active",
      spend: { fact: 0, plan: Number(form.daily_budget) * 30 || 0 },
      leads: { fact: 0, plan: 0 },
      visits: { fact: 0, plan: 0 },
      sales: { fact: 0, plan: 0 },
      clicks: 0,
      followers: 0,
      convClickLead: 0,
      convLeadVisit: 0,
      convVisitSale: 0,
      sparkSpend: [0, 0, 0, 0, 0, 0, 0],
      sparkLeads: [0, 0, 0, 0, 0, 0, 0],
    };

    onAdd(newClient);
    setForm(emptyForm);
    onOpenChange(false);
    toast({ title: "Кабинет успешно добавлен!", description: form.client_name });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-white/[0.04] bg-[#0a0a0c]">
        <SheetHeader>
          <SheetTitle className="text-foreground">Добавить кабинет</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-2">
          <Accordion type="multiple" defaultValue={["general", "meta", "tracking"]} className="space-y-2">
            <AccordionItem value="general" className="border border-white/[0.04] rounded-xl px-4 bg-white/[0.01]">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                Основная информация
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <Field label="Название кабинета *" value={form.client_name} onChange={(v) => updateField("client_name", v)} />
                <Field label="Дневной бюджет" value={form.daily_budget} onChange={(v) => updateField("daily_budget", v)} placeholder="50000" />
                <Field label="Город" value={form.city} onChange={(v) => updateField("city", v)} />
                <Field label="Ключ региона" value={form.region_key} onChange={(v) => updateField("region_key", v)} />
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500">Информация о клиенте</Label>
                  <Textarea
                    value={form.brief}
                    onChange={(e) => updateField("brief", e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-foreground resize-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="meta" className="border border-white/[0.04] rounded-xl px-4 bg-white/[0.01]">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                Интеграция Meta
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <Field label="ID кабинета" value={form.ad_account_id} onChange={(v) => updateField("ad_account_id", v)} placeholder="act_..." />
                <Field label="ID страницы" value={form.page_id} onChange={(v) => updateField("page_id", v)} />
                <Field label="Название страницы" value={form.page_name} onChange={(v) => updateField("page_name", v)} />
                <Field label="Instagram ID" value={form.instagram_user_id} onChange={(v) => updateField("instagram_user_id", v)} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tracking" className="border border-white/[0.04] rounded-xl px-4 bg-white/[0.01]">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                Трекинг и Связь
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <Field label="Telegram Group ID" value={form.telegram_group_id} onChange={(v) => updateField("telegram_group_id", v)} />
                <Field label="Номер WhatsApp" value={form.whatsapp_number} onChange={(v) => updateField("whatsapp_number", v)} />
                <Field label="Facebook Pixel ID" value={form.fb_pixel_id} onChange={(v) => updateField("fb_pixel_id", v)} />
                <Field label="Событие пикселя" value={form.pixel_event} onChange={(v) => updateField("pixel_event", v)} placeholder="Lead" />
                <Field label="URL сайта" value={form.website_url} onChange={(v) => updateField("website_url", v)} placeholder="https://" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="pt-4">
            <Button type="submit" className="w-full">
              Создать аккаунт
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
