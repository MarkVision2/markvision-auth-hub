import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { StaggerContainer, FadeUpItem } from "@/components/motion/MotionWrappers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CampaignBuilderSheet from "@/components/sheets/CampaignBuilderSheet";
import AddAccountSheet from "@/components/agency/AddAccountSheet";
import { supabase } from "@/integrations/supabase/client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, MoreHorizontal, Pencil, Megaphone, Search,
  Loader2, RefreshCw, ExternalLink, Activity, Wallet, Target
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface ClientConfig {
  id: string;
  name: string;
  ad_account_id: string | null;
  daily_budget: number;
  is_active: boolean;
}

/* ── Helpers ── */
function fmtCurrency(n: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ₸`;
}

export default function DashboardTarget() {
  const { active } = useWorkspace();
  const [clients, setClients] = useState<ClientConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [rawClients, setRawClients] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let clientsQuery = (supabase as any)
        .from("clients_config")
        .select("id, client_name, ad_account_id, daily_budget, is_active")
        .eq("is_active", true)
        .neq("is_agency", true)
        .order("client_name");

      if (active.id !== "hq") {
        const { data: shared } = await (supabase as any)
          .from("client_config_visibility")
          .select("client_config_id")
          .eq("project_id", active.id);
        const sharedIds = (shared || []).map((s: any) => s.client_config_id);

        if (sharedIds.length > 0) {
          const orClause = `project_id.eq.${active.id},id.in.(${sharedIds.join(",")})`;
          clientsQuery = (clientsQuery as any).or(orClause);
        } else {
          clientsQuery = clientsQuery.eq("project_id", active.id);
        }
      }

      const { data, error } = await (clientsQuery as any);
      if (error) throw error;
      setRawClients(data || []);

      const mapped: ClientConfig[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.client_name,
        ad_account_id: c.ad_account_id,
        daily_budget: Number(c.daily_budget) || 0,
        is_active: c.is_active,
      }));
      setClients(mapped);
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [active.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  }, [clients, search]);

  if (loading) {
    return (
      <DashboardLayout breadcrumb="Таргетолог">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumb="Таргетолог">
      <StaggerContainer className="space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <FadeUpItem className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-border/40">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner mt-4">
                 <Megaphone className="h-6 w-6 text-primary" />
               </div>
               <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-4">Центр управления рекламой</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-xl">
              Создание, настройка и запуск рекламных кампаний. Доступные кабинеты: {clients.length}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => { fetchData(); toast({ title: "Обновлено" }); }} className="h-12 w-12 rounded-2xl border-border/60 bg-card hover:bg-accent/50 text-muted-foreground transition-all">
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button onClick={() => setBuilderOpen(true)} className="gap-2.5 h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 transition-all font-black text-[12px] uppercase tracking-[0.1em] text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Rocket className="h-4.5 w-4.5 relative z-10" />
              <span className="relative z-10">Создать кампанию</span>
            </Button>
          </div>
        </FadeUpItem>

        <FadeUpItem>
          <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md border border-border/60 p-4 rounded-[1.5rem] shadow-sm mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Поиск по рекламным кабинетам..." 
                className="pl-12 h-12 text-sm bg-background border-border/50 rounded-xl focus-visible:ring-primary/20 placeholder:text-muted-foreground/40 font-semibold" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredClients.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center">
                  <div className="h-16 w-16 mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Кабинеты не найдены</h3>
                  <p className="text-sm text-muted-foreground">Попробуйте изменить параметры поиска или добавьте новый кабинет в разделе "Рекламные кабинеты".</p>
                </div>
              ) : (
                filteredClients.map((client, idx) => (
                  <motion.div
                    layout
                    key={client.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    className="group flex flex-col justify-between rounded-[2rem] border border-border/60 bg-card p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <Target className="w-32 h-32 -mr-10 -mt-10 text-primary" />
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-[1.25rem] bg-secondary/40 border border-border/50 flex flex-col items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                             <Activity className="h-6 w-6 text-primary/70" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-foreground tracking-tight leading-tight mb-1">{client.name}</h3>
                            <div className="flex items-center gap-2">
                              {client.is_active ? (
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">Активен</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-muted-foreground/30 text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-md">Остановлен</Badge>
                              )}
                              <span className="text-[10px] font-mono text-muted-foreground/50 tracking-wider">ID: {client.ad_account_id || "—"}</span>
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 relative z-20">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border shadow-2xl relative z-50">
                             {client.ad_account_id && (
                               <DropdownMenuItem className="gap-3 p-2.5 rounded-xl cursor-pointer" onClick={() => window.open(`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${client.ad_account_id}`, '_blank')}>
                                 <ExternalLink className="h-4 w-4 text-primary" />
                                 <span className="text-sm font-semibold">Открыть в Meta Ads</span>
                               </DropdownMenuItem>
                             )}
                             <DropdownMenuItem className="gap-3 p-2.5 rounded-xl cursor-pointer" onClick={() => {
                               setEditingAccount(rawClients.find(rc => rc.id === client.id));
                               setSheetOpen(true);
                             }}>
                               <Pencil className="h-4 w-4 text-muted-foreground" />
                               <span className="text-sm font-semibold">Настройки кабинета</span>
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="bg-secondary/20 rounded-2xl p-4 border border-border/40 flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Дневной бюджет</p>
                            <p className="text-base font-bold text-foreground tabular-nums">{client.daily_budget ? fmtCurrency(client.daily_budget) : "Не задан"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-5 border-t border-border/40 flex gap-2 relative z-10">
                      <Button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold shadow-none tracking-[0.05em] uppercase text-[11px]" onClick={() => setBuilderOpen(true)}>
                        Запустить рекламу
                      </Button>
                      {client.ad_account_id && (
                        <Button variant="outline" size="icon" onClick={() => window.open(`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${client.ad_account_id}`, '_blank')} className="shrink-0 border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </FadeUpItem>
      </StaggerContainer>
      <CampaignBuilderSheet open={builderOpen} onOpenChange={setBuilderOpen} />
      <AddAccountSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingAccount(null);
        }}
        onSaved={fetchData}
        account={editingAccount}
      />
    </DashboardLayout>
  );
}
