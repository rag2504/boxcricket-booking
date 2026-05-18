import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  Clock,
  ArrowLeft,
  Timer,
  BookOpen,
  Loader2,
  MapPin,
  Users,
  IndianRupee,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useAuth } from "@/contexts/AuthContext";
import { bookingsApi } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface BookingData {
  _id: string;
  bookingId: string;
  groundId: {
    _id: string;
    name: string;
    location: {
      address: string;
    };
  };
  bookingDate: string;
  timeSlot: {
    startTime: string;
    endTime: string;
    duration: number;
  };
  playerDetails: {
    teamName?: string;
    playerCount: number;
    contactPerson: {
      name: string;
      phone: string;
      email: string;
    };
    requirements?: string;
  };
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  pricing: {
    baseAmount: number;
    discount: number;
    taxes: number;
    totalAmount: number;
    currency: string;
  };
  createdAt: string;
}

const statusConfig: Record<BookingData["status"], string> = {
  confirmed: "text-emerald bg-emerald/10 border-emerald/20",
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  completed: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  no_show: "text-muted-foreground bg-white/[0.04] border-white/10",
};

// Countdown Timer Component for Pending Bookings
const BookingCountdown = ({
  createdAt,
  onExpired,
}: {
  createdAt: string;
  onExpired: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const bookingTime = new Date(createdAt).getTime();
      const expiryTime = bookingTime + 5 * 60 * 1000;
      const now = new Date().getTime();
      const remaining = Math.max(0, expiryTime - now);

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        onExpired();
      }

      return remaining;
    };

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    }, 1000);

    const initial = calculateTimeLeft();
    setTimeLeft(initial);

    return () => clearInterval(timer);
  }, [createdAt, isExpired, onExpired]);

  if (timeLeft <= 0) {
    return (
      <GlassCard className="mt-3 p-3 border-red-400/20 bg-red-400/[0.04]">
        <div className="flex items-center gap-2 text-red-400">
          <Timer className="h-4 w-4" />
          <span className="text-sm font-medium">
            Booking expired — will be cancelled soon
          </span>
        </div>
      </GlassCard>
    );
  }

  const minutes = Math.floor(timeLeft / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const progress = (timeLeft / (5 * 60 * 1000)) * 100;

  return (
    <GlassCard className="mt-3 p-3 border-amber-400/20 bg-amber-400/[0.04]">
      <motion.div
        className="flex items-center justify-between gap-3"
        animate={{ opacity: [1, 0.85, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex items-center gap-2 text-amber-400 min-w-0">
          <Timer className="h-4 w-4 shrink-0 animate-pulse" />
          <span className="text-sm font-medium">
            Complete payment in {minutes}:{seconds.toString().padStart(2, "0")} or
            booking will be cancelled
          </span>
        </div>
        <span className="font-mono font-bold text-amber-400 shrink-0">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </motion.div>
      <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300"
          style={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>
    </GlassCard>
  );
};

function AuthGate({
  title,
  description,
  onNavigate,
}: {
  title: string;
  description: string;
  onNavigate: () => void;
}) {
  return (
    <PageShell>
      <Navbar />
      <section className="section-padding pt-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="container-premium max-w-lg mx-auto"
        >
          <GlassCard className="p-10 text-center" glow>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <User className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">{description}</p>
            <Button variant="glow" onClick={onNavigate}>
              Go to Home
            </Button>
          </GlassCard>
        </motion.div>
      </section>
    </PageShell>
  );
}

const Bookings = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBookings();
    }
  }, [isAuthenticated]);

  const fetchUserBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const response: any = await bookingsApi.getMyBookings();
      //@ts-ignore
      if (response.success) {
        //@ts-ignore
        setBookings(response.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load your bookings");
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleBookingExpired = (bookingId: string) => {
    console.log(`Booking ${bookingId} has expired, refreshing booking list...`);
    fetchUserBookings();
  };

  const triggerManualCleanup = async () => {
    try {
      const token = localStorage.getItem("boxcric_token");
      const apiBase = API_BASE_URL;

      const response = await fetch(`${apiBase}/bookings/cleanup-expired`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Cleanup completed: ${data.expiredCount} expired bookings processed`,
        );
        fetchUserBookings();
      } else {
        toast.error("Cleanup failed: " + data.message);
      }
    } catch (error) {
      console.error("Manual cleanup error:", error);
      toast.error("Failed to trigger cleanup");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeSlot: { startTime: string; endTime: string }) => {
    return `${timeSlot.startTime} to ${timeSlot.endTime}`;
  };

  const validBookings = bookings.filter((b) => b.groundId);
  const activeCount = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending",
  ).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  if (!isAuthenticated) {
    return (
      <AuthGate
        title="Please login to view your bookings"
        description="You need to be logged in to access your booking history."
        onNavigate={() => navigate("/")}
      />
    );
  }

  return (
    <PageShell>
      <Navbar />

      <section className="section-padding pt-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="container-premium max-w-4xl"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-emerald"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>

            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-emerald-light shadow-glow-sm">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="heading-display text-2xl sm:text-3xl">My Bookings</h1>
                  <p className="text-sm text-muted-foreground">
                    Your complete booking history & status
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="glow" onClick={() => navigate("/")} className="w-full sm:w-auto">
                  Book New Ground
                </Button>
                {import.meta.env.DEV && (
                  <Button
                    variant="outline"
                    className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10 w-full sm:w-auto"
                    onClick={triggerManualCleanup}
                  >
                    Force Cleanup
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06] p-0 overflow-hidden">
              {[
                { label: "Total", value: validBookings.length, accent: false },
                { label: "Active", value: activeCount, accent: activeCount > 0 },
                { label: "Pending", value: pendingCount, accent: pendingCount > 0 },
                {
                  label: "Completed",
                  value: completedCount,
                  accent: false,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center py-5 px-3"
                >
                  <span
                    className={cn(
                      "text-xl font-bold font-display",
                      stat.accent ? "text-emerald" : "text-foreground",
                    )}
                  >
                    {isLoadingBookings ? (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald" />
                    ) : (
                      <AnimatedCounter value={stat.value as number} />
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </GlassCard>
          </motion.div>

          {/* Bookings list */}
          <AnimatePresence mode="wait">
            {isLoadingBookings ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[1, 2, 3].map((i) => (
                  <GlassCard key={i} className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-white/[0.06] rounded w-1/4" />
                      <motion.div
                        className="h-3 bg-white/[0.04] rounded w-1/2"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <div className="h-3 bg-white/[0.04] rounded w-1/3" />
                    </div>
                  </GlassCard>
                ))}
              </motion.div>
            ) : validBookings.length > 0 ? (
              <motion.div
                key="list"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {validBookings.map((booking) => (
                  <motion.div key={booking._id} variants={staggerItem}>
                    <GlassCard hover className="overflow-hidden">
                      <div className="p-5 sm:p-6">
                        <motion.div
                          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <h3 className="font-display font-semibold text-lg text-foreground">
                                {booking.groundId
                                  ? booking.groundId.name
                                  : "Unknown Ground"}
                              </h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-medium border capitalize",
                                  statusConfig[booking.status],
                                )}
                              >
                                {booking.status.replace("_", " ")}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20">
                                  <Calendar className="h-3.5 w-3.5 text-emerald" />
                                </div>
                                <span className="truncate">
                                  {formatDate(booking.bookingDate)}
                                </span>
                              </div>
                              <motion.div
                                className="flex items-center gap-2"
                                whileHover={{ x: 2 }}
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20">
                                  <Clock className="h-3.5 w-3.5 text-emerald" />
                                </div>
                                <span className="truncate">
                                  {formatTime(booking.timeSlot)}
                                </span>
                              </motion.div>
                              <div className="flex items-center gap-2">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20"
                                >
                                  <Users className="h-3.5 w-3.5 text-emerald" />
                                </motion.div>
                                <span>
                                  {booking.playerDetails.playerCount} players
                                </span>
                              </div>
                              {booking.groundId?.location?.address && (
                                <div className="flex items-center gap-2 sm:col-span-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/10">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                  <span className="truncate text-xs">
                                    {booking.groundId.location.address}
                                  </span>
                                </div>
                              )}
                            </div>

                            {booking.playerDetails.teamName && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                Team:{" "}
                                <span className="text-foreground">
                                  {booking.playerDetails.teamName}
                                </span>
                              </p>
                            )}

                            <p className="mt-2 text-xs text-muted-foreground/70">
                              Booked on {formatDate(booking.createdAt)}
                            </p>

                            {booking.status === "pending" && (
                              <BookingCountdown
                                createdAt={booking.createdAt}
                                onExpired={() =>
                                  handleBookingExpired(booking._id)
                                }
                              />
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right shrink-0">
                            <div>
                              <div className="flex items-center gap-1 text-2xl font-bold font-display text-emerald">
                                <IndianRupee className="h-5 w-5" />
                                {booking.pricing.totalAmount.toLocaleString("en-IN")}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Total Amount
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/[0.06]"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-emerald/20 text-emerald hover:bg-emerald/10 hover:text-emerald"
                            onClick={() => navigate(`/booking/${booking._id}`)}
                          >
                            View Details
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                          {booking.status === "confirmed" && (
                            <Button variant="outline" size="sm">
                              Reschedule
                            </Button>
                          )}
                          {booking.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-400"
                            >
                              Cancel
                            </Button>
                          )}
                        </motion.div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard className="p-12 text-center" glow>
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/10 border border-emerald/20">
                    <Sparkles className="h-7 w-7 text-emerald" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    No bookings yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Start exploring cricket grounds and make your first booking!
                  </p>
                  <Button variant="glow" onClick={() => navigate("/")}>
                    Explore Grounds
                  </Button>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </PageShell>
  );
};

export default Bookings;
