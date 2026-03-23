import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Briefcase, Users, Pencil, Check, X, Target } from "lucide-react";
import { motion } from "framer-motion";
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
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
          <div className="text-primary">
            {icon}
          </div>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <p className={`text-xl font-semibold tabular-nums tracking-tight ${accentClass}`}>{value}</p>
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
                  className="text-xs text-foreground bg-secondary/50 border border-border rounded-lg px-3 py-1.5 w-full tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                />
              </div>
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground/40 flex items-center gap-1.5 uppercase tracking-wider">
                <Target className="h-3 w-3 opacity-30" />
                Target: {target}
              </span>
            )}
            <span className={cn(
               "text-[9px] font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-full border",
               targetPct >= 80 ? "bg-green-500/10 text-green-600 border-green-500/20" : 
               targetPct >= 50 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : 
               "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              {targetPct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${targetPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                targetPct >= 80 ? "bg-green-500" : targetPct >= 50 ? "bg-amber-500" : "bg-destructive"
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
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl border border-border transition-colors h-9"
            >
              <X className="h-3.5 w-3.5" /> Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 px-4 py-1.5 rounded-xl border border-primary/30 bg-primary/5 transition-colors h-9 disabled:opacity-50 font-medium"
            >
              <Check className="h-3.5 w-3.5" /> {saving ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-4 py-1.5 rounded-xl border border-border transition-colors h-9 bg-card"
          >
            <Pencil className="h-3.5 w-3.5" /> Изменить цели
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign size={18} />}
          label="MRR Агентства"
          value={formatMoney(metrics.totalRevenue)}
          target={formatMoney(t.mrr)}
          targetPct={Math.min(100, Math.round((metrics.totalRevenue / (t.mrr || 1)) * 100))}
          accentClass="text-foreground"
          editing={editing}
          targetValue={draft.mrr}
          onTargetChange={v => setDraft(d => ({ ...d, mrr: v }))}
        />
        <KpiCard
          icon={<TrendingUp size={18} />}
          label="Расходы агентства"
          value={formatMoney(metrics.totalSpend)}
          target={formatMoney(t.spend)}
          targetPct={Math.min(100, Math.round((metrics.totalSpend / (t.spend || 1)) * 100))}
          editing={editing}
          targetValue={draft.spend}
          onTargetChange={v => setDraft(d => ({ ...d, spend: v }))}
        />
        <KpiCard
          icon={<Users size={18} />}
          label="Подписчики"
          value={metrics.totalFollowers.toLocaleString('ru-RU')}
          target={(t.followers).toLocaleString('ru-RU')}
          targetPct={Math.min(100, Math.round((metrics.totalFollowers / (t.followers || 1)) * 100))}
          accentClass="text-foreground"
          editing={editing}
          targetValue={draft.followers}
          onTargetChange={v => setDraft(d => ({ ...d, followers: v }))}
        />
        <KpiCard
          icon={<Briefcase size={18} />}
          label="Активные кабинеты"
          value={String(metrics.activeProjects)}
          target={String(t.active_projects)}
          targetPct={Math.min(100, Math.round((metrics.activeProjects / (t.active_projects || 1)) * 100))}
          accentClass="text-foreground"
          editing={editing}
          targetValue={draft.active_projects}
          onTargetChange={v => setDraft(d => ({ ...d, active_projects: v }))}
        />
      </div>
    </div>
  );
}
