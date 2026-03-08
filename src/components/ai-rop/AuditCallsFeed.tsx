import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PhoneCall, PhoneIncoming, PhoneOutgoing, Bot, Eye, Inbox, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditRecord } from "./types";
import AuditDetailSheet from "./AuditDetailSheet";

interface Props { audits: AuditRecord[]; loading: boolean; }

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function isAiAgent(name: string) { return name.toLowerCase().includes("ai") || name.toLowerCase().includes("аи"); }

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80
    ? "bg-[hsl(var(--status-good)/0.1)] text-[hsl(var(--status-good))] border-[hsl(var(--status-good)/0.2)]"
    : score >= 50
    ? "bg-[hsl(var(--status-warning)/0.1)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.2)]"
    : "bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))] border-[hsl(var(--status-critical)/0.2)]";
  return (
    <Badge variant="outline" className={`text-xs font-bold tabular-nums font-mono border ${cls}`}>
      {score}
      {score < 50 && <span className="ml-1 font-normal text-[10px] opacity-70">слив</span>}
    </Badge>
  );
}

export default function AuditCallsFeed({ audits, loading }: Props) {
  const calls = audits.filter(a => a.interaction_type === "call");
  const [selected, setSelected] = useState<AuditRecord | null>(null);

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );

  if (calls.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-20 text-center">
        <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
          <Inbox className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold text-foreground">Нет аудитов звонков</p>
        <p className="text-xs text-muted-foreground mt-1">Данные появятся после загрузки записей</p>
      </div>
    );
  }

  const avgScore = Math.round(calls.reduce((s, c) => s + c.ai_score, 0) / calls.length);

  return (
    <>
      <div className="space-y-2">
        {calls.map((item, idx) => {
          const ai = isAiAgent(item.manager_name);
          const passedCount = item.checklist.filter(c => c.passed).length;
          const totalCount = item.checklist.length;
          const isIncoming = idx % 2 === 0;
          const isCritical = item.ai_score < 50;

          return (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className={`group rounded-xl border bg-card p-4 cursor-pointer transition-all hover:border-primary/20 hover:shadow-sm ${
                isCritical ? "border-[hsl(var(--status-critical)/0.15)] bg-[hsl(var(--status-critical)/0.02)]" : "border-border"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className={`text-xs font-bold ${
                    ai ? "bg-primary/10 text-primary" : isCritical ? "bg-[hsl(var(--status-critical)/0.1)] text-[hsl(var(--status-critical))]" : "bg-secondary text-muted-foreground"
                  }`}>
                    {ai ? <Bot className="h-4.5 w-4.5" /> : getInitials(item.manager_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{item.manager_name}</span>
                    {ai && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/5 text-primary border-primary/15 font-medium">AI</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{item.ai_summary}</p>
                </div>

                {/* Meta chips */}
                <div className="hidden lg:flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 text-[11px] text-muted-foreground">
                    {isIncoming ? <PhoneIncoming className="h-3 w-3 text-[hsl(var(--status-good))]" /> : <PhoneOutgoing className="h-3 w-3 text-primary" />}
                    {isIncoming ? "Вход" : "Исход"}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 text-[11px] text-muted-foreground tabular-nums font-mono">
                    <Clock className="h-3 w-3" />
                    {formatDuration(item.duration_seconds)}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-[hsl(var(--status-good))]" />
                    <span className="tabular-nums font-mono">{passedCount}/{totalCount}</span>
                  </div>
                </div>

                {/* Score */}
                <ScoreBadge score={item.ai_score} />

                {/* Action */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <AuditDetailSheet item={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </>
  );
}
