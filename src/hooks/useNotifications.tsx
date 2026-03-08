import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type NotificationType = "error" | "warning" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  timestamp: Date;
  read: boolean;
  module?: string;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  browserPushEnabled: boolean;
  errorEnabled: boolean;
  warningEnabled: boolean;
  infoEnabled: boolean;
  moduleFilters: Record<string, boolean>; // module name -> enabled
}

const DEFAULT_PREFS: NotificationPreferences = {
  soundEnabled: true,
  browserPushEnabled: false,
  errorEnabled: true,
  warningEnabled: true,
  infoEnabled: true,
  moduleFilters: {},
};

function loadPrefs(): NotificationPreferences {
  try {
    const raw = localStorage.getItem("mv_notification_prefs");
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

function savePrefs(prefs: NotificationPreferences) {
  localStorage.setItem("mv_notification_prefs", JSON.stringify(prefs));
}

// Simple beep using Web Audio API — no external files needed
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Two-tone alert: 880Hz then 660Hz
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.value = 0.15;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15 + i * 0.18);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + 0.15 + i * 0.18);
    });
    setTimeout(() => ctx.close(), 500);
  } catch {}
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  pushNotification: (type: NotificationType, title: string, description?: string, module?: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  dismissNotification: (id: string) => void;
  preferences: NotificationPreferences;
  updatePreferences: (partial: Partial<NotificationPreferences>) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  pushNotification: () => {},
  markAllRead: () => {},
  clearAll: () => {},
  dismissNotification: () => {},
  preferences: DEFAULT_PREFS,
  updatePreferences: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(loadPrefs);

  const updatePreferences = useCallback((partial: Partial<NotificationPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...partial };
      savePrefs(next);
      return next;
    });
  }, []);

  const pushNotification = useCallback((type: NotificationType, title: string, description?: string, module?: string) => {
    // Check type filter
    const prefs = loadPrefs(); // read fresh to avoid stale closure
    if (type === "error" && !prefs.errorEnabled) return;
    if (type === "warning" && !prefs.warningEnabled) return;
    if (type === "info" && !prefs.infoEnabled) return;

    // Check module filter
    if (module && prefs.moduleFilters[module] === false) return;

    const newNotif: AppNotification = {
      id: crypto.randomUUID(),
      type,
      title,
      description,
      timestamp: new Date(),
      read: false,
      module,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));

    // Play sound for errors and warnings if enabled
    if (prefs.soundEnabled && (type === "error" || type === "warning")) {
      playAlertSound();
    }

    // Browser push notification when tab is not focused
    if (prefs.browserPushEnabled && document.hidden && Notification.permission === "granted") {
      try {
        const iconMap: Record<string, string> = { error: "🔴", warning: "🟡", info: "🟢" };
        new Notification(`${iconMap[type] || ""} ${title}`, {
          body: description || "",
          tag: newNotif.id,
          silent: true, // we handle sound ourselves
        });
      } catch {}
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, pushNotification,
      markAllRead, clearAll, dismissNotification,
      preferences, updatePreferences,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

/** All known modules for filter settings */
export const KNOWN_MODULES = [
  "Контент-Завод",
  "CRM",
  "Радар конкурентов",
  "Управление рекламой",
  "Аналитика",
  "AI-РОП",
  "Финансы",
] as const;
