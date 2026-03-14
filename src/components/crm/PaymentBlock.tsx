import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CreditCard, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PaymentBlockProps {
    onPaymentConfirm: (data: { amount: number; method: string }) => void;
    customerPhone?: string;
    defaultAmount?: number;
}

export const PaymentBlock: React.FC<PaymentBlockProps> = ({
    onPaymentConfirm,
    customerPhone = "",
    defaultAmount = 5000
}) => {
    const [amount, setAmount] = useState(defaultAmount.toString());
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSendInvoice = () => {
        setIsSending(true);
        // Simulate API call to Kaspi
        setTimeout(() => {
            setIsSending(false);
            setIsSent(true);
        }, 1500);
    };

    const handleConfirm = () => {
        onPaymentConfirm({ amount: parseInt(amount), method: "Kaspi" });
    };

    return (
        <div className="space-y-6">
            <div className="bg-secondary/10 rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">Предоплата через Kaspi</h3>
                        <p className="text-sm text-muted-foreground">Клиент получит счет в приложении Kaspi.kz</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Сумма к оплате (₸)</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-11 bg-background border-border text-lg font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Телефон клиента</Label>
                        <Input
                            value={customerPhone}
                            disabled
                            className="h-11 bg-background border-border opacity-70"
                        />
                    </div>
                </div>

                {!isSent ? (
                    <Button
                        onClick={handleSendInvoice}
                        disabled={isSending}
                        className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs gap-2"
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Выставить счет в Kaspi
                    </Button>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 rounded-xl bg-[hsl(var(--status-good))/0.1] border border-[hsl(var(--status-good))/0.2] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-good))]" />
                                <span className="text-sm font-medium text-foreground">Счет на {amount} ₸ отправлен</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsSent(false)} className="text-[10px] uppercase font-bold h-7">Изменить</Button>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-500 font-medium leading-relaxed">
                                Дождитесь подтверждения оплаты клиентом в приложении. После того как клиент оплатит, нажмите «Подтвердить», чтобы закрепить запись.
                            </p>
                        </div>

                        <Button
                            onClick={handleConfirm}
                            className="w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs bg-[hsl(var(--status-good))] hover:bg-[hsl(var(--status-good))/0.9]"
                        >
                            Подтвердить оплату
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: "Запись подтверждена", icon: CheckCircle2, color: "text-[hsl(var(--status-good))]" },
                    { label: "Место забронировано", icon: CheckCircle2, color: "text-[hsl(var(--status-good))]" },
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border text-center opacity-50">
                        <item.icon className={cn("h-5 w-5 mb-2", item.color)} />
                        <span className="text-[10px] uppercase font-black tracking-tighter text-muted-foreground">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
