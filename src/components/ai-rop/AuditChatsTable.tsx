import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Bot, Eye } from "lucide-react";
import AuditDetailSheet from "./AuditDetailSheet";
import type { AuditItem } from "./AuditCallsTable";

const MOCK_CHATS: AuditItem[] = [
  {
    id: "c1", date: "06.03.2026", time: "15:10", managerName: "AI-Агент", isAi: true,
    leadName: "Алина Каримова", type: "chat", duration: "12 мин", score: 96,
    verdict: "Отличный чат", summary: "AI-агент грамотно провёл диалог в WhatsApp, выявил потребность и записал на визит.",
    checklist: [
      { label: "Приветствие и знакомство", max: 10, score: 10 },
      { label: "Выявление потребности", max: 20, score: 20 },
      { label: "Презентация услуги", max: 20, score: 18, comment: "Не упомянул акцию дня" },
      { label: "Отработка возражений", max: 30, score: 28 },
      { label: "Закрытие на визит", max: 20, score: 20 },
    ],
    transcript: [
      { from: "client", text: "Здравствуйте! Сколько стоит отбеливание?", time: "15:10" },
      { from: "ai", text: "Добрый день, Алина! 😊 Отбеливание Zoom 4 — 45 000 ₸. Результат до 8 тонов за 1 сеанс. Интересует?", time: "15:10" },
      { from: "client", text: "А это безопасно?", time: "15:12" },
      { from: "ai", text: "Абсолютно! Zoom 4 одобрена мировыми стоматологическими ассоциациями. Эмаль не повреждается. Хотите записаться на бесплатную консультацию?", time: "15:12" },
      { from: "client", text: "Да, давайте на субботу!", time: "15:15" },
      { from: "ai", text: "Записала вас на субботу 10:00! Адрес: ул. Абая 150, 2 этаж. Напомню за день до визита 😊", time: "15:15" },
    ],
  },
  {
    id: "c2", date: "06.03.2026", time: "12:30", managerName: "Дамир Касымов", isAi: false,
    leadName: "Даниил Петров", type: "chat", duration: "8 мин", score: 25,
    verdict: "Слив лида", summary: "Менеджер отвечал односложно, не проявил заинтересованности и не предложил запись.",
    checklist: [
      { label: "Приветствие и знакомство", max: 10, score: 5, comment: "Не поздоровался по имени" },
      { label: "Выявление потребности", max: 20, score: 5, comment: "Не задал ни одного вопроса" },
      { label: "Презентация услуги", max: 20, score: 5, comment: "Просто скинул прайс" },
      { label: "Отработка возражений", max: 30, score: 5, comment: "Ответил 'ну как хотите'" },
      { label: "Закрытие на визит", max: 20, score: 5, comment: "Не предложил записаться" },
    ],
    transcript: [
      { from: "client", text: "Добрый день, сколько стоят виниры?", time: "12:30" },
      { from: "manager", text: "от 120к", time: "12:35", isError: true, errorComment: "Ответ через 5 минут, без приветствия и форматирования" },
      { from: "client", text: "А подешевле есть?", time: "12:36" },
      { from: "manager", text: "нет", time: "12:40", isError: true, errorComment: "Односложный ответ. Не предложил композитные виниры или рассрочку." },
      { from: "client", text: "Ясно, спасибо", time: "12:41" },
      { from: "manager", text: "👍", time: "12:45", isError: true, errorComment: "Не попытался удержать клиента. Потерян лид с потенциалом 960 000 ₸" },
    ],
  },
  {
    id: "c3", date: "05.03.2026", time: "09:15", managerName: "Алия Нурланова", isAi: false,
    leadName: "Ольга Тен", type: "chat", duration: "15 мин", score: 82,
    verdict: "Хороший чат", summary: "Менеджер хорошо провела диалог, но забыла предложить рассрочку при обсуждении цены.",
    checklist: [
      { label: "Приветствие и знакомство", max: 10, score: 10 },
      { label: "Выявление потребности", max: 20, score: 18 },
      { label: "Презентация услуги", max: 20, score: 16, comment: "Не предложила рассрочку" },
      { label: "Отработка возражений", max: 30, score: 20 },
      { label: "Закрытие на визит", max: 20, score: 18 },
    ],
    transcript: [
      { from: "client", text: "Здравствуйте! Нужна консультация по брекетам для ребёнка", time: "09:15" },
      { from: "manager", text: "Здравствуйте, Ольга! С удовольствием помогу. Сколько лет ребёнку?", time: "09:16" },
      { from: "client", text: "12 лет, ортодонт сказал нужно ставить", time: "09:18" },
      { from: "manager", text: "Понятно! У нас есть металлические от 350 000 и керамические от 450 000. Запишу вас на консультацию?", time: "09:20" },
      { from: "client", text: "Да, на следующей неделе", time: "09:25" },
    ],
  },
];

function scoreBadge(score: number) {
  if (score >= 80) return (
    <Badge className="bg-[hsl(var(--status-good)/0.15)] text-[hsl(var(--status-good))] border border-[hsl(var(--status-good)/0.3)] text-xs font-bold tabular-nums shadow-[0_0_8px_hsl(var(--status-good)/0.2)]">
      {score}/100
    </Badge>
  );
  if (score >= 50) return (
    <Badge className="bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border border-[hsl(var(--status-warning)/0.3)] text-xs font-bold tabular-nums shadow-[0_0_8px_hsl(var(--status-warning)/0.2)]">
      {score}/100
    </Badge>
  );
  return (
    <Badge className="bg-[hsl(var(--status-critical)/0.15)] text-[hsl(var(--status-critical))] border border-[hsl(var(--status-critical)/0.3)] text-xs font-bold tabular-nums shadow-[0_0_8px_hsl(var(--status-critical)/0.2)]">
      {score}/100 <span className="ml-1 font-normal">Слив</span>
    </Badge>
  );
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function AuditChatsTable() {
  const [selected, setSelected] = useState<AuditItem | null>(null);

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground font-medium">Дата</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Менеджер</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Клиент</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Тип</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">Длит.</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium">AI Оценка</TableHead>
              <TableHead className="text-xs text-muted-foreground font-medium text-right">Действие</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CHATS.map((item) => (
              <TableRow key={item.id} className="border-border hover:bg-accent/30">
                <TableCell className="text-sm text-muted-foreground tabular-nums">{item.date}<br /><span className="text-xs">{item.time}</span></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={`text-[10px] font-bold ${item.isAi ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {item.isAi ? <Bot className="h-3.5 w-3.5" /> : getInitials(item.managerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.managerName}</p>
                      {item.isAi && <span className="text-[10px] text-primary">AI Agent</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-foreground/80">{item.leadName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> Чат
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">{item.duration}</TableCell>
                <TableCell>{scoreBadge(item.score)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => setSelected(item)}>
                    <Eye className="h-3 w-3" /> Разбор
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AuditDetailSheet item={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </>
  );
}
