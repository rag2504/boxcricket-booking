import { useEffect, useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/lib/api";

export default function Notifications() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const [message, setMessage] = useState("");

  useEffect(() => {
    refreshNotifications();
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  const handleMarkAllRead = () => {
    markAllAsRead();
    setMessage("✅ All notifications marked as read!");
  };

  const handleRefresh = () => {
    refreshNotifications();
    setMessage("🔄 Refreshed notifications");
  };

  const handleTestUserNotifications = async () => {
    if (!user?.id) {
      setMessage("❌ No user ID available");
      return;
    }

    try {
      const result = (await notificationsApi.getNotifications()) as {
        success?: boolean;
        notifications?: unknown[];
        message?: string;
      };
      setMessage(
        `🔍 API returned ${result.notifications?.length || 0} notifications`
      );
    } catch (error) {
      const err = error as { message?: string };
      setMessage("❌ API test failed: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateTestForMe = () => {
    setMessage(
      "Test notification creation is only available via the admin panel in production."
    );
  };

  const handleCreateTestForAll = () => {
    setMessage(
      "Broadcast notifications are only available via the admin panel in production."
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        🔔 Notifications
      </h1>

      {user && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
          }}
        >
          <strong>User:</strong> {user.name} ({user.id})
        </div>
      )}

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={handleRefresh}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🔄 Refresh
        </button>
        <button
          onClick={handleMarkAllRead}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ✅ Mark All Read
        </button>
        <button
          onClick={handleTestUserNotifications}
          style={{
            padding: "8px 16px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          🧪 Test API
        </button>
      </div>

      {message && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#e3f2fd",
            borderRadius: "4px",
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <strong>Unread:</strong> {unreadCount} | <strong>Total:</strong>{" "}
        {notifications.length} | <strong>Loading:</strong>{" "}
        {loading ? "Yes" : "No"}
      </div>

      <h2 style={{ fontSize: "18px", marginTop: "20px", marginBottom: "10px" }}>
        Unread Notifications ({unreadNotifications.length})
      </h2>
      {unreadNotifications.length === 0 ? (
        <p style={{ color: "#666" }}>No unread notifications</p>
      ) : (
        unreadNotifications.map((notification) => (
          <div
            key={notification._id}
            style={{
              padding: "15px",
              marginBottom: "10px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "4px",
            }}
          >
            <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>
              {notification.title}
            </h3>
            <p style={{ marginBottom: "10px" }}>{notification.message}</p>
            <div style={{ fontSize: "12px", color: "#666" }}>
              Type: {notification.type} | Priority: {notification.priority} |
              Created: {new Date(notification.createdAt).toLocaleString()}
            </div>
            <button
              onClick={() => markAsRead(notification._id)}
              style={{
                marginTop: "10px",
                padding: "5px 10px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Mark as Read
            </button>
          </div>
        ))
      )}

      <h2 style={{ fontSize: "18px", marginTop: "30px", marginBottom: "10px" }}>
        Read Notifications ({readNotifications.length})
      </h2>
      {readNotifications.length === 0 ? (
        <p style={{ color: "#666" }}>No read notifications</p>
      ) : (
        readNotifications.map((notification) => (
          <div
            key={notification._id}
            style={{
              padding: "15px",
              marginBottom: "10px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
            }}
          >
            <h3 style={{ fontWeight: "bold", marginBottom: "5px" }}>
              {notification.title}
            </h3>
            <p style={{ marginBottom: "10px" }}>{notification.message}</p>
            <div style={{ fontSize: "12px", color: "#666" }}>
              Type: {notification.type} | Created:{" "}
              {new Date(notification.createdAt).toLocaleString()}
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: "30px", padding: "15px", backgroundColor: "#f0f0f0" }}>
        <h3 style={{ marginBottom: "10px" }}>Debug Tools (dev only)</h3>
        <button onClick={handleCreateTestForMe} style={{ marginRight: "10px" }}>
          Create Test For Me
        </button>
        <button onClick={handleCreateTestForAll}>Create Test For All</button>
      </div>
    </div>
  );
}
