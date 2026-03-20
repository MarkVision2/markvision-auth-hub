import { Bell, X, AlertCircle, AlertTriangle, Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; dot: string }> = {
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", dot: "bg-destructive" },
  warning: { icon: AlertTriangle, color: "text-[hsl(var(--status-warning))]", bg: "bg-[hsl(var(--status-warning))]/10", dot: "bg-[hsl(var(--status-warning))]" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10", dot: "bg-primary" },
};

function NotifItem({ notif, onDismiss }: { notif: AppNotification; onDismiss: (id: string) => void }) {
  const cfg = typeConfig[notif.type] || typeConfig.info;
  const Icon = cfg.icon;
  const timeAgo = getTimeAgo(notif.timestamp);

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors group",
      !notif.read && "bg-primary/[0.03]"
    )}>
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
        <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!notif.read && <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />}
          <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
        </div>
        {notif.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {notif.module && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium">{notif.module}</span>
          )}
          <span className="text-[10px] text-muted-foreground/50">{timeAgo}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
        onClick={() => onDismiss(notif.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "только что";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  return `${Math.floor(hours / 24)} д назад`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll, dismissNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
      markReadTimerRef.current = setTimeout(() => markAllRead(), 2000);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 border-border bg-popover shadow-2xl"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Уведомления</h3>
            {unreadCount > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-foreground h-7 text-xs gap-1">
              <Trash2 className="h-3 w-3" /> Очистить
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Нет уведомлений</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Все системы работают штатно</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotifItem key={n.id} notif={n} onDismiss={dismissNotification} />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
