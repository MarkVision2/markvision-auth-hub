import { Bell, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useNotifications, KNOWN_MODULES } from "@/hooks/useNotifications";

export default function NotificationsTab() {
    const { preferences, updatePreferences, pushNotification } = useNotifications();

    const toggleModule = (mod: string) => {
        const next = { ...preferences.moduleFilters, [mod]: !(preferences.moduleFilters[mod] ?? true) };
        updatePreferences({ moduleFilters: next });
    };

    const testSound = () => {
        pushNotification("error", "Тестовое уведомление 🔔", "Проверка звукового оповещения", "Система");
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Уведомления</h2>
                <p className="text-sm text-muted-foreground">Настройте звуки и фильтры для Центра уведомлений</p>
            </div>

            {/* Sound */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        {preferences.soundEnabled ? <Volume2 size={16} className="text-primary" /> : <VolumeX size={16} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Звуковые оповещения</p>
                        <p className="text-xs text-muted-foreground">Звуковой сигнал при ошибках и предупреждениях</p>
                    </div>
                    <Switch
                        checked={preferences.soundEnabled}
                        onCheckedChange={(v) => updatePreferences({ soundEnabled: v })}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={testSound} className="text-xs gap-2 border-border/50">
                    <Bell size={13} /> Тест звука
                </Button>
            </div>

            {/* Browser Push */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell size={16} className={preferences.browserPushEnabled ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Push-уведомления в браузере</p>
                        <p className="text-xs text-muted-foreground">Показывать системные уведомления когда вкладка неактивна</p>
                    </div>
                    <Switch
                        checked={preferences.browserPushEnabled}
                        onCheckedChange={async (v) => {
                            if (v) {
                                if (!("Notification" in window)) {
                                    toast({ title: "Браузер не поддерживает уведомления", variant: "destructive" });
                                    return;
                                }
                                try {
                                    const perm = Notification.permission === "granted"
                                        ? "granted"
                                        : await Notification.requestPermission();
                                    if (perm === "denied") {
                                        toast({ title: "Уведомления заблокированы", description: "Разрешите их в настройках браузера для этого сайта", variant: "destructive" });
                                        return;
                                    }
                                    if (perm !== "granted") {
                                        toast({ title: "Разрешение не получено", variant: "destructive" });
                                        return;
                                    }
                                } catch {
                                    toast({ title: "Push включены", description: "Полная поддержка доступна на опубликованном сайте" });
                                }
                            }
                            updatePreferences({ browserPushEnabled: v });
                        }}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>
                {typeof Notification !== "undefined" && Notification.permission === "denied" && (
                    <p className="text-xs text-destructive">Уведомления заблокированы в браузере. Разрешите их в настройках сайта.</p>
                )}
            </div>

            {/* Type filters */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground mb-2">Типы уведомлений</p>
                {([
                    { key: "errorEnabled" as const, label: "🔴 Ошибки", desc: "Критические сбои системы и API" },
                    { key: "warningEnabled" as const, label: "🟡 Предупреждения", desc: "ROMI ниже нуля, бюджет исчерпан" },
                    { key: "infoEnabled" as const, label: "🟢 Информация", desc: "Новые лиды, контент готов, скан завершён" },
                ]).map(item => (
                    <div key={item.key} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-colors">
                        <div>
                            <p className="text-sm text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                            checked={preferences[item.key]}
                            onCheckedChange={(v) => updatePreferences({ [item.key]: v })}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>
                ))}
            </div>

            {/* Module filters */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground mb-2">Фильтр по модулям</p>
                <p className="text-xs text-muted-foreground mb-3">Отключите уведомления из ненужных модулей</p>
                {KNOWN_MODULES.map(mod => {
                    const enabled = preferences.moduleFilters[mod] ?? true;
                    return (
                        <div key={mod} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/30 transition-colors">
                            <span className="text-sm text-foreground">{mod}</span>
                            <Switch
                                checked={enabled}
                                onCheckedChange={() => toggleModule(mod)}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
