import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Clock, Calendar, Zap } from "lucide-react";

export function AutomationDialog() {
    const [enabled, setEnabled] = useState(false);
    const [frequency, setFrequency] = useState("weekly");
    const [groupId, setGroupId] = useState("");

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2 text-sm h-9 text-muted-foreground hover:text-foreground">
                    <Send className="h-4 w-4" />Авто-отправка
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] border-border/30">
                <DialogHeader>
                    <DialogTitle className="text-lg flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" />Автоматизация отчётов
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">Настройте регулярную отправку в Telegram</p>
                </DialogHeader>
                <div className="space-y-5 mt-4">
                    <div className="flex items-center justify-between rounded-xl bg-accent/30 p-4">
                        <div>
                            <p className="text-sm font-medium text-foreground">Включить регулярные отчёты</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Автоматическая отправка</p>
                        </div>
                        <Switch checked={enabled} onCheckedChange={setEnabled} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Частота</label>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Еженедельно</div></SelectItem>
                                <SelectItem value="biweekly"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Раз в 2 недели</div></SelectItem>
                                <SelectItem value="monthly"><div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />Ежемесячно</div></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Telegram Group ID</label>
                        <Input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="-100XXXXXXXXXX" className="h-10 font-mono text-sm" />
                    </div>
                    <Button className="w-full h-10 text-sm font-semibold gap-2" disabled={!enabled}>
                        <Zap className="h-4 w-4" />Сохранить расписание
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
