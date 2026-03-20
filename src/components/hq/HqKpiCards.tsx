import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Briefcase, Users, Pencil, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
    <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={`text-xl font-semibold tabular-nums tracking-tight ${accentClass}`}>{value}</p>
      {target && targetPct !== undefined && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            {editing && onTargetChange ? (
              <input
                type="number"
                value={targetValue ?? 0}
                onChange={e => onTargetChange(Number(e.target.value))}
                className="text-[11px] text-muted-foreground bg-secondary/60 border border-primary/30 rounded-md px-2 py-0.5 w-full tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground">Цель: {target}</span>
            )}
            <span className={`text-[10px] font-semibold tabular-nums shrink-0 ${targetPct >= 80 ? "text-primary" : targetPct >= 50 ? "text-amber-500" : "text-destructive"}`}>
              {targetPct}%
            </span>
          </div>
          <Progress value={targetPct} className="h-1.5 bg-secondary" />
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
