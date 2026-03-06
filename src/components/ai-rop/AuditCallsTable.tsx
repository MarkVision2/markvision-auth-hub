import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PhoneCall, Bot, User, Eye } from "lucide-react";
import AuditDetailSheet from "./AuditDetailSheet";

export interface AuditItem {
  id: string;
  date: string;
  time: string;
  managerName: string;
  isAi: boolean;
  leadName: string;
  type: "call" | "chat";
  duration: string;
  score: number;
  verdict: string;
  summary: string;
  checklist: { label: string; max: number; score: number; comment?: string }[];
  transcript: { from: "client" | "manager" | "ai"; text: string; time: string; isError?: boolean; errorComment?: string }[];
}

const MOCK_CALLS: AuditItem[] = [
  {
    id: "1", date: "06.03.2026", time: "14:32", managerName: "Алия Нурланова", isAi: false,
    leadName: "Камила Ержанова", type: "call", duration: "4:12", score: 92,
    verdict: "Отличный звонок", summary: "Менеджер провёл звонок по скрипту, выявил потребности и записал на визит.",
    checklist: [
      { label: "Приветствие и знакомство", max: 10, score: 10 },
      { label: "Выявление потребности", max: 20, score: 18 },
      { label: "Презентация услуги", max: 20, score: 20 },
      { label: "Отработка возражений", max: 30, score: 24, comment: "Небольшая пауза при ответе на вопрос о гарантии" },
      { label: "Закрытие на визит", max: 20, score: 20 },
    ],
    transcript: [
      { from: "manager", text: "Здравствуйте, Камила! Меня зовут Алия, клиника SmileDent. Вы оставляли заявку на имплантацию?", time: "0:00" },
      { from: "client", text: "Да, здравствуйте! Хочу узнать подробнее.", time: "0:08" },
      { from: "manager", text: "Отлично! Подскажите, какой зуб вас беспокоит? Верхний или нижний?", time: "0:15" },
      { from: "client", text: "Нижний, жевательный. Удалили полгода назад.", time: "0:22" },
      { from: "manager", text: "Понятно. Для жевательных зубов мы рекомендуем импланты Osstem — отличное соотношение цены и качества. Стоимость от 180 000 тенге, включая коронку.", time: "0:30" },
      { from: "client", text: "А есть рассрочка?", time: "0:52" },
      { from: "manager", text: "Да, рассрочка до 12 месяцев без процентов! Давайте запишу вас на бесплатную консультацию к хирургу?", time: "0:58" },
      { from: "client", text: "Давайте, на четверг.", time: "1:12" },
    ],
  },
  {
    id: "2", date: "06.03.2026", time: "13:05", managerName: "Дамир Касымов", isAi: false,
    leadName: "Артём Волков", type: "call", duration: "2:47", score: 30,
    verdict: "Слив лида", summary: "Менеджер не попытался закрыть сделку и не предложил альтернативу. Клиент ушёл с возражением «Дорого» без отработки.",
    checklist: [
      { label: "Приветствие и знакомство", max: 10, score: 10 },
      { label: "Выявление потребности", max: 20, score: 15, comment: "Не уточнил бюджет клиента" },
      { label: "Презентация услуги", max: 20, score: 5, comment: "Назвал цену без объяснения ценности" },
      { label: "Отработка возражений", max: 30, score: 0, comment: "Проигнорировал сомнения клиента о цене" },
      { label: "Закрытие на визит", max: 20, score: 0, comment: "Сам положил трубку после паузы клиента" },
    ],
    transcript: [
      { from: "manager", text: "Алло, здравствуйте! Клиника SmileDent, Дамир.", time: "0:00" },
      { from: "client", text: "Здравствуйте, хотел узнать стоимость виниров.", time: "0:05" },
      { from: "manager", text: "Виниры у нас от 120 000 за один зуб.", time: "0:12" },
      { from: "client", text: "Ого, это дорого... А подешевле есть варианты?", time: "0:18" },
      { from: "manager", text: "Нет, это минимальная цена.", time: "0:24", isError: true, errorComment: "Не предложил альтернативу (композитные виниры, рассрочку). Закрыл тему одной фразой." },
      { from: "client", text: "Ну ладно, я подумаю тогда...", time: "0:30" },
      { from: "manager", text: "Хорошо, звоните если что.", time: "0:35", isError: true, errorComment: "Не попытался удержать клиента, не предложил бесплатную консультацию, не взял контакт." },
    ],
  },
  {
    id: "3", date: "06.03.2026", time: "11:20", managerName: "AI-Агент", isAi: true,
    leadName: "Мария Сидорова", type: "call", duration: "3:05", score: 98,
    verdict: "Эталонный звонок", summary: "AI-агент безупречно провёл диалог по скрипту, отработал все возражения и записал клиента на визит.",
    checklist: [
      { label: "Приветствие и знакомство", max: 10, score: 10 },
      { label: "Выявление потребности", max: 20, score: 20 },
      { label: "Презентация услуги", max: 20, score: 20 },
      { label: "Отработка возражений", max: 30, score: 28, comment: "Минимальная задержка перед ответом на нестандартный вопрос" },
      { label: "Закрытие на визит", max: 20, score: 20 },
    ],
    transcript: [
      { from: "ai", text: "Добрый день, Мария! Это клиника SmileDent. Вы оставляли заявку на отбеливание зубов. Подскажите, какой результат вы хотите получить?", time: "0:00" },
      { from: "client", text: "Хочу голливудскую улыбку! Но боюсь, что будет вредно для эмали.", time: "0:10" },
      { from: "ai", text: "Понимаю ваши опасения! Мы используем систему Zoom 4 — она безопасна для эмали и рекомендована стоматологической ассоциацией. Результат — до 8 тонов отбеливания за один сеанс.", time: "0:18" },
      { from: "client", text: "А сколько стоит?", time: "0:35" },
      { from: "ai", text: "Полная процедура — 45 000 ₸. Сейчас действует акция: при записи сегодня — диагностика бесплатно. Когда вам удобно прийти?", time: "0:40" },
      { from: "client", text: "Давайте на пятницу!", time: "0:55" },
    ],
  },
  {
    id: "4", date: "05.03.2026", time: "16:45", managerName: "Дамир Касымов", isAi: false,
    leadName: "Елена Новикова", type: "call", duration: "1:30", score: 42,
    verdict: "Потерянный клиент", summary: "Менеджер не выявил потребность и назвал цену без контекста. Клиент отказался.",
    checklist: [
      { label: "Приветствие и знакомство", max: 10, score: 8 },
      { label: "Выявление потребности", max: 20, score: 5, comment: "Не задал ни одного уточняющего вопроса" },
      { label: "Презентация услуги", max: 20, score: 10 },
      { label: "Отработка возражений", max: 30, score: 9, comment: "Попытка была, но неубедительная" },
      { label: "Закрытие на визит", max: 20, score: 10 },
    ],
    transcript: [
      { from: "manager", text: "SmileDent, слушаю.", time: "0:00", isError: true, errorComment: "Не представился, не назвал имя клиента" },
      { from: "client", text: "Здравствуйте, интересуюсь чисткой зубов.", time: "0:04" },
      { from: "manager", text: "Чистка стоит 15 000.", time: "0:08" },
      { from: "client", text: "А что входит?", time: "0:12" },
      { from: "manager", text: "Ультразвук и полировка. Записать?", time: "0:16" },
      { from: "client", text: "Я ещё подумаю, спасибо.", time: "0:22" },
    ],
  },
  {
    id: "5", date: "05.03.2026", time: "10:00", managerName: "Алия Нурланова", isAi: false,
    leadName: "Сергей Ким", type: "call", duration: "5:20", score: 85,
    verdict: "Хороший звонок", summary: "Менеджер хорошо отработал диалог, но не до конца раскрыл ценность услуги.",
    checklist: [
      { label: "Приветствие и знакомство", max: 10, score: 10 },
      { label: "Выявление потребности", max: 20, score: 18 },
      { label: "Презентация услуги", max: 20, score: 15, comment: "Не упомянул гарантию и акции" },
      { label: "Отработка возражений", max: 30, score: 22 },
      { label: "Закрытие на визит", max: 20, score: 20 },
    ],
    transcript: [
      { from: "manager", text: "Здравствуйте, Сергей! Клиника SmileDent, Алия. Вы интересовались установкой брекетов?", time: "0:00" },
      { from: "client", text: "Да, для дочери 14 лет.", time: "0:08" },
      { from: "manager", text: "Отлично! Подскажите, вы уже консультировались с ортодонтом?", time: "0:14" },
      { from: "client", text: "Нет ещё, хотели узнать цены сначала.", time: "0:20" },
      { from: "manager", text: "Конечно! У нас металлические брекеты от 350 000, керамические от 450 000. Записать на бесплатную консультацию?", time: "0:28" },
      { from: "client", text: "Давайте на следующую неделю.", time: "0:45" },
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

export default function AuditCallsTable() {
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
            {MOCK_CALLS.map((item) => (
              <TableRow key={item.id} className="border-border hover:bg-accent/30 group">
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
                    <PhoneCall className="h-3 w-3" /> Звонок
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
