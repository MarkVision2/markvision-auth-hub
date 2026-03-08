import { createContext, useContext, useState, useCallback, ReactNode } from "react";

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

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  pushNotification: (type: NotificationType, title: string, description?: string, module?: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  pushNotification: () => {},
  markAllRead: () => {},
  clearAll: () => {},
  dismissNotification: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const pushNotification = useCallback((type: NotificationType, title: string, description?: string, module?: string) => {
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
    <NotificationContext.Provider value={{ notifications, unreadCount, pushNotification, markAllRead, clearAll, dismissNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
