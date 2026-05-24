import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Users,
  Car,
  Zap,
  Calendar,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Quote,
  Shield,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import NewBookingModal from "@/components/NewBookingModal";
import { GlassCard } from "@/components/ui/glass-card";
import { PageLoader } from "@/components/ui/page-loader";
import { groundsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isMongoObjectId } from "@/lib/utils";
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  defaultTransition,
} from "@/lib/motion";

const GroundDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [ground, setGround] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [slotRetryCount, setSlotRetryCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("boxcric_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (id && !isMongoObjectId(id)) {
      toast.error("This ground cannot be booked online.");
      navigate("/");
      return;
    }
    if (id) {
      fetchGroundDetails();
      fetchReviews();
    }
  }, [id]);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("boxcric_notifications");
        if (saved) {
          setNotifications(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error syncing notifications:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const fetchGroundDetails = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching ground details for ID:", id);

      if (!id || id === "undefined") {
        throw new Error("Invalid ground ID");
      }

      const response = await groundsApi.getGround(id);
      console.log("Ground details response:", response);

      //@ts-ignore
      if (response.success) {
        //@ts-ignore
        setGround(response.ground);
      } else {
        //@ts-ignore
        throw new Error(response.message || "Failed to fetch ground details");
      }
    } catch (error: any) {
      console.error("Failed to fetch ground details:", error);
      toast.error("Failed to load ground details");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await groundsApi.getReviews(id!, { limit: 5 });
      console.log("Reviews response:", response);

      //@ts-ignore
      if (response.success) {
        //@ts-ignore
        setReviews(response.reviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleBookingCreated = (booking: any) => {
    toast.success("Booking created successfully!");

    const newNotification = {
      id: booking._id || booking.id || Date.now().toString(),
      status: booking.status || "pending",
      ground: booking.groundId?.name || ground?.name || "Unknown Ground",
      date: booking.bookingDate,
      time: booking.timeSlot
        ? `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}`
        : "Time not specified",
      reason: "",
      createdAt: new Date().toISOString(),
      isLocal: true,
    };

    const existingNotifications = JSON.parse(
      localStorage.getItem("boxcric_notifications") || "[]",
    );
    const updatedNotifications = [newNotification, ...existingNotifications];
    localStorage.setItem(
      "boxcric_notifications",
      JSON.stringify(updatedNotifications),
    );

    navigate(`/booking/${booking._id}`);
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem("boxcric_notifications");
  };

  useEffect(() => {
    if (ground && isAuthenticated) {
      checkIfFavorite();
    }
  }, [ground, isAuthenticated]);

  const checkIfFavorite = () => {
    try {
      const favorites = JSON.parse(
        localStorage.getItem("boxcric_favorites") || "[]",
      );
      const isInFavorites = favorites.some((fav: any) => fav._id === ground._id);
      setIsFavorite(isInFavorites);
    } catch (error) {
      console.error("Error checking favorites:", error);
    }
  };

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add favorites");
      return;
    }

    try {
      const favorites = JSON.parse(
        localStorage.getItem("boxcric_favorites") || "[]",
      );

      if (isFavorite) {
        const updatedFavorites = favorites.filter(
          (fav: any) => fav._id !== ground._id,
        );
        localStorage.setItem(
          "boxcric_favorites",
          JSON.stringify(updatedFavorites),
        );
        setIsFavorite(false);
        toast.success("Removed from favorites");

        window.dispatchEvent(new CustomEvent("favoritesChanged"));
      } else {
        const groundToSave = {
          _id: safeGround._id,
          name: safeGround.name,
          location: safeGround.location,
          price: {
            perHour:
              Array.isArray(safeGround.price?.ranges) &&
              safeGround.price.ranges.length > 0
                ? Math.round(
                    safeGround.price.ranges.reduce(
                      (sum: number, range: any) => sum + range.perHour,
                      0,
                    ) / safeGround.price.ranges.length,
                  )
                : safeGround.price?.perHour || 0,
          },
          rating: safeGround.rating,
          features: safeGround.features,
          images: safeGround.images,
          availability: {
            isAvailable: true,
            nextSlot: "Available now",
          },
        };

        const updatedFavorites = [...favorites, groundToSave];
        localStorage.setItem(
          "boxcric_favorites",
          JSON.stringify(updatedFavorites),
        );
        setIsFavorite(true);
        toast.success("Added to favorites");

        window.dispatchEvent(new CustomEvent("favoritesChanged"));
      }
    } catch (error) {
      console.error("Error managing favorites:", error);
      toast.error("Failed to update favorites");
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to book a ground");
      return;
    }
    setSelectedTimeSlot(timeSlot);
    setIsBookingModalOpen(true);
  };

  const handleImageNavigation = (direction: "prev" | "next") => {
    if (!ground?.images?.length) return;

    if (direction === "next") {
      setCurrentImageIndex((prev) =>
        prev === ground.images.length - 1 ? 0 : prev + 1,
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === 0 ? ground.images.length - 1 : prev - 1,
      );
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      Floodlights: <Zap className="w-4 h-4 text-emerald" />,
      Parking: <Car className="w-4 h-4 text-emerald" />,
      Washroom: <span>🚿</span>,
      "Changing Room": <span>👕</span>,
      "AC Changing Room": <span>❄️👕</span>,
      "Drinking Water": <span>💧</span>,
      "First Aid": <span>🏥</span>,
      "Equipment Rental": <span>🏏</span>,
      Cafeteria: <span>☕</span>,
      Scoreboard: <span>📊</span>,
      Referee: <span>👨‍⚖️</span>,
    };
    return iconMap[amenity] || <Sparkles className="w-4 h-4 text-emerald/70" />;
  };

  const navbarProps = {
    notifications,
    showNotifDropdown,
    setShowNotifDropdown,
    clearNotifications,
  };

  if (isLoading) {
    return (
      <PageShell>
        <Navbar {...navbarProps} />
        <PageLoader message="Loading ground" submessage="Fetching details..." />
      </PageShell>
    );
  }

  if (!ground) {
    return (
      <PageShell>
        <Navbar {...navbarProps} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container-premium px-4 py-24 text-center"
        >
          <h1 className="heading-display text-2xl mb-4">Ground Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This ground may have been removed or is unavailable.
          </p>
          <Button variant="glow" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </PageShell>
    );
  }

  const safeGround = {
    _id: ground._id || id || "unknown",
    name: ground.name || "Unknown Ground",
    description: ground.description || "No description available",
    location: ground.location || { address: "Address not available" },
    price: ground.price || { perHour: 0, discount: 0 },
    images: ground.images || [],
    amenities: ground.amenities || [],
    features: ground.features || {
      pitchType: "Unknown",
      capacity: 0,
      lighting: false,
      parking: false,
    },
    rating: ground.rating || { average: 0, count: 0 },
    owner: ground.owner || {
      name: "Unknown",
      contact: "N/A",
      email: "N/A",
      verified: false,
    },
    totalBookings: ground.totalBookings || 0,
    isVerified: ground.isVerified || false,
    policies: ground.policies || { cancellation: "Standard policy", rules: [] },
  };

  const currentImage =
    safeGround.images[currentImageIndex]?.url ||
    safeGround.images[currentImageIndex] ||
    "/placeholder.svg";

  const minPrice =
    Array.isArray(safeGround.price?.ranges) && safeGround.price.ranges.length > 0
      ? Math.min(...safeGround.price.ranges.map((r: any) => r.perHour))
      : null;

  return (
    <PageShell>
      <Navbar {...navbarProps} />

      {/* Top bar */}
      <div className="container-premium px-4 sm:px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={defaultTransition}
          className="flex items-center justify-between gap-4"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Search</span>
          </Button>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...defaultTransition, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <Button variant="glass" size="sm" onClick={handleToggleFavorite}>
              <Heart
                className={cn(
                  "w-4 h-4",
                  isFavorite && "fill-red-500 text-red-500",
                )}
              />
              <span className="hidden sm:inline">
                {isFavorite ? "Saved" : "Save"}
              </span>
            </Button>
            <Button variant="glass" size="sm" onClick={async () => {
              const shareUrl = window.location.href;
              const shareData = {
                title: `${safeGround.name} - CricBox`,
                text: `Check out ${safeGround.name} on CricBox! 🏏\n📍 ${safeGround.location.address}\n⭐ ${safeGround.rating.average} rating`,
                url: shareUrl,
              };
              try {
                if (navigator.share) {
                  await navigator.share(shareData);
                } else {
                  await navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied to clipboard!");
                }
              } catch (err: any) {
                if (err.name !== "AbortError") {
                  await navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied to clipboard!");
                }
              }
            }}>
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Image gallery */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="container-premium px-4 sm:px-6 mt-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl aspect-[16/9] sm:aspect-[21/9] group"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={currentImage}
              alt={safeGround.name}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent pointer-events-none" />

          {safeGround.images.length > 1 && (
            <>
              <button
                onClick={() => handleImageNavigation("prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full glass border-white/10 text-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:scale-105"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleImageNavigation("next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full glass border-white/10 text-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:scale-105"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 rounded-full glass border-white/10">
                {safeGround.images.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === currentImageIndex
                        ? "w-6 bg-emerald"
                        : "w-2 bg-white/40 hover:bg-white/60",
                    )}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <GlassCard className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-lg p-4 sm:p-5 !rounded-xl border-white/10 bg-black/40 backdrop-blur-2xl pointer-events-none">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {safeGround.isVerified && (
                <Badge className="bg-emerald/20 text-emerald border-emerald/30 pointer-events-auto">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold text-foreground">
                  {safeGround.rating.average}
                </span>
                <span className="text-muted-foreground text-sm">
                  ({safeGround.rating.count} reviews)
                </span>
              </div>
            </div>
            <h1 className="heading-display text-xl sm:text-2xl line-clamp-2">
              {safeGround.name}
            </h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground"
            >
              <MapPin className="w-4 h-4 shrink-0 text-emerald" />
              <span className="line-clamp-1">{safeGround.location.address}</span>
              {ground.distance && (
                <span className="text-emerald font-medium shrink-0">
                  • {ground.distance.toFixed(1)} km
                </span>
              )}
            </motion.div>
          </GlassCard>
        </motion.div>

        {safeGround.images.length > 1 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1"
          >
            {safeGround.images.map((img: any, index: number) => {
              const thumb = img?.url || img;
              return (
                <motion.button
                  key={index}
                  variants={staggerItem}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "relative shrink-0 h-16 w-24 sm:h-20 sm:w-28 rounded-xl overflow-hidden border-2 transition-all duration-300",
                    index === currentImageIndex
                      ? "border-emerald shadow-glow-sm"
                      : "border-white/10 opacity-60 hover:opacity-100",
                  )}
                >
                  <img
                    src={thumb || "/placeholder.svg"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </motion.section>

      {/* Main layout */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ ...defaultTransition, delay: 0.15 }}
        className="container-premium px-4 sm:px-6 py-8 lg:py-10"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div variants={staggerItem}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <motion.div variants={staggerItem} className="flex-1 min-w-0">
                  {minPrice !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold gradient-text">
                        ₹{minPrice}
                      </span>
                      <span className="text-muted-foreground">/hr starting</span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No price slots set</p>
                  )}
                  {safeGround.price.discount > 0 && (
                    <p className="text-emerald text-sm mt-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {safeGround.price.discount}% discount on advance bookings
                    </p>
                  )}
                </motion.div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {safeGround.description}
              </p>
            </motion.div>

            {Array.isArray(safeGround.price?.ranges) &&
              safeGround.price.ranges.length > 0 && (
                <motion.div variants={staggerItem}>
                  <GlassCard className="p-6">
                    <h2 className="heading-display text-lg mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald" />
                      Pricing Options
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {safeGround.price.ranges.map((range: any, index: number) => (
                        <motion.div
                          key={index}
                          whileHover={{ y: -2 }}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 transition-colors hover:border-emerald/20"
                        >
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.08 }}
                            className="flex items-center justify-between mb-2"
                          >
                            <span className="font-medium text-foreground">
                              {range.start} – {range.end}
                            </span>
                            <Badge
                              variant="outline"
                              className="border-emerald/30 text-emerald text-xs"
                            >
                              {index === 0 ? "Peak" : "Off-Peak"}
                            </Badge>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.08 }}
                            className="text-2xl font-display font-bold text-emerald"
                          >
                            ₹{range.perHour}/hr
                          </motion.div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {range.start === "06:00" && range.end === "18:00"
                              ? "Day time slots"
                              : "Evening / night slots"}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                    {safeGround.price.discount > 0 && (
                      <div className="mt-4 rounded-xl bg-emerald/10 border border-emerald/20 p-3 flex items-center gap-2 text-sm text-emerald">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        {safeGround.price.discount}% discount on advance bookings
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              )}

            <motion.div variants={staggerItem}>
              <Tabs defaultValue="amenities" className="space-y-4">
                <TabsList className="glass w-full sm:w-auto h-auto flex-wrap gap-1 p-1.5 rounded-xl">
                  <TabsTrigger
                    value="amenities"
                    className="rounded-lg data-[state=active]:bg-emerald/20 data-[state=active]:text-emerald"
                  >
                    Amenities
                  </TabsTrigger>
                  <TabsTrigger
                    value="features"
                    className="rounded-lg data-[state=active]:bg-emerald/20 data-[state=active]:text-emerald"
                  >
                    Features
                  </TabsTrigger>
                  <TabsTrigger
                    value="policies"
                    className="rounded-lg data-[state=active]:bg-emerald/20 data-[state=active]:text-emerald"
                  >
                    Policies
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="rounded-lg data-[state=active]:bg-emerald/20 data-[state=active]:text-emerald"
                  >
                    Reviews
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="amenities">
                  <GlassCard className="p-6">
                    <h3 className="heading-display text-lg mb-4">
                      Available Amenities
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {safeGround.amenities.map((amenity: string, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.04 }}
                          className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-sm"
                        >
                          {getAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="features">
                  <GlassCard className="p-6">
                    <h3 className="heading-display text-lg mb-4">Ground Features</h3>
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {[
                        {
                          label: "Pitch Type",
                          value: safeGround.features.pitchType,
                        },
                        {
                          label: "Capacity",
                          value: `${safeGround.features.capacity} players`,
                          icon: <Users className="w-4 h-4 text-emerald" />,
                        },
                        {
                          label: "Night Lighting",
                          value: safeGround.features.lighting
                            ? "Available"
                            : "Not available",
                          icon: <Zap className="w-4 h-4 text-emerald" />,
                        },
                        {
                          label: "Parking",
                          value: safeGround.features.parking
                            ? "Available"
                            : "Not available",
                          icon: <Car className="w-4 h-4 text-emerald" />,
                        },
                      ].map((item, i) => (
                        <motion.div
                          key={item.label}
                          variants={staggerItem}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                        >
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            {item.label}
                          </span>
                          <div className="flex items-center gap-2 mt-1 font-medium">
                            {item.icon}
                            {item.value}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="policies">
                  <GlassCard className="p-6 space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald" />
                        Cancellation Policy
                      </h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {safeGround.policies.cancellation}
                      </p>
                    </div>
                    <Separator className="bg-white/10" />
                    <motion.div>
                      <h4 className="font-semibold mb-3">Ground Rules</h4>
                      <ul className="space-y-2">
                        {safeGround.policies.rules.map(
                          (rule: string, index: number) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -8 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                              <span>{rule}</span>
                            </motion.li>
                          ),
                        )}
                      </ul>
                    </motion.div>
                  </GlassCard>
                </TabsContent>

                <TabsContent value="reviews">
                  <ReviewsSection reviews={reviews} />
                </TabsContent>
              </Tabs>
            </motion.div>

          </div>

          {/* Sticky sidebar */}
          <motion.aside variants={staggerItem} className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <GlassCard glow className="p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <h2 className="heading-display text-lg mb-4 flex items-center gap-2 relative">
                  <Calendar className="w-5 h-5 text-emerald" />
                  Book This Ground
                </h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 mb-6 relative"
                >
                  {Array.isArray(safeGround.price?.ranges) &&
                  safeGround.price.ranges.length > 0 ? (
                    safeGround.price.ranges.map((range: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm rounded-lg bg-white/[0.03] px-3 py-2 border border-white/[0.06]"
                      >
                        <span className="text-muted-foreground">
                          {range.start} – {range.end}
                        </span>
                        <span className="font-semibold text-emerald">
                          ₹{range.perHour}/hr
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-2">
                      No price slots set
                    </p>
                  )}
                </motion.div>

                <Button
                  variant="glow"
                  size="lg"
                  onClick={() => setIsBookingModalOpen(true)}
                  className="w-full relative"
                  disabled={!isAuthenticated}
                >
                  {isAuthenticated ? "Book Now" : "Login to Book"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Free cancellation up to 4 hours before booking
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="heading-display text-base mb-4">
                  Contact Ground Owner
                </h3>
                <div className="space-y-4 text-sm">
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10">
                      <Users className="w-4 h-4 text-emerald" />
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Owner</span>
                      <p className="font-medium">{safeGround.owner.name}</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <motion.div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10">
                      <Phone className="w-4 h-4 text-emerald" />
                    </motion.div>
                    <div>
                      <span className="text-muted-foreground text-xs">Phone</span>
                      <p className="font-medium">{safeGround.owner.contact}</p>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10">
                      <Mail className="w-4 h-4 text-emerald" />
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Email</span>
                      <p className="font-medium break-all">{safeGround.owner.email}</p>
                    </div>
                  </motion.div>
                  {safeGround.owner.verified && (
                    <Badge className="bg-emerald/15 text-emerald border-emerald/25">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified Owner
                    </Badge>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="heading-display text-base mb-4">Quick Stats</h3>
                <div className="space-y-3 text-sm">
                  {[
                    {
                      label: "Total Bookings",
                      value: safeGround.totalBookings,
                    },
                    {
                      label: "Average Rating",
                      value: `${safeGround.rating.average}/5`,
                    },
                    { label: "Response Rate", value: "98%", highlight: true },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      className="flex justify-between items-center py-2 border-b border-white/[0.06] last:border-0"
                    >
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span
                        className={cn(
                          "font-semibold",
                          stat.highlight && "text-emerald",
                        )}
                      >
                        {stat.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </motion.aside>
        </motion.div>

        {/* Desktop premium reviews block */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={defaultTransition}
          className="hidden lg:block mt-12"
        >
          <ReviewsSection reviews={reviews} title="Player Reviews" />
        </motion.section>
      </motion.div>

      <NewBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        ground={safeGround}
        onBookingCreated={handleBookingCreated}
      />
    </PageShell>
  );
};

function ReviewsSection({
  reviews,
  title = "Customer Reviews",
}: {
  reviews: any[];
  title?: string;
}) {
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between mb-6"
      >
        <motion.div>
          <h3 className="heading-display text-xl sm:text-2xl">{title}</h3>
          <p className="text-muted-foreground text-sm mt-1">
            {reviews.length > 0
              ? `${reviews.length} recent review${reviews.length !== 1 ? "s" : ""}`
              : "Be the first to share your experience"}
          </p>
        </motion.div>
        {avgRating && (
          <GlassCard className="px-4 py-2 flex items-center gap-2 !rounded-xl">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span className="font-display font-bold text-lg">{avgRating}</span>
          </GlassCard>
        )}
      </motion.div>

      {reviews.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {reviews.map((review, index) => (
            <motion.div key={index} variants={staggerItem}>
              <GlassCard hover className="p-5 sm:p-6 h-full relative overflow-hidden">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-emerald/15" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald/30 to-emerald/10 font-semibold text-emerald border border-emerald/20">
                    {(review.userId?.name || "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {review.userId?.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-white/15",
                      )}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                    "{review.comment}"
                  </p>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <GlassCard className="p-12 text-center">
          <Quote className="mx-auto h-10 w-10 text-emerald/30 mb-4" />
          <p className="text-muted-foreground">
            No reviews yet. Be the first to review!
          </p>
        </GlassCard>
      )}
    </div>
  );
}

export default GroundDetails;
