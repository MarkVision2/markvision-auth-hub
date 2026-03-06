import { useState } from "react";
import { Plus } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";

interface ClientAccount {
  id: string;
  client_name: string;
  status: "active" | "paused";
  spend: { fact: number; plan: number };
  leads: { fact: number; plan: number };
  visits: { fact: number; plan: number };
  sales: { fact: number; plan: number };
  clicks: number;
  followers: number;
  convClickLead: number;
  convLeadVisit: number;
  convVisitSale: number;
}

const initialClients: ClientAccount[] = [
  {
    id: "1",
    client_name: "TechFlow Solutions",
    status: "active",
    spend: { fact: 250000, plan: 500000 },
    leads: { fact: 124, plan: 200 },
    visits: { fact: 48, plan: 80 },
    sales: { fact: 29, plan: 50 },
    clicks: 3420,
    followers: 1250,
    convClickLead: 5,
    convLeadVisit: 40,
    convVisitSale: 60,
  },
  {
    id: "2",
    client_name: "GreenMart Kazakhstan",
    status: "active",
    spend: { fact: 180000, plan: 300000 },
    leads: { fact: 89, plan: 150 },
    visits: { fact: 35, plan: 60 },
    sales: { fact: 18, plan: 35 },
    clicks: 2100,
    followers: 870,
    convClickLead: 4.2,
    convLeadVisit: 39,
    convVisitSale: 51,
  },
];

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return n.toString();
}

function MetricCell({ label, fact, plan }: { label: string; fact: number; plan: number }) {
  const pct = Math.min(100, Math.round((fact / plan) * 100));
  return (
    <div className="flex-1 min-w-[120px]">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium text-foreground">
        {formatNum(fact)} <span className="text-muted-foreground font-normal">/ {formatNum(plan)}</span>
        {label === "Расходы" && " ₸"}
      </p>
      <Progress value={pct} className="h-1 mt-1.5" />
    </div>
  );
}

function ClientCard({ client }: { client: ClientAccount }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <h3 className="text-base font-semibold text-foreground">{client.client_name}</h3>
        </div>
        <div className="flex gap-1.5">
          <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
            Клик → Лид: {client.convClickLead}%
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
            Лид → Визит: {client.convLeadVisit}%
          </Badge>
          <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
            Визит → Продажа: {client.convVisitSale}%
          </Badge>
        </div>
      </div>

      <div className="flex gap-6 mb-3">
        <MetricCell label="Расходы" fact={client.spend.fact} plan={client.spend.plan} />
        <MetricCell label="Лиды" fact={client.leads.fact} plan={client.leads.plan} />
        <MetricCell label="Визиты" fact={client.visits.fact} plan={client.visits.plan} />
        <MetricCell label="Продажи" fact={client.sales.fact} plan={client.sales.plan} />
      </div>

      <div className="flex gap-6 pt-3 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Клики</p>
          <p className="text-sm font-medium text-foreground">{formatNum(client.clicks)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Подписчики</p>
          <p className="text-sm font-medium text-foreground">{formatNum(client.followers)}</p>
        </div>
      </div>
    </div>
  );
}

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

export default function AgencyAccounts() {
  const [clients, setClients] = useState<ClientAccount[]>(initialClients);
  const [sheetOpen, setSheetOpen] = useState(false);
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
    };

    setClients((prev) => [newClient, ...prev]);
    setForm(emptyForm);
    setSheetOpen(false);
    toast({ title: "Кабинет успешно добавлен!", description: form.client_name });
  };

  return (
    <DashboardLayout breadcrumb="Агентские кабинеты">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Агентские кабинеты</h1>
        <Button onClick={() => setSheetOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить кабинет
        </Button>
      </div>

      <div className="space-y-4">
        {clients.map((c) => (
          <ClientCard key={c.id} client={c} />
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-border bg-card">
          <SheetHeader>
            <SheetTitle className="text-foreground">Добавить кабинет</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="mt-6 space-y-2">
            <Accordion type="multiple" defaultValue={["general", "meta", "tracking"]} className="space-y-2">
              <AccordionItem value="general" className="border border-border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  Основная информация
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <Field label="Название кабинета *" value={form.client_name} onChange={(v) => updateField("client_name", v)} />
                  <Field label="Дневной бюджет" value={form.daily_budget} onChange={(v) => updateField("daily_budget", v)} placeholder="50000" />
                  <Field label="Город" value={form.city} onChange={(v) => updateField("city", v)} />
                  <Field label="Ключ региона" value={form.region_key} onChange={(v) => updateField("region_key", v)} />
                  <div>
                    <Label className="text-xs text-muted-foreground">Информация о клиенте</Label>
                    <Textarea
                      value={form.brief}
                      onChange={(e) => updateField("brief", e.target.value)}
                      className="mt-1 bg-input border-border text-foreground resize-none"
                      rows={3}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="meta" className="border border-border rounded-lg px-4">
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

              <AccordionItem value="tracking" className="border border-border rounded-lg px-4">
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
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 bg-input border-border text-foreground"
      />
    </div>
  );
}
