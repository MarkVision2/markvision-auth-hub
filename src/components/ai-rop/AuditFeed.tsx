import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PhoneCall, MessageCircle, Bot, Eye, Filter, Inbox } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuditRecord } from "./types";
import AuditDetailSheet from "./AuditDetailSheet";

interface Props { audits: AuditRecord[]; loading: boolean; }

function formatDuration(seconds: number) {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function getInitials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }
function isAiAgent(name: string) { return name.toLowerCase().includes("ai") || name.toLowerCase().includes("аи"); }

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge className="bg-[hsl(var(--status-good)/0.12)] text-[hsl(var(--status-good))] border border-[hsl(var(--status-good)/0.25)] text-xs font-bold tabular-nums hover:bg-[hsl(var(--status-good)/0.18)]">{score}/100</Badge>;
  if (score >= 50) return <Badge className="bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border border-[hsl(var(--status-warning)/0.25)] text-xs font-bold tabular-nums hover:bg-[hsl(var(--status-warning)/0.18)]">{score}/100</Badge>;
  return <Badge className="bg-[hsl(var(--status-critical)/0.12)] text-[hsl(var(--status-critical))] border border-[hsl(var(--status-critical)/0.25)] text-xs font-bold tabular-nums hover:bg-[hsl(var(--status-critical)/0.18)]">{score}/100 <span className="ml-1 font-normal opacity-80">Слив</span></Badge>;
}

export default function AuditFeed({ audits, loading }: Props) {
  const [selected, setSelected] = useState<AuditRecord | null>(null);
  const [filterType, setFilterType] = useState<"all" | "call" | "whatsapp">("all");
  const [filterScore, setFilterScore] = useState<"all" | "good" | "bad">("all");

  const filtered = audits.filter(a => {
    if (filterType !== "all" && a.interaction_type !== filterType) return false;
    if (filterScore === "good" && a.ai_score < 80) return false;
    if (filterScore === "bad" && a.ai_score >= 50) return false;
    return true;
  });

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" />Фильтры:</div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as "all" | "call" | "whatsapp")}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary/50 border-border"><SelectValue placeholder="Тип" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            <SelectItem value="call">Звонки</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterScore} onValueChange={(v) => setFilterScore(v as "all" | "good" | "bad")}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-secondary/50 border-border"><SelectValue placeholder="Оценка" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все оценки</SelectItem>
            <SelectItem value="good">Хорошие (80+)</SelectItem>
            <SelectItem value="bad">Критичные (&lt;50)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} из {audits.length} записей</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold text-foreground">Нет данных для отображения</p>
          <p className="text-xs text-muted-foreground mt-1">Измените фильтры или загрузите аудиты</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Менеджер</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Тип</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Длит.</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">AI Оценка</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Резюме</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const ai = isAiAgent(item.manager_name);
                const passedCount = item.checklist.filter(c => c.passed).length;
                const totalCount = item.checklist.length;
                return (
                  <TableRow key={item.id} className={`border-border cursor-pointer transition-colors ${item.ai_score < 50 ? "hover:bg-[hsl(var(--status-critical)/0.04)] bg-[hsl(var(--status-critical)/0.02)]" : "hover:bg-accent/30"}`} onClick={() => setSelected(item)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-[10px] font-bold ${ai ? "bg-primary/15 text-primary" : item.ai_score < 50 ? "bg-[hsl(var(--status-critical)/0.12)] text-[hsl(var(--status-critical))]" : "bg-secondary text-muted-foreground"}`}>
                            {ai ? <Bot className="h-4 w-4" /> : getInitials(item.manager_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.manager_name}</p>
                          {ai && <span className="text-[10px] text-primary font-medium">AI Agent</span>}
                          <span className="text-[10px] text-muted-foreground ml-1">✓ {passedCount}/{totalCount}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.interaction_type === "call" ? <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><PhoneCall className="h-3.5 w-3.5" /> Звонок</div> : <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--status-good))]"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</div>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{formatDuration(item.duration_seconds)}</TableCell>
                    <TableCell><ScoreBadge score={item.ai_score} /></TableCell>
                    <TableCell><p className="text-xs text-foreground/70 max-w-[280px] truncate">{item.ai_summary}</p></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className={`h-7 text-xs gap-1.5 ${item.ai_score < 50 ? "text-[hsl(var(--status-critical))] hover:text-[hsl(var(--status-critical))] hover:bg-[hsl(var(--status-critical)/0.1)]" : "text-muted-foreground hover:text-foreground"}`} onClick={(e) => { e.stopPropagation(); setSelected(item); }}>
                        <Eye className="h-3.5 w-3.5" />Разбор
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <AuditDetailSheet item={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </>
  );
}