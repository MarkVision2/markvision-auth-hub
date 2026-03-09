import { useState } from "react";
import {
    Lock, Eye, EyeOff, Smartphone, Monitor, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export default function SecurityTab() {
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [twoFa, setTwoFa] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Безопасность</h1>
                <p className="text-sm text-muted-foreground mt-1">Защита аккаунта, пароли и активные сессии</p>
            </div>

            {/* Password */}
            <div className="rounded-xl border border-border/30 bg-card p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <Lock size={13} className="text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Изменение пароля</span>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Текущий пароль</Label>
                        <div className="relative">
                            <Input type={showCurrent ? "text" : "password"} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className="bg-accent/30 border-border/30 pr-10" />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrent(!showCurrent)}>
                                {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Новый пароль</Label>
                            <div className="relative">
                                <Input type={showNew ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Мин. 8 символов" className="bg-accent/30 border-border/30 pr-10" />
                                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNew(!showNew)}>
                                    {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Подтверждение</Label>
                            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Повторите пароль" className="bg-accent/30 border-border/30" />
                        </div>
                    </div>
                </div>

                <Button
                    className="gap-2"
                    disabled={!currentPw || !newPw || newPw !== confirmPw}
                    onClick={() => { toast({ title: "Пароль обновлён" }); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }}
                >
                    <Lock size={14} />Обновить пароль
                </Button>
            </div>

            {/* 2FA */}
            <div className="rounded-xl border border-border/30 bg-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <Smartphone size={13} className="text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Двухфакторная аутентификация</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-accent/20 border border-border/15 p-4">
                    <div>
                        <p className="text-sm font-medium text-foreground">Включить 2FA</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Защитите аккаунт приложением-аутентификатором (Google Authenticator, Authy)</p>
                    </div>
                    <Switch
                        checked={twoFa}
                        onCheckedChange={v => { setTwoFa(v); toast({ title: v ? "2FA активирована" : "2FA отключена" }); }}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>

                {twoFa && (
                    <div className="rounded-xl bg-primary/[0.04] border border-primary/15 p-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Отсканируйте QR-код в приложении-аутентификаторе для завершения настройки. Код будет сгенерирован при подключении к бэкенду.
                        </p>
                    </div>
                )}
            </div>

            {/* Sessions */}
            <div className="rounded-xl border border-border/30 bg-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <Monitor size={13} className="text-primary" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Активные сессии</span>
                </div>

                <div className="space-y-0">
                    <div className="flex items-center gap-4 py-3.5 border-b border-border/10">
                        <div className="h-9 w-9 rounded-lg bg-accent border border-border/30 flex items-center justify-center shrink-0">
                            <Monitor size={15} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Mac OS · Safari</p>
                            <p className="text-[11px] text-muted-foreground">Алматы, Казахстан</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="text-xs text-primary font-medium">Сейчас онлайн</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-3.5">
                        <div className="h-9 w-9 rounded-lg bg-accent border border-border/30 flex items-center justify-center shrink-0">
                            <Smartphone size={15} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">iOS 17 · Safari</p>
                            <p className="text-[11px] text-muted-foreground">Астана, Казахстан</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] text-muted-foreground">2 часа назад</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                onClick={() => toast({ title: "Сеанс завершён" })}
                            >
                                <LogOut size={12} />Завершить
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
