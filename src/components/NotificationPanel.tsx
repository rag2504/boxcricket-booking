import { useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

export default function NotificationPanel() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  // Get the latest 5 notifications for the dropdown
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    
    // Navigate to appropriate page based on notification type and action URL
    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
    } else if (notification.type?.startsWith('booking_')) {
      // For booking-related notifications, navigate to bookings page
      if (notification.data?.bookingId) {
        navigate(`/profile/bookings`);
      } else {
        navigate("/profile/bookings");
      }
    } else {
      // Default to notifications page
      navigate("/notifications");
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    setIsOpen(false);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate("/notifications");
  };

  return (
    <>
      <style>
        {`
          @keyframes bellShake {
            0%, 50%, 100% { transform: rotate(0); }
            10%, 30% { transform: rotate(-10deg); }
            20%, 40% { transform: rotate(10deg); }
          }
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
            100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
          }
          @keyframes slideDown {
            from { 
              opacity: 0; 
              transform: translateY(-20px) scale(0.95); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          @keyframes fadeInUp {
            from { 
              opacity: 0; 
              transform: translateY(10px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          .notification-panel {
            animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .notification-item {
            animation: fadeInUp 0.2s ease-out;
          }
          .notification-item:hover {
            transform: translateX(4px);
            transition: transform 0.2s ease;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (unreadCount > 0) {
              setAnimationClass('animate-pulse');
              setTimeout(() => setAnimationClass(''), 500);
            }
          }}
          style={{
            position: 'relative',
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: unreadCount > 0 ? '2px solid #f44336' : '2px solid transparent',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '22px',
            color: unreadCount > 0 ? '#f44336' : '#666',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            animation: unreadCount > 0 ? 'bellShake 2s ease-in-out infinite' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={`${unreadCount} new notifications`}
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#f44336',
                color: 'white',
                borderRadius: '50%',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                minWidth: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                animation: 'pulseGlow 2s infinite'
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        
        {isOpen && (
          <div
            className="notification-panel"
            style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              width: '380px',
              maxHeight: '500px',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              zIndex: 1000,
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              marginTop: '8px'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontWeight: '700', 
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🔔 Notifications
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  {unreadCount > 0 ? `${unreadCount} unread messages` : 'All caught up!'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    ✓ Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'white',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ✖
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center',
                background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #e2e8f0',
                  borderTop: '3px solid #667eea',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <div style={{ 
                  color: '#64748b', 
                  fontSize: '14px', 
                  fontWeight: '500' 
                }}>Loading notifications...</div>
              </div>
            ) : recentNotifications.length === 0 ? (
              /* Empty State */
              <div style={{ 
                padding: '50px 30px', 
                textAlign: 'center',
                background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)'
              }}>
                <div style={{ 
                  fontSize: '64px', 
                  marginBottom: '16px',
                  opacity: 0.6
                }}>🔔</div>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#374151', 
                  fontSize: '16px',
                  fontWeight: '600'
                }}>All caught up!</h4>
                <p style={{ 
                  margin: '0', 
                  color: '#6b7280', 
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  No new notifications right now.<br/>
                  We’ll let you know when something arrives.
                </p>
              </div>
            ) : (
              /* Notifications List */
              <div style={{ 
                maxHeight: '350px', 
                overflowY: 'auto',
                overflowX: 'hidden'
              }}>
                {recentNotifications.map((notification, index) => {
                  const priorityColors = {
                    high: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
                    medium: { bg: '#fefce8', border: '#fde047', text: '#ca8a04' },
                    low: { bg: '#f0f9ff', border: '#93c5fd', text: '#2563eb' }
                  };
                  
                  const typeIcons = {
                    'booking_pending': '⏰',
                    'booking_confirmed': '✅',
                    'booking_cancelled': '❌',
                    'admin_broadcast': '📢',
                    'payment_success': '💳',
                    'payment_failed': '⚠️'
                  };
                  
                  const priority = notification.priority || 'medium';
                  const colors = priorityColors[priority] || priorityColors.medium;
                  
                  return (
                    <div
                      key={notification._id}
                      className="notification-item"
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: index < recentNotifications.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                        cursor: 'pointer',
                        backgroundColor: !notification.isRead ? colors.bg : 'white',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        borderLeft: !notification.isRead ? `4px solid ${colors.border}` : '4px solid transparent',
                        animationDelay: `${index * 0.1}s`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = !notification.isRead ? colors.bg : '#f8fafc';
                        e.currentTarget.style.transform = 'translateX(2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = !notification.isRead ? colors.bg : 'white';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        {/* Icon */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          borderRadius: '12px',
                          backgroundColor: !notification.isRead ? colors.border + '20' : '#f1f5f9',
                          fontSize: '16px',
                          flexShrink: 0
                        }}>
                          {typeIcons[notification.type] || '🔔'}
                        </div>
                        
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: !notification.isRead ? '600' : '500',
                              color: !notification.isRead ? '#1f2937' : '#6b7280',
                              lineHeight: '1.3'
                            }}>
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: colors.border,
                                flexShrink: 0
                              }} />
                            )}
                          </div>
                          
                          <p style={{
                            margin: '0 0 12px 0',
                            fontSize: '12px',
                            color: '#64748b',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {notification.message}
                          </p>
                          
                          {/* Footer */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ 
                                fontSize: '11px', 
                                color: '#94a3b8',
                                fontWeight: '500'
                              }}>
                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                backgroundColor: colors.text + '15',
                                color: colors.text,
                                borderRadius: '6px',
                                fontWeight: '500',
                                textTransform: 'capitalize'
                              }}>
                                {notification.type?.replace('_', ' ')}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {notification.data?.bookingId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification._id);
                                    navigate(`/profile/bookings`);
                                    setIsOpen(false);
                                  }}
                                  style={{
                                    fontSize: '10px',
                                    padding: '4px 8px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#059669';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#10b981';
                                  }}
                                >
                                  View Booking
                                </button>
                              )}
                              
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification._id);
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2563eb';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#3b82f6';
                                  }}
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {recentNotifications.length > 0 && (
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                background: 'linear-gradient(90deg, #f8fafc 0%, #e2e8f0 100%)'
              }}>
                <button
                  onClick={handleViewAll}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  👁 View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
