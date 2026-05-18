import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  RefreshCw,
  CheckCheck,
  FlaskConical,
  User,
  Inbox,
  MailOpen,
  CalendarCheck,
  CreditCard,
  Megaphone,
  Settings2,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion";

type NotificationType =
  | "booking_pending"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "payment_success"
  | "payment_failed"
  | "admin_broadcast"
  | "system"
  | "promotion";

type NotificationPriority = "low" | "medium" | "high" | "urgent";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
}

const typeConfig: Record<
  NotificationType,
  { icon: React.ElementType; label: string; color: string }
> = {
  booking_pending: { icon: CalendarCheck, label: "Booking", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  booking_confirmed: { icon: CalendarCheck, label: "Booking", color: "text-emerald bg-emerald/10 border-emerald/20" },
  booking_cancelled: { icon: CalendarCheck, label: "Booking", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  booking_reminder: { icon: CalendarCheck, label: "Reminder", color: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
  payment_success: { icon: CreditCard, label: "Payment", color: "text-emerald bg-emerald/10 border-emerald/20" },
  payment_failed: { icon: CreditCard, label: "Payment", color: "text-red-400 bg-red-400/10 border-red-400/20" },
  admin_broadcast: { icon: Megaphone, label: "Broadcast", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  system: { icon: Settings2, label: "System", color: "text-muted-foreground bg-white/[0.04] border-white/10" },
  promotion: { icon: Tag, label: "Promo", color: "text-emerald bg-emerald/10 border-emerald/20" },
};

const priorityConfig: Record<NotificationPriority, string> = {
  low: "text-muted-foreground bg-white/[0.04] border-white/10",
  medium: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  high: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  urgent: "text-red-400 bg-red-400/10 border-red-400/20",
};

function getMessageVariant(message: string) {
  if (message.startsWith("✅") || message.startsWith("🔍")) return "success";
  if (message.startsWith("❌")) return "error";
  if (message.startsWith("🔄")) return "info";
  return "default";
}

function NotificationCard({
  notification,
  isUnread,
  onMarkAsRead,
}: {
  notification: NotificationItem;
  isUnread: boolean;
  onMarkAsRead?: () => void;
}) {
  const config = typeConfig[notification.type] ?? typeConfig.system;
  const Icon = config.icon;

  return (
    <GlassCard
      hover
      className={cn(
        "relative overflow-hidden p-5 transition-colors",
        isUnread && "border-emerald/20 bg-emerald/[0.03]",
      )}
    >
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald to-emerald-light rounded-l-2xl" />
      )}
      <div className="flex gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            config.color,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground leading-snug">
              {notification.title}
            </h3>
            {isUnread && (
              <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald shadow-glow-sm mt-1.5" />
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {notification.message}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-[10px] font-medium border", config.color)}
            >
              {config.label}
            </Badge>
            {isUnread && (
              <Badge
                variant="outline"
                className={cn("text-[10px] font-medium border capitalize", priorityConfig[notification.priority])}
              >
                {notification.priority}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground/70 ml-auto">
              {new Date(notification.createdAt).toLocaleString()}
            </span>
          </div>
          {isUnread && onMarkAsRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAsRead}
              className="mt-3 gap-1.5 border-emerald/20 text-emerald hover:bg-emerald/10 hover:text-emerald"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark as Read
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <GlassCard className="p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
        <Icon className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="font-medium text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </GlassCard>
  );
}

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

  const messageVariant = message ? getMessageVariant(message) : null;

  return (
    <PageShell>
      <Navbar />

      <section className="section-padding pt-4 pb-16">
        <div className="container-premium max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-emerald-light shadow-glow-sm">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="heading-display text-2xl sm:text-3xl">Notifications</h1>
                <p className="text-sm text-muted-foreground">
                  Stay updated on bookings, payments & alerts
                </p>
              </div>
            </div>
          </motion.div>

          {/* User info */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mb-6"
            >
              <GlassCard className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20">
                  <User className="h-4 w-4 text-emerald" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.id}</p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            <Button variant="glass" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="glow" size="sm" onClick={handleMarkAllRead} className="gap-2">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All Read
            </Button>
            <Button variant="outline" size="sm" onClick={handleTestUserNotifications} className="gap-2">
              <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
              Test API
            </Button>
          </motion.div>

          {/* Status message */}
          <AnimatePresence>
            {message && (
              <motion.div
                key="status-message"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mb-6 overflow-hidden"
              >
                <GlassCard
                  className={cn(
                    "flex items-start gap-3 p-4",
                    messageVariant === "success" && "border-emerald/20 bg-emerald/[0.04]",
                    messageVariant === "error" && "border-red-400/20 bg-red-400/[0.04]",
                    messageVariant === "info" && "border-sky-400/20 bg-sky-400/[0.04]",
                  )}
                >
                  {messageVariant === "success" && <CheckCircle2 className="h-4 w-4 text-emerald shrink-0 mt-0.5" />}
                  {messageVariant === "error" && <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                  {messageVariant === "info" && <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />}
                  {messageVariant === "default" && <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                  <p className="text-sm text-foreground">{message}</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-8"
          >
            <GlassCard className="grid grid-cols-3 divide-x divide-white/[0.06] p-0 overflow-hidden">
              {[
                { label: "Unread", value: unreadCount, accent: unreadCount > 0 },
                { label: "Total", value: notifications.length, accent: false },
                { label: "Status", value: loading ? "…" : "Ready", accent: false, loading },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center py-4 px-3">
                  <span
                    className={cn(
                      "text-xl font-bold font-display",
                      stat.accent ? "text-emerald" : "text-foreground",
                    )}
                  >
                    {stat.loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald" />
                    ) : (
                      stat.value
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </GlassCard>
          </motion.div>

          {/* Unread section */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-10"
          >
            <motion.div variants={staggerItem} className="flex items-center gap-2 mb-4">
              <Inbox className="h-4 w-4 text-emerald" />
              <h2 className="font-display font-semibold text-base text-foreground">
                Unread
              </h2>
              <Badge className="bg-emerald/10 text-emerald border-emerald/20 hover:bg-emerald/10 text-[10px]">
                {unreadNotifications.length}
              </Badge>
            </motion.div>

            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald" />
              </div>
            ) : unreadNotifications.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="All caught up!"
                description="No unread notifications"
              />
            ) : (
              <div className="space-y-3">
                {unreadNotifications.map((notification, i) => (
                  <motion.div
                    key={notification._id}
                    variants={staggerItem}
                    custom={i}
                  >
                    <NotificationCard
                      notification={notification}
                      isUnread
                      onMarkAsRead={() => markAsRead(notification._id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Read section */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-10"
          >
            <motion.div variants={staggerItem} className="flex items-center gap-2 mb-4">
              <MailOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display font-semibold text-base text-foreground">
                Read
              </h2>
              <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                {readNotifications.length}
              </Badge>
            </motion.div>

            {readNotifications.length === 0 ? (
              <EmptyState
                icon={MailOpen}
                title="No read notifications"
                description="Notifications you've read will appear here"
              />
            ) : (
              <div className="space-y-3">
                {readNotifications.map((notification, i) => (
                  <motion.div
                    key={notification._id}
                    variants={staggerItem}
                    custom={i}
                  >
                    <NotificationCard
                      notification={notification}
                      isUnread={false}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Debug tools */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard className="p-5 border-dashed border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="h-4 w-4 text-amber-400/70" />
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Debug Tools
                  <span className="ml-2 text-[10px] font-normal text-muted-foreground/50 uppercase tracking-wider">
                    dev only
                  </span>
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCreateTestForMe}>
                  Create Test For Me
                </Button>
                <Button variant="outline" size="sm" onClick={handleCreateTestForAll}>
                  Create Test For All
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
}
