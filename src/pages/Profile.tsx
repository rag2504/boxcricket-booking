import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  ChevronRight,
  Loader2,
  Sparkles,
  Activity,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useAuth } from "@/contexts/AuthContext";
import { bookingsApi } from "@/lib/api";
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]"
            >
              <User className="h-7 w-7 text-muted-foreground/50" />
            </motion.div>
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

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
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
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  if (!isAuthenticated) {
    return (
      <AuthGate
        title="Please login to view your profile"
        description="You need to be logged in to access your profile and bookings."
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
          className="container-premium max-w-6xl"
        >
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex items-center gap-3 mb-2"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-emerald-light shadow-glow-sm"
              >
                <User className="h-5 w-5 text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <h1 className="heading-display text-2xl sm:text-3xl">My Profile</h1>
                <p className="text-sm text-muted-foreground">
                  Your dashboard, stats & booking activity
                </p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Analytics strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <GlassCard className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.06] p-0 overflow-hidden">
              {[
                {
                  label: "Total",
                  value: bookings.length,
                  icon: BookOpen,
                  accent: false,
                },
                {
                  label: "Active",
                  value: activeCount,
                  icon: Activity,
                  accent: activeCount > 0,
                },
                {
                  label: "Completed",
                  value: completedCount,
                  icon: Sparkles,
                  accent: false,
                },
                {
                  label: "Status",
                  value: isLoadingBookings ? null : "Live",
                  icon: Clock,
                  accent: true,
                  loading: isLoadingBookings,
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  className="flex flex-col items-center py-5 px-3"
                >
                  <stat.icon
                    className={cn(
                      "h-3.5 w-3.5 mb-2",
                      stat.accent ? "text-emerald" : "text-muted-foreground/50",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xl font-bold font-display",
                      stat.accent ? "text-emerald" : "text-foreground",
                    )}
                  >
                    {stat.loading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald" />
                    ) : typeof stat.value === "number" ? (
                      <AnimatedCounter value={stat.value} />
                    ) : (
                      stat.value
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </GlassCard>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Profile sidebar */}
            <motion.div variants={staggerItem} className="lg:col-span-1">
              <GlassCard className="overflow-hidden" glow>
                <motion.div
                  className="relative px-6 pt-8 pb-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div
                    className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald/10 to-transparent pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-light shadow-glow ring-4 ring-background"
                  >
                    <span className="text-3xl font-bold text-white select-none font-display">
                      {user?.name
                        ? user.name.trim().charAt(0).toUpperCase()
                        : user?.email
                          ? user.email.charAt(0).toUpperCase()
                          : "U"}
                    </span>
                  </motion.div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {user?.name || "User"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald" />
                    Cricket Enthusiast
                  </p>
                </motion.div>

                <div className="px-6 pb-6 space-y-3">
                  <div className="h-px bg-white/[0.06]" />
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20"
                    >
                      <Mail className="h-3.5 w-3.5 text-emerald" />
                    </motion.div>
                    <span className="text-muted-foreground truncate">{user?.email}</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald" />
                    </motion.div>
                    <span className="text-muted-foreground">{user?.phone}</span>
                  </motion.div>
                  {user?.createdAt && (
                    <motion.div
                      whileHover={{ x: 2 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20"
                      >
                        <Calendar className="h-3.5 w-3.5 text-emerald" />
                      </motion.div>
                      <span className="text-muted-foreground">
                        Member since {formatDate(user.createdAt)}
                      </span>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="glow"
                      className="w-full mt-2"
                      onClick={() => navigate("/")}
                    >
                      Book New Ground
                    </Button>
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Main content */}
            <motion.div variants={staggerItem} className="lg:col-span-2">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-1 bg-white/[0.04] border border-white/[0.08] p-1 rounded-xl h-auto">
                  <TabsTrigger
                    value="overview"
                    className="rounded-lg data-[state=active]:bg-emerald/10 data-[state=active]:text-emerald data-[state=active]:border data-[state=active]:border-emerald/20"
                  >
                    Overview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-0">
                  {/* Quick actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard
                      hover
                      glow
                      className="p-5 cursor-pointer group"
                      onClick={() => navigate("/profile/bookings")}
                    >
                      <div className="flex items-start gap-4">
                        <motion.div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald/10 border border-emerald/20 group-hover:shadow-glow-sm transition-shadow">
                          <BookOpen className="h-6 w-6 text-emerald" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display font-semibold text-foreground">
                              My Bookings
                            </h3>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald transition-colors" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            View and manage your cricket ground bookings
                          </p>
                          <motion.div
                            className="mt-3 flex items-center gap-4 text-xs font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <span className="text-emerald">
                              {bookings.length} Total
                            </span>
                            <span className="text-amber-400">{activeCount} Active</span>
                          </motion.div>
                        </div>
                      </div>
                    </GlassCard>

                    <GlassCard
                      hover
                      className="p-5 cursor-pointer group"
                      onClick={() => navigate("/")}
                    >
                      <motion.div
                        className="flex items-start gap-4"
                        whileHover={{ x: 2 }}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 border border-sky-400/20">
                          <Calendar className="h-6 w-6 text-sky-400" />
                        </div>
                        <motion.div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display font-semibold text-foreground">
                              Book New Ground
                            </h3>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald transition-colors" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Discover and book cricket grounds near you
                          </p>
                        </motion.div>
                      </motion.div>
                    </GlassCard>
                  </div>

                  {/* Recent bookings */}
                  <GlassCard className="overflow-hidden">
                    <div className="flex items-center justify-between gap-4 p-5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald" />
                        <h2 className="font-display font-semibold text-foreground">
                          Recent Bookings
                        </h2>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald/20 text-emerald hover:bg-emerald/10 hover:text-emerald shrink-0"
                        onClick={() => navigate("/profile/bookings")}
                      >
                        View All
                      </Button>
                    </div>

                    <div className="p-5">
                      {isLoadingBookings ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="animate-pulse rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
                              <motion.div
                                className="h-4 bg-white/[0.06] rounded w-1/3 mb-2"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                              <motion.div
                                className="h-3 bg-white/[0.04] rounded w-1/2"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : validBookings.length > 0 ? (
                        <motion.div
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                          className="space-y-3"
                        >
                          {validBookings.slice(0, 3).map((booking) => (
                            <motion.div key={booking._id} variants={staggerItem}>
                              <GlassCard
                                hover
                                className="flex items-center justify-between gap-3 p-4"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm text-foreground truncate">
                                      {booking.groundId
                                        ? booking.groundId.name
                                        : "Unknown Ground"}
                                    </h4>
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
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(booking.bookingDate)} ·{" "}
                                    {formatTime(booking.timeSlot)}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0 border-emerald/20 text-emerald hover:bg-emerald/10 hover:text-emerald"
                                  onClick={() => navigate(`/booking/${booking._id}`)}
                                >
                                  View
                                </Button>
                              </GlassCard>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <div className="text-center py-10">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 border border-emerald/20">
                            <Calendar className="h-6 w-6 text-emerald" />
                          </div>
                          <h3 className="font-display font-semibold text-foreground mb-2">
                            No bookings yet
                          </h3>
                          <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                            Start exploring cricket grounds and make your first booking!
                          </p>
                          <Button variant="glow" onClick={() => navigate("/")}>
                            Explore Grounds
                          </Button>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </PageShell>
  );
};

export default Profile;
