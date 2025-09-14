import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getAuthToken } from "@/lib/api";

// Notification types
interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "booking_pending" | "booking_confirmed" | "booking_cancelled" | "booking_reminder" | "payment_success" | "payment_failed" | "admin_broadcast" | "system" | "promotion";
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
    metadata?: any;
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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // API call helper with admin panel server base URL
  const apiCall = async (endpoint: string, options?: RequestInit) => {
    const baseURL = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:3001"; // Admin panel server URL
    const url = endpoint.startsWith("http") ? endpoint : `${baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const fetchNotifications = async () => {
    if (!user?.id || !isAuthenticated) {
      console.log("⚠️ User not authenticated, skipping notification fetch");
      console.log("⚠️ User state:", { user, isAuthenticated });
      return;
    }
    
    console.log("🔄 Fetching notifications for user:", user.id);
    console.log("🔄 Full user object:", user);
    const baseURL = import.meta.env.VITE_ADMIN_API_URL || "http://localhost:3001";
    console.log("🔄 API URL will be:", `${baseURL}/api/notifications/`);
    
    setLoading(true);
    try {
      // Get auth token from localStorage
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiCall(`/api/notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("📱 User notifications response:", response);
      console.log("📱 Response status and data:", { 
        success: response.success, 
        notificationCount: response.notifications?.length,
        error: response.message 
      });
      
      if (response.success) {
        setNotifications(response.notifications || []);
        console.log("✅ Loaded", response.notifications?.length || 0, "notifications");
      } else {
        console.error("❌ Failed to fetch notifications:", response.message || response.error);
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      console.error("❌ Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;
    
    try {
      // Get auth token from localStorage
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiCall(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
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
      // Get auth token from localStorage
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use the dedicated endpoint for marking all as read
      const response = await apiCall(`/api/notifications/read-all`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true, readAt: new Date().toISOString() }))
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  // Fetch notifications when user changes or component mounts
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user?.id, isAuthenticated]);

  // Auto-refresh notifications every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

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
