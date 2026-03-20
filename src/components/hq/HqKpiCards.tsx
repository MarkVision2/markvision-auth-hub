import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Briefcase, Users, Pencil, Check, X, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface AgencyMetrics {
  totalRevenue: number;
  totalSpend: number;
  romi?: number;
  activeProjects: number;
  totalFollowers: number;
}

interface HqTargets {
  id: string;
  mrr: number;
  spend: number;
  followers: number;
  active_projects: number;
}

function formatMoney(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ₸`;
}

function formatMoneyInput(n: number): string {
  return Math.round(n).toString();
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  target?: string;
  targetPct?: number;
  accentClass?: string;
  editing?: boolean;
  targetValue?: number;
  onTargetChange?: (val: number) => void;
}

function KpiCard({ icon, label, value, target, targetPct, accentClass = "text-foreground", editing, targetValue, onTargetChange }: KpiCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-[2rem] border border-white dark:border-white/10 bg-white/70 dark:bg-[#0a0b10]/40 backdrop-blur-3xl p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      {/* Premium Glow Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[70px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="flex items-center gap-3.5 mb-5 relative z-10">
        <div className="h-11 w-11 rounded-xl bg-secondary/40 dark:bg-black/40 border border-white/20 dark:border-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
          <div className="text-primary/70 dark:drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
            {icon}
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-black">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-1 relative z-10">
        <p className={`text-2xl font-black tabular-nums tracking-tighter ${accentClass}`}>{value}</p>
      </div>

      {target && targetPct !== undefined && (
        <div className="mt-6 space-y-3 relative z-10">
          <div className="flex items-center justify-between gap-2">
            {editing && onTargetChange ? (
              <div className="relative w-full">
                <input
                  type="number"
                  value={targetValue ?? 0}
                  onChange={e => onTargetChange(Number(e.target.value))}
                  className="text-xs text-foreground bg-secondary/30 dark:bg-black/40 border border-border/40 rounded-xl px-4 py-2 w-full tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold"
                />
              </div>
            ) : (
              <span className="text-[9px] font-black text-muted-foreground/30 flex items-center gap-1.5 uppercase tracking-widest">
                <Target className="h-3 w-3 opacity-20" />
                Target: <span className="text-foreground/40">{target}</span>
              </span>
            )}
            <span className={cn(
               "text-[9px] font-black tabular-nums shrink-0 px-2.5 py-1 rounded-full uppercase tracking-widest border",
               targetPct >= 80 ? "bg-green-500/10 text-green-600 border-green-500/20" : 
               targetPct >= 50 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : 
               "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              {targetPct}%
            </span>
          </div>
          <div className="relative h-1.5 w-full bg-secondary/30 dark:bg-black/40 rounded-full overflow-hidden p-[1px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${targetPct}%` }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              className={cn(
                "h-full rounded-full transition-all duration-500 relative",
                targetPct >= 80 ? "bg-green-500" : targetPct >= 50 ? "bg-amber-500" : "bg-destructive"
              )}
            >
               <div className="absolute inset-0 bg-white/30 blur-[1px] rounded-full opacity-50" />
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HqKpiCards({ metrics }: { metrics: AgencyMetrics | null }) {
  const [targets, setTargets] = useState<HqTargets | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Omit<HqTargets, "id">>({ mrr: 5000000, spend: 1200000, followers: 10000, active_projects: 10 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchTargets() {
      const { data } = await (supabase as any).from("hq_targets").select("*").limit(1).single();
      if (data) {
        setTargets(data);
        setDraft({ mrr: data.mrr, spend: data.spend, followers: data.followers, active_projects: data.active_projects });
      }
    }
    fetchTargets();
  }, []);

  const handleSave = async () => {
    if (!targets) return;
    setSaving(true);
    await (supabase as any)
      .from("hq_targets")
      .update({ ...draft, updated_at: new Date().toISOString() })
      .eq("id", targets.id);
    setTargets({ ...targets, ...draft });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    if (targets) setDraft({ mrr: targets.mrr, spend: targets.spend, followers: targets.followers, active_projects: targets.active_projects });
    setEditing(false);
  };

  if (!metrics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const t = editing ? draft : (targets ?? draft);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        {editing ? (
          <>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors"
            >
              <X className="h-3 w-3" /> Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 transition-colors disabled:opacity-50"
            >
              <Check className="h-3 w-3" /> {saving ? "Сохраняем..." : "Сохранить"}
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition-colors"
          >
            <Pencil className="h-3 w-3" /> Изменить цели
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign className="h-4 w-4 text-primary" />}
          label="MRR Агентства"
          value={formatMoney(metrics.totalRevenue)}
          target={formatMoney(t.mrr)}
          targetPct={Math.min(100, Math.round((metrics.totalRevenue / (t.mrr || 1)) * 100))}
          accentClass="text-primary"
          editing={editing}
          targetValue={draft.mrr}
          onTargetChange={v => setDraft(d => ({ ...d, mrr: v }))}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          label="Расходы агентства"
          value={formatMoney(metrics.totalSpend)}
          target={formatMoney(t.spend)}
          targetPct={Math.min(100, Math.round((metrics.totalSpend / (t.spend || 1)) * 100))}
          editing={editing}
          targetValue={draft.spend}
          onTargetChange={v => setDraft(d => ({ ...d, spend: v }))}
        />
        <KpiCard
          icon={<Users className="h-4 w-4 text-primary" />}
          label="Подписчики"
          value={metrics.totalFollowers.toLocaleString('ru-RU')}
          target={(t.followers).toLocaleString('ru-RU')}
          targetPct={Math.min(100, Math.round((metrics.totalFollowers / (t.followers || 1)) * 100))}
          accentClass="text-primary"
          editing={editing}
          targetValue={draft.followers}
          onTargetChange={v => setDraft(d => ({ ...d, followers: v }))}
        />
        <KpiCard
          icon={<Briefcase className="h-4 w-4 text-primary" />}
          label="Активные кабинеты"
          value={String(metrics.activeProjects)}
          target={String(t.active_projects)}
          targetPct={Math.min(100, Math.round((metrics.activeProjects / (t.active_projects || 1)) * 100))}
          editing={editing}
          targetValue={draft.active_projects}
          onTargetChange={v => setDraft(d => ({ ...d, active_projects: v }))}
        />
      </div>
    </div>
  );
}
