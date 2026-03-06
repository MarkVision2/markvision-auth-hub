import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Bot, Phone, MessageSquare, Send, Clock, User } from "lucide-react";

interface Lead {
  name: string;
  project: string;
  source: string;
  aiScore: number;
  time: string;
  phone: string;
  assignedTo: "ai" | "manager";
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadDetailSheet({ lead, open, onOpenChange }: Props) {
  if (!lead) return null;

  const scoreColor = lead.aiScore >= 80
    ? "text-[hsl(var(--status-good))]"
    : lead.aiScore >= 60
      ? "text-[hsl(var(--status-warning))]"
      : "text-muted-foreground";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            {lead.assignedTo === "ai" ? (
              <Badge variant="outline" className="text-[10px] font-mono border-[hsl(var(--status-ai)/0.3)] bg-[hsl(var(--status-ai)/0.1)] text-[hsl(var(--status-ai))]">
                <Bot className="h-2.5 w-2.5 mr-1" />AI
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                <User className="h-2.5 w-2.5 mr-1" />Менеджер
              </Badge>
            )}
          </div>
          <SheetTitle className="text-base font-semibold">{lead.name}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">{lead.project} · {lead.source}</SheetDescription>
        </SheetHeader>

        <Separator className="bg-border" />

        {/* AI Score */}
        <div className="py-4 space-y-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">AI Оценка</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={lead.aiScore} className="h-2 bg-secondary" />
            </div>
            <span className={`text-2xl font-bold font-mono tabular-nums ${scoreColor}`}>{lead.aiScore}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {lead.aiScore >= 80 ? "Горячий лид — рекомендован приоритетный контакт" : lead.aiScore >= 60 ? "Тёплый лид — требует квалификации" : "Холодный лид — автоматическая обработка"}
          </p>
        </div>

        <Separator className="bg-border" />

        {/* Contact Info */}
        <div className="py-4 space-y-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Контакт</h3>
          <div className="space-y-2">
            {[
              { icon: Phone, label: "Телефон", value: lead.phone },
              { icon: MessageSquare, label: "Источник", value: lead.source },
              { icon: Clock, label: "Время ожидания", value: lead.time },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <item.icon className="h-3 w-3" />
                  <span className="text-xs">{item.label}</span>
                </div>
                <span className="text-xs font-mono text-foreground/80">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Actions */}
        <div className="py-4 space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">Действия</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs border-border"><Phone className="h-3 w-3 mr-1.5" />Позвонить</Button>
            <Button variant="outline" size="sm" className="text-xs border-border"><Send className="h-3 w-3 mr-1.5" />WhatsApp</Button>
          </div>
          <Button size="sm" className="w-full text-xs bg-[hsl(var(--status-ai))] hover:bg-[hsl(25_95%_46%)] text-white border-0">
            <Bot className="h-3 w-3 mr-1.5" />Передать AI-агенту
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
