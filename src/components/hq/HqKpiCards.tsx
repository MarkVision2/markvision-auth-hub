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
    <div className="relative group overflow-hidden rounded-3xl border border-white/10 bg-white/5 dark:bg-[#1a1b1e]/40 backdrop-blur-xl p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      {/* Subtle light effect */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/70 font-bold">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <p className={`text-2xl font-bold tabular-nums tracking-tight ${accentClass}`}>{value}</p>
      </div>

      {target && targetPct !== undefined && (
        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {editing && onTargetChange ? (
              <div className="relative w-full">
                <input
                  type="number"
                  value={targetValue ?? 0}
                  onChange={e => onTargetChange(Number(e.target.value))}
                  className="text-[11px] text-foreground bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 w-full tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
                />
              </div>
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1.5">
                <Target className="h-3 w-3 opacity-40" />
                Цель: <span className="text-foreground/80">{target}</span>
              </span>
            )}
            <span className={`text-[10px] font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-full ${
              targetPct >= 80 ? "bg-primary/10 text-primary" : 
              targetPct >= 50 ? "bg-amber-500/10 text-amber-500" : 
              "bg-destructive/10 text-destructive"
            }`}>
              {targetPct}%
            </span>
          </div>
          <div className="relative h-1.5 w-full bg-white/5 dark:bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${targetPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(var(--primary),0.4)]",
                targetPct >= 80 ? "bg-primary" : targetPct >= 50 ? "bg-amber-500" : "bg-destructive"
              )}
            />
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
