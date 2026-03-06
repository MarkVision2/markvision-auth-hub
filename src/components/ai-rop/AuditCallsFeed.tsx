import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PhoneCall, PhoneIncoming, PhoneOutgoing, Bot, Eye } from "lucide-react";
import { MOCK_AUDITS } from "./mockData";
import type { AuditRecord } from "./types";
import AuditDetailSheet from "./AuditDetailSheet";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function isAiAgent(name: string) {
  return name.toLowerCase().includes("ai") || name.toLowerCase().includes("аи");
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return (
    <Badge className="bg-[hsl(var(--status-good)/0.12)] text-[hsl(var(--status-good))] border border-[hsl(var(--status-good)/0.25)] text-xs font-bold tabular-nums shadow-[0_0_10px_hsl(var(--status-good)/0.2)] hover:bg-[hsl(var(--status-good)/0.18)]">
      {score}/100
    </Badge>
  );
  if (score >= 50) return (
    <Badge className="bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border border-[hsl(var(--status-warning)/0.25)] text-xs font-bold tabular-nums shadow-[0_0_10px_hsl(var(--status-warning)/0.2)] hover:bg-[hsl(var(--status-warning)/0.18)]">
      {score}/100
    </Badge>
  );
  return (
    <Badge className="bg-[hsl(var(--status-critical)/0.12)] text-[hsl(var(--status-critical))] border border-[hsl(var(--status-critical)/0.25)] text-xs font-bold tabular-nums shadow-[0_0_10px_hsl(var(--status-critical)/0.2)] hover:bg-[hsl(var(--status-critical)/0.18)]">
      {score}/100 <span className="ml-1 font-normal opacity-80">Слив</span>
    </Badge>
  );
}

export default function AuditCallsFeed() {
  const calls = MOCK_AUDITS.filter(a => a.interaction_type === "call");
  const [selected, setSelected] = useState<AuditRecord | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Всего звонков: {calls.length}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          Средний балл: {Math.round(calls.reduce((s, c) => s + c.ai_score, 0) / calls.length)}
        </span>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Менеджер</TableHead>
              <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Направление</TableHead>
              <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Длительность</TableHead>
              <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">AI Оценка</TableHead>
              <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Резюме</TableHead>
              <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-right">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((item, idx) => {
              const ai = isAiAgent(item.manager_name);
              const passedCount = item.checklist.filter(c => c.passed).length;
              const totalCount = item.checklist.length;
              const isIncoming = idx % 2 === 0;

              return (
                <TableRow
                  key={item.id}
                  className={`border-border cursor-pointer transition-colors ${
                    item.ai_score < 50
                      ? "hover:bg-[hsl(var(--status-critical)/0.04)] bg-[hsl(var(--status-critical)/0.02)]"
                      : "hover:bg-accent/30"
                  }`}
                  onClick={() => setSelected(item)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`text-[10px] font-bold ${ai ? "bg-primary/15 text-primary" : item.ai_score < 50 ? "bg-[hsl(var(--status-critical)/0.12)] text-[hsl(var(--status-critical))]" : "bg-secondary text-muted-foreground"}`}>
                          {ai ? <Bot className="h-4 w-4" /> : getInitials(item.manager_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.manager_name}</p>
                        <span className="text-[10px] text-muted-foreground">✓ {passedCount}/{totalCount}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {isIncoming ? (
                        <>
                          <PhoneIncoming className="h-3.5 w-3.5 text-[hsl(var(--status-good))]" />
                          <span>Входящий</span>
                        </>
                      ) : (
                        <>
                          <PhoneOutgoing className="h-3.5 w-3.5 text-primary" />
                          <span>Исходящий</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">{formatDuration(item.duration_seconds)}</TableCell>
                  <TableCell><ScoreBadge score={item.ai_score} /></TableCell>
                  <TableCell>
                    <p className="text-xs text-foreground/70 max-w-[280px] truncate">{item.ai_summary}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-xs gap-1.5 ${item.ai_score < 50 ? "text-[hsl(var(--status-critical))] hover:text-[hsl(var(--status-critical))] hover:bg-[hsl(var(--status-critical)/0.1)]" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={(e) => { e.stopPropagation(); setSelected(item); }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Разбор
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AuditDetailSheet item={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </>
  );
}
