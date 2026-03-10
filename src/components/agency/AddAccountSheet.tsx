import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Loader2 } from "lucide-react";


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
  spend: "",
  meta_leads: "",
  visits: "",
  sales: "",
  revenue: "",
  romi: "",
  project_id: "",
};

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
      />
    </div>
  );
}

interface AddAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function AddAccountSheet({ open, onOpenChange, onSaved }: AddAccountSheetProps) {
  const { active, workspaces } = useWorkspace();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const updateField = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) return;
    if (!form.project_id && active.id === "hq") {
      toast({ title: "Выберите проект", variant: "destructive" });
      return;
    }

    setSaving(true);

    const row: Record<string, unknown> = {
      client_name: form.client_name,
      project_id: active.id === "hq" ? form.project_id : active.id,
    };
    if (form.daily_budget) row.daily_budget = Number(form.daily_budget);
    if (form.city) row.city = form.city;
    if (form.region_key) row.region_key = form.region_key;
    if (form.brief) row.brief = form.brief;
    if (form.ad_account_id) row.ad_account_id = form.ad_account_id;
    if (form.page_id) row.page_id = form.page_id;
    if (form.page_name) row.page_name = form.page_name;
    if (form.instagram_user_id) row.instagram_user_id = form.instagram_user_id;
    if (form.telegram_group_id) row.telegram_group_id = form.telegram_group_id;
    if (form.whatsapp_number) row.whatsapp_number = form.whatsapp_number;
    if (form.fb_pixel_id) row.fb_pixel_id = form.fb_pixel_id;
    if (form.pixel_event) row.pixel_event = form.pixel_event;
    if (form.website_url) row.website_url = form.website_url;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("clients_config").insert(row).select().single();

    setSaving(false);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Кабинет добавлен!", description: form.client_name });
    setForm(emptyForm);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-border bg-card">
        <SheetHeader>
          <SheetTitle className="text-foreground">Добавить кабинет</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-2">
          <Accordion type="multiple" defaultValue={["general", "meta", "tracking"]} className="space-y-2">
            <AccordionItem value="general" className="border border-border rounded-xl px-4 bg-secondary/30">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                Основная информация
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <Field label="Название кабинета *" value={form.client_name} onChange={(v) => updateField("client_name", v)} />
                <Field label="Дневной бюджет" value={form.daily_budget} onChange={(v) => updateField("daily_budget", v)} placeholder="50000" />
                <Field label="Город" value={form.city} onChange={(v) => updateField("city", v)} />
                <Field label="Ключ региона" value={form.region_key} onChange={(v) => updateField("region_key", v)} />

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Проект *</Label>
                  <select
                    value={form.project_id}
                    onChange={(e) => updateField("project_id", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Выберите проект</option>
                    {workspaces.filter(w => w.id !== 'hq').map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">Кабинет будет автоматически виден в MarkVision AI</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Информация о клиенте</Label>
                  <Textarea
                    value={form.brief}
                    onChange={(e) => updateField("brief", e.target.value)}
                    className="glass border-border text-foreground resize-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="meta" className="border border-border rounded-xl px-4 bg-secondary/30">
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

            <AccordionItem value="tracking" className="border border-border rounded-xl px-4 bg-secondary/30">
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
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Создать аккаунт
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
