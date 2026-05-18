import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, string> = {
  booking_pending: "⏰",
  booking_confirmed: "✅",
  booking_cancelled: "❌",
  admin_broadcast: "📢",
  payment_success: "💳",
  payment_failed: "⚠️",
};

export default function NotificationPanel() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) markAsRead(notification._id);
    setIsOpen(false);

    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
    } else if (notification.type?.startsWith("booking_")) {
      navigate("/profile/bookings");
    } else {
      navigate("/notifications");
    }
  };

  return (
    <div ref={panelRef} className="relative">
      <Button
        variant="glass"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn("relative", unreadCount > 0 && "border-emerald/30")}
        aria-label={`${unreadCount} notifications`}
      >
        <Bell className={cn("h-4 w-4", unreadCount > 0 && "text-emerald")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald px-1 text-[10px] font-bold text-white shadow-glow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-white/10 bg-background/95 shadow-glass-lg backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-emerald/10 px-4 py-3">
              <div>
                <h3 className="font-display text-sm font-semibold flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald/20 px-2 py-0.5 text-xs text-emerald">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-emerald"
                    onClick={() => {
                      markAllAsRead();
                      setIsOpen(false);
                    }}
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald/30 border-t-emerald" />
                <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-12 text-center px-6">
                <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="font-medium text-sm">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">No new notifications</p>
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto">
                {recentNotifications.map((notification, index) => (
                  <button
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/[0.04]",
                      !notification.isRead && "bg-emerald/[0.04] border-l-2 border-l-emerald",
                    )}
                  >
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-sm">
                        {typeIcons[notification.type] || "🔔"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-medium truncate", !notification.isRead && "text-foreground")}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {new Date(notification.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald mt-1.5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {recentNotifications.length > 0 && (
              <div className="border-t border-white/10 p-3">
                <Button
                  variant="glow"
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    navigate("/notifications");
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  View All Notifications
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
