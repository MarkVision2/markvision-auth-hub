import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Loader2, Target, Facebook, Link2, Settings2, ShieldCheck, Database, Info, Globe, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  project_id: "",
  impressions: "",
  clicks: "",
  spend: "",
  meta_leads: "",
  visits: "",
  sales: "",
  revenue: "",
  is_agency: false,
};

function Field({ label, value, onChange, placeholder, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: any }) {
  return (
    <div className="space-y-2.5">
      <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-2 px-1">
        {Icon && <Icon className="h-3.5 w-3.5 opacity-50" />}
        {label}
      </Label>
      <div className="relative group">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 bg-background/40 border-border/40 text-foreground placeholder:text-muted-foreground/20 focus:border-emerald-500/50 focus:ring-emerald-500/10 transition-all rounded-2xl font-bold text-sm shadow-inner"
        />
      </div>
    </div>
  );
}

interface AddAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  account?: any; // Pass account data for editing
}

export default function AddAccountSheet({ open, onOpenChange, onSaved, account }: AddAccountSheetProps) {
  const { active, workspaces, createProject } = useWorkspace();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedVisibilities, setSelectedVisibilities] = useState<string[]>([]);

  useEffect(() => {
    async function loadVisibilities() {
      if (account?.id && open) {
        setForm({
          client_name: account.client_name || "",
          daily_budget: account.daily_budget ? String(account.daily_budget) : "",
          city: account.city || "",
          region_key: account.region_key || "",
          brief: account.brief || "",
          ad_account_id: account.ad_account_id || "",
          page_id: account.page_id || "",
          page_name: account.page_name || "",
          instagram_user_id: account.instagram_user_id || "",
          telegram_group_id: account.telegram_group_id || "",
          whatsapp_number: account.whatsapp_number || "",
          fb_pixel_id: account.fb_pixel_id || "",
          pixel_event: account.pixel_event || "",
          website_url: account.website_url || "",
          project_id: account.project_id || "",
          impressions: account.impressions ? String(account.impressions) : "",
          clicks: account.clicks ? String(account.clicks) : "",
          spend: account.spend ? String(account.spend) : "",
          meta_leads: account.meta_leads ? String(account.meta_leads) : "",
          visits: account.visits ? String(account.visits) : "",
          sales: account.sales ? String(account.sales) : "",
          revenue: account.revenue ? String(account.revenue) : "",
          is_agency: !!account.is_agency,
        });

        const { data } = await (supabase as any)
          .from("client_config_visibility")
          .select("project_id, is_hq_sharing")
          .eq("client_config_id", account.id);
        
        if (data) {
          const ids = data.map((v: any) => v.is_hq_sharing ? "hq" : v.project_id).filter(Boolean);
          setSelectedVisibilities(ids);
        }
      } else if (!account && open) {
        setForm(emptyForm);
        // Default visibility is the current active project
        setSelectedVisibilities([active.id]);
      }
    }
    loadVisibilities();
  }, [account, open, active.id]);
  const updateField = (field: string, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  const isInHq = active.id === "hq";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name.trim()) return;

    setSaving(true);
    let projectId = isInHq ? null : active.id;

    // Fix: If adding a NEW account from HQ (MarkVision AI) and it's an AGENCY cabinet, 
    // we MUST create a dedicated project for it first.
    if (!account?.id && isInHq && form.is_agency) {
      const newProjectId = await createProject(form.client_name);
      if (newProjectId) {
        projectId = newProjectId;
      }
    }

    const row: Record<string, unknown> = {
      client_name: form.client_name,
      project_id: projectId,
      is_agency: form.is_agency,
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
    if (form.impressions) row.impressions = Number(form.impressions);
    if (form.clicks) row.clicks = Number(form.clicks);
    if (form.spend) row.spend = Number(form.spend);
    if (form.meta_leads) row.meta_leads = Number(form.meta_leads);
    if (form.visits) row.visits = Number(form.visits);
    if (form.sales) row.sales = Number(form.sales);
    if (form.revenue) row.revenue = Number(form.revenue);
    // Default FB token (shared across all accounts)
    row.fb_token = "EAANaVrGsWLYBQx2zJZCYxaz16KSfXDHFwIZA5xuZACh8fXnWD1gHcu4YryOs5lCcydaQ0f0D0EhDteeIZBMpD99QBy2a5BEB6JULlKi81zgQIjqnXo46dixFo1NB0BdHo1wAQkJ1fwdiZAqtg5AY2DY8XLDDPIMsJJbUkkhtswZCt48Vw8WuU5Ml5es1X9egMK";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let res;
    if (account?.id) {
      res = await (supabase as any).from("clients_config").update(row).eq("id", account.id).select().single();
    } else {
      res = await (supabase as any).from("clients_config").insert(row).select().single();
    }
    const { data: cab, error } = res;

    if (error) {
      setSaving(false);
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    // Create visibility records
    const visRecords = selectedVisibilities.map(pid => {
      if (pid === "hq") return { client_config_id: cab.id, is_hq_sharing: true };
      return { client_config_id: cab.id, project_id: pid };
    });

    if (account?.id) {
      // Clear old visibilities first
      await (supabase as any).from("client_config_visibility").delete().eq("client_config_id", account.id);
    }

    if (visRecords.length > 0) {
      const { error: visErr } = await (supabase as any).from("client_config_visibility").insert(visRecords);
      if (visErr) console.error("Visibility error:", visErr.message);
    }

    setSaving(false);
    toast({ title: account ? "Изменения сохранены" : "Кабинет добавлен!", description: form.client_name });
    setForm(emptyForm);
    setSelectedVisibilities([]);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto border-l border-border/40 bg-card/80 backdrop-blur-2xl p-0">
        <div className="sticky top-0 z-20 bg-card/60 backdrop-blur-xl border-b border-border/40 px-8 py-6">
          <SheetHeader>
            <div className="flex items-center gap-4 mb-2">
               <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Target className="h-6 w-6" />
               </div>
               <div>
                 <SheetTitle className="text-2xl font-black text-foreground tracking-tight leading-none">
                   {account ? "Настройки кабинета" : "Добавить кабинет"}
                 </SheetTitle>
                 <SheetDescription className="mt-1 font-medium text-muted-foreground/60">
                    {account ? `Редактирование параметров для ${form.client_name}` : "Создайте новый рекламный кабинет для мониторинга"}
                 </SheetDescription>
               </div>
            </div>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-10 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
               <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/70">Основные настройки</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/15 backdrop-blur-sm p-6 rounded-3xl border border-border/40 shadow-sm">
              <div className="md:col-span-2">
                 <Field label="Название кабинета *" value={form.client_name} onChange={(v) => updateField("client_name", v)} placeholder="Напр: Kitarov Clinic" />
              </div>
              <Field label="Дневной бюджет" value={form.daily_budget} onChange={(v) => updateField("daily_budget", v)} placeholder="50000" />
              <Field label="Город" value={form.city} onChange={(v) => updateField("city", v)} placeholder="Алматы" />
              
              <div className="md:col-span-2 space-y-4 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Тип кабинета</Label>
                <RadioGroup
                  value={form.is_agency ? "agency" : "personal"}
                  onValueChange={(v) => updateField("is_agency", v === "agency")}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="r-personal"
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border border-border/50 cursor-pointer transition-all hover:bg-background/50",
                      !form.is_agency ? "bg-background border-primary shadow-sm" : "bg-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="personal" id="r-personal" className="sr-only" />
                      <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center", !form.is_agency ? "border-primary" : "border-muted-foreground/30")}>
                        {!form.is_agency && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="font-bold text-sm">Личный</span>
                    </div>
                  </Label>
                  <Label
                    htmlFor="r-agency"
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border border-border/50 cursor-pointer transition-all hover:bg-background/50",
                      form.is_agency ? "bg-background border-primary shadow-sm" : "bg-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value="agency" id="r-agency" className="sr-only" />
                      <div className={cn("h-4 w-4 rounded-full border-2 flex items-center justify-center", form.is_agency ? "border-primary" : "border-muted-foreground/30")}>
                        {form.is_agency && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="font-bold text-sm">Агентский</span>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
               <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/70">Базовые показатели (History)</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-secondary/15 backdrop-blur-sm p-6 rounded-3xl border border-border/40 shadow-sm">
              <Field label="Показы" value={form.impressions} onChange={(v) => updateField("impressions", v)} placeholder="0" />
              <Field label="Клики" value={form.clicks} onChange={(v) => updateField("clicks", v)} placeholder="0" />
              <Field label="Расход" value={form.spend} onChange={(v) => updateField("spend", v)} placeholder="0" />
              <Field label="Лиды" value={form.meta_leads} onChange={(v) => updateField("meta_leads", v)} placeholder="0" />
              <Field label="Визиты" value={form.visits} onChange={(v) => updateField("visits", v)} placeholder="0" />
              <Field label="Продажи" value={form.sales} onChange={(v) => updateField("sales", v)} placeholder="0" />
              <div className="md:col-span-3">
                <Field label="Выручка" value={form.revenue} onChange={(v) => updateField("revenue", v)} placeholder="0" />
              </div>
            </div>
          </div>

          <Accordion type="multiple" className="space-y-5">
            <AccordionItem value="meta" className="border border-border/40 rounded-3xl px-6 bg-secondary/15 backdrop-blur-sm overflow-hidden shadow-sm transition-all hover:border-emerald-500/20">
              <AccordionTrigger className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/70 hover:no-underline py-6">
                <div className="flex items-center gap-3">
                   <Facebook className="h-4 w-4 text-blue-600" />
                   Интеграция Meta
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="ID кабинета" value={form.ad_account_id} onChange={(v) => updateField("ad_account_id", v)} placeholder="act_..." icon={ShieldCheck} />
                  <Field label="ID страницы" value={form.page_id} onChange={(v) => updateField("page_id", v)} icon={Link2} />
                  <Field label="Название страницы" value={form.page_name} onChange={(v) => updateField("page_name", v)} icon={Globe} />
                  <Field label="Instagram ID" value={form.instagram_user_id} onChange={(v) => updateField("instagram_user_id", v)} icon={MessageSquare} />
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                   <Info className="h-5 w-5 text-blue-500 shrink-0" />
                   <p className="text-[11px] font-medium text-blue-600/80 leading-relaxed">
                     Данные Meta Ads будут автоматически синхронизироваться каждые 2 часа. Убедитесь, что ID кабинета указан верно.
                   </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tracking" className="border border-border/40 rounded-3xl px-6 bg-secondary/15 backdrop-blur-sm overflow-hidden shadow-sm transition-all hover:border-emerald-500/20">
              <AccordionTrigger className="text-xs font-black uppercase tracking-[0.2em] text-foreground hover:no-underline py-6">
                <div className="flex items-center gap-3">
                   <Link2 className="h-4 w-4 text-primary" />
                   Трекинг и Связь
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Telegram Group ID" value={form.telegram_group_id} onChange={(v) => updateField("telegram_group_id", v)} />
                  <Field label="Номер WhatsApp" value={form.whatsapp_number} onChange={(v) => updateField("whatsapp_number", v)} />
                  <Field label="Facebook Pixel ID" value={form.fb_pixel_id} onChange={(v) => updateField("fb_pixel_id", v)} />
                  <Field label="Событие пикселя" value={form.pixel_event} onChange={(v) => updateField("pixel_event", v)} placeholder="Lead" />
                  <div className="md:col-span-2">
                    <Field label="URL сайта" value={form.website_url} onChange={(v) => updateField("website_url", v)} placeholder="https://" icon={Globe} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="space-y-6">
             <div className="flex items-center gap-3 px-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Доступы и Видимость</h3>
             </div>
             
             <div className="grid grid-cols-1 gap-3">
               {workspaces.map((ws) => (
                 <div 
                   key={ws.id}
                   className={cn(
                     "flex items-center justify-between p-4 rounded-2xl border transition-all hover:bg-emerald-500/5 group",
                     selectedVisibilities.includes(ws.id) 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-secondary/20 border-border/50"
                   )}
                 >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors",
                        selectedVisibilities.includes(ws.id) ? "bg-emerald-500 text-white" : "bg-background text-muted-foreground group-hover:text-emerald-500"
                      )}>
                         {ws.id === "hq" ? <Target className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                      </div>
                      <div>
                        <Label htmlFor={`vis-${ws.id}`} className="font-bold text-sm cursor-pointer block">{ws.name}</Label>
                        <p className="text-[10px] font-medium text-muted-foreground/60">
                           {ws.id === "hq" ? "Главный проект (HQ)" : "Клиентский проект"}
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      id={`vis-${ws.id}`}
                      checked={selectedVisibilities.includes(ws.id)}
                      onCheckedChange={(c) => {
                        if (c) setSelectedVisibilities(prev => [...prev, ws.id]);
                        else setSelectedVisibilities(prev => prev.filter(id => id !== ws.id));
                      }}
                      className="h-6 w-6 rounded-lg border-border/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                    />
                 </div>
               ))}
             </div>
          </div>

          <div className="space-y-4 pt-4">
             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Заметки / Бриф</Label>
             <Textarea
               value={form.brief}
               onChange={(e) => updateField("brief", e.target.value)}
               className="min-h-[120px] bg-secondary/20 border-border/40 rounded-[2rem] p-6 text-sm font-medium focus:ring-primary/20 transition-all resize-none"
               placeholder="Дополнительная информация о клиенте..."
             />
          </div>

          <div className="sticky bottom-0 pb-10 pt-4 bg-gradient-to-t from-card/90 to-transparent z-10">
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all gap-3" 
              disabled={saving}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Target className="h-5 w-5" />}
              {account ? "Сохранить изменения" : "Создать кабинет"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
