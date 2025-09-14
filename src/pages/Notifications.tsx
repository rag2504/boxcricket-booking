import { useEffect, useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";

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
    console.log("📱 Notifications page loaded for user:", user?.id);
    console.log("📊 Notifications data:", { notifications, unreadCount, loading });
    refreshNotifications();
  }, []);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  const handleMarkAllRead = () => {
    markAllAsRead();
    setMessage("✅ All notifications marked as read!");
  };

  const handleRefresh = () => {
    refreshNotifications();
    setMessage("🔄 Refreshed notifications");
  };

  // Debug function to test notifications
  const handleTestUserNotifications = async () => {
    if (!user?.id) {
      setMessage("❌ No user ID available");
      return;
    }

    console.log("🧪 Testing user notifications for:", user.id);
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${user.id}`);
      const result = await response.json();
      
      console.log("🔍 Direct API result:", result);
      setMessage(`🔍 API returned ${result.notifications?.length || 0} notifications`);
    } catch (error) {
      console.error("❌ Direct API test failed:", error);
      setMessage("❌ API test failed: " + error.message);
    }
  };

  // Create a test notification for this specific user
  const handleCreateTestForMe = async () => {
    if (!user?.id) {
      setMessage("❌ No user ID available");
      return;
    }

    console.log("🔭 Creating test notification for user:", user.id, user.name);
    try {
      const response = await fetch('http://localhost:3001/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      const result = await response.json();
      console.log("📨 Create test result:", result);
      
      if (result.success) {
        setMessage("✅ Test notification created for you! Refreshing...");
        setTimeout(() => {
          refreshNotifications();
        }, 1000);
      } else {
        setMessage("❌ Failed to create test: " + result.message);
      }
    } catch (error) {
      console.error("❌ Create test error:", error);
      setMessage("❌ Create test failed: " + error.message);
    }
  };

  // Create a test notification for ALL users
  const handleCreateTestForAll = async () => {
    console.log("📢 Creating test notification for ALL users...");
    try {
      const response = await fetch('http://localhost:3001/api/create-test-for-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      console.log("🎉 Create for all result:", result);
      
      if (result.success) {
        setMessage("✅ Test notification created for ALL users! Refreshing...");
        setTimeout(() => {
          refreshNotifications();
        }, 1000);
      } else {
        setMessage("❌ Failed to create for all: " + result.message);
      }
    } catch (error) {
      console.error("❌ Create for all error:", error);
      setMessage("❌ Create for all failed: " + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        🔔 Notifications
      </h1>
      
      {user && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <strong>User:</strong> {user.name} ({user.id})
        </div>
      )}
      
      {message && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '20px', 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #2196f3',
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>📊 Stats</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {notifications.length}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total</div>
          </div>
          
          <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
              {unreadCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Unread</div>
          </div>
          
          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
              {readNotifications.length}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Read</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✅ Mark all read
            </button>
          )}
          
          <button
            onClick={handleTestUserNotifications}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧪 Test API
          </button>
          
          <button
            onClick={handleCreateTestForMe}
            style={{
              padding: '8px 16px',
              backgroundColor: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔭 Create Test
          </button>
          
          <button
            onClick={handleCreateTestForAll}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📢 For All Users
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔔</div>
          <h3 style={{ margin: '10px 0', color: '#333' }}>No notifications yet</h3>
          <p style={{ color: '#666' }}>
            You'll receive notifications here about your bookings, offers, and updates.
          </p>
        </div>
      ) : (
        <div>
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#d32f2f' }}>
                🔴 Unread Notifications ({unreadCount})
              </h2>
              
              <div>
                {unreadNotifications.map((notification) => (
                  <div key={notification._id} style={{
                    padding: '15px',
                    border: '2px solid #2196f3',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    backgroundColor: '#e3f2fd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#1976d2' }}>
                          {notification.title}
                        </h3>
                        <p style={{ margin: '0 0 10px 0', color: '#333' }}>
                          {notification.message}
                        </p>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Type: {notification.type} | Priority: {notification.priority} | 
                          Created: {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => markAsRead(notification._id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✓ Mark read
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#666' }}>
                ✅ Read Notifications ({readNotifications.length})
              </h2>
              
              <div>
                {readNotifications.map((notification) => (
                  <div key={notification._id} style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    backgroundColor: '#f5f5f5',
                    opacity: 0.7
                  }}>
                    <h3 style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#666' }}>
                      {notification.title}
                    </h3>
                    <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                      {notification.message}
                    </p>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      Type: {notification.type} | Priority: {notification.priority} | 
                      Created: {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
