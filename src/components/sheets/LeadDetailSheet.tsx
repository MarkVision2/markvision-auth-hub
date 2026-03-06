import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Bot, Phone, MessageSquare, Send, Clock, User } from "lucide-react";

interface Lead {
  name: string;
  project: string;
  source: string;
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
