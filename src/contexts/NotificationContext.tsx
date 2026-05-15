import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { notificationsApi } from "@/lib/api";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type:
    | "booking_pending"
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "payment_success"
    | "payment_failed"
    | "admin_broadcast"
    | "system"
    | "promotion";
  priority: "low" | "medium" | "high" | "urgent";
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  data?: {
    bookingId?: string;
    groundId?: string;
    amount?: number;
    actionUrl?: string;
    metadata?: unknown;
  };
  sentBy?: string;
  isGlobal?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      return;
    }

    console.log("🔄 Fetching notifications for user:", user.id);
    setLoading(true);
    try {
      const response = (await notificationsApi.getNotifications()) as {
        success?: boolean;
        notifications?: Notification[];
        message?: string;
      };

      if (response.success) {
        setNotifications(response.notifications || []);
        console.log("✅ Loaded", response.notifications?.length || 0, "notifications");
      } else {
        console.error("❌ Failed to fetch notifications:", response.message);
      }
    } catch (error) {
      const err = error as { message?: string };
      console.error("❌ Error fetching notifications:", err.message || error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const response = (await notificationsApi.markAsRead(notificationId)) as {
        success?: boolean;
      };

      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const response = (await notificationsApi.markAllAsRead()) as {
        success?: boolean;
      };

      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  useEffect(() => {
    if (user?.id && isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id, isAuthenticated, fetchNotifications]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
