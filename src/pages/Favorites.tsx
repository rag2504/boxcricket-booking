import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Star,
  MapPin,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface FavoriteGround {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  price: {
    perHour: number;
  };
  rating: {
    average: number;
    count: number;
  };
  features: {
    capacity: number;
    pitchType: string;
    lighting: boolean;
    parking: boolean;
  };
  images: Array<{
    url: string;
    alt?: string;
  }>;
  availability?: {
    isAvailable: boolean;
    nextSlot?: string;
  };
}

function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <GlassCard className="p-12 sm:p-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground mb-3">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      {children}
    </GlassCard>
  );
}

function FavoriteSkeleton() {
  return (
    <GlassCard className="overflow-hidden">
      <div className="animate-pulse">
        <div className="h-48 bg-white/[0.04]" />
        <div className="p-5 space-y-3">
          <div className="h-4 bg-white/[0.06] rounded-lg w-3/4" />
          <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
          <div className="h-3 bg-white/[0.04] rounded-lg w-2/3" />
          <div className="flex gap-2 pt-2">
            <div className="h-9 bg-white/[0.04] rounded-xl flex-1" />
            <div className="h-9 bg-white/[0.06] rounded-xl flex-1" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function FavoriteCard({
  ground,
  onRemove,
  onViewDetails,
  onBook,
}: {
  ground: FavoriteGround;
  onRemove: (id: string) => void;
  onViewDetails: (id: string) => void;
  onBook: (id: string) => void;
}) {
  return (
    <GlassCard hover className="group overflow-hidden">
      <div className="relative">
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.5 }}
          src={ground.images?.[0]?.url || "/placeholder.svg"}
          alt={ground.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute top-3 right-3">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemove(ground._id)}
            className="h-9 w-9 p-0 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm border border-red-400/20"
          >
            <Heart className="w-4 h-4 fill-current" />
          </Button>
        </div>

        {ground.availability && (
          <div className="absolute top-3 left-3">
            <Badge
              className={cn(
                "backdrop-blur-sm border",
                ground.availability.isAvailable
                  ? "bg-emerald/20 text-emerald border-emerald/30"
                  : "bg-red-500/20 text-red-400 border-red-500/30",
              )}
            >
              {ground.availability.isAvailable ? "Available" : "Busy"}
            </Badge>
          </div>
        )}

        <div className="absolute bottom-3 right-3 rounded-xl border border-white/10 bg-background/80 px-3 py-2 backdrop-blur-md shadow-glow-sm">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
          <p className="font-display text-lg font-bold text-emerald">
            ₹{ground.price.perHour}/hr
          </p>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground mb-1 group-hover:text-emerald transition-colors line-clamp-1">
            {ground.name}
          </h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0 text-emerald" />
            <span className="truncate">{ground.location.address}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{ground.rating.average}</span>
            <span className="text-sm text-muted-foreground">({ground.rating.count})</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{ground.features.capacity} players</span>
          </div>
          <div className="flex items-center gap-2">
            {ground.features.lighting && (
              <Badge variant="outline" className="text-xs border-white/10 bg-white/[0.03]">
                Lights
              </Badge>
            )}
            {ground.features.parking && (
              <Badge variant="outline" className="text-xs border-white/10 bg-white/[0.03]">
                Parking
              </Badge>
            )}
          </div>
        </div>

        {ground.availability?.nextSlot && (
          <div className="flex items-center text-sm text-emerald bg-emerald/10 border border-emerald/20 p-2.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
            <span>Next available: {ground.availability.nextSlot}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(ground._id)}
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="glow"
            size="sm"
            onClick={() => onBook(ground._id)}
            className="flex-1"
          >
            Book Now
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

const Favorites = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteGround[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (isAuthenticated) {
        fetchFavorites();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("favoritesChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("favoritesChanged", handleStorageChange);
    };
  }, [isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);

      const savedFavorites = localStorage.getItem("boxcric_favorites");
      if (savedFavorites) {
        const favoritesList = JSON.parse(savedFavorites);
        setFavorites(favoritesList);
      } else {
        setFavorites([]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      toast.error("Failed to load your favorites");
      setFavorites([]);
      setIsLoading(false);
    }
  };

  const removeFavorite = async (groundId: string) => {
    try {
      const savedFavorites = localStorage.getItem("boxcric_favorites");
      if (savedFavorites) {
        const favoritesList = JSON.parse(savedFavorites);
        const updatedFavorites = favoritesList.filter(
          (fav: FavoriteGround) => fav._id !== groundId,
        );
        localStorage.setItem("boxcric_favorites", JSON.stringify(updatedFavorites));
      }

      setFavorites((prev) => prev.filter((fav) => fav._id !== groundId));
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      toast.error("Failed to remove from favorites");
    }
  };

  const handleBookGround = (groundId: string) => {
    navigate(`/ground/${groundId}`);
  };

  const handleViewDetails = (groundId: string) => {
    navigate(`/ground/${groundId}`);
  };

  if (!isAuthenticated) {
    return (
      <PageShell>
        <Navbar />
        <section className="section-padding pt-4 pb-16">
          <div className="container-premium max-w-2xl">
            <EmptyState
              icon={Heart}
              title="Please login to view your favorites"
              description="You need to be logged in to access your favorite grounds."
            >
              <Button variant="glow" onClick={() => navigate("/")}>
                Go to Home
              </Button>
            </EmptyState>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Navbar />

      <section className="section-padding pt-4 pb-16">
        <div className="container-premium">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Profile</span>
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-glow-sm">
                  <Heart className="h-5 w-5 text-white fill-white" />
                </div>
                <div>
                  <h1 className="heading-display text-2xl sm:text-3xl">Favorite Grounds</h1>
                  {!isLoading && favorites.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {favorites.length} saved {favorites.length === 1 ? "ground" : "grounds"}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Button variant="glow" onClick={() => navigate("/")} className="gap-2 shrink-0">
              <Sparkles className="w-4 h-4" />
              Discover More Grounds
            </Button>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <FavoriteSkeleton key={i} />
              ))}
            </div>
          ) : favorites.length > 0 ? (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {favorites.map((ground) => (
                <motion.div key={ground._id} variants={staggerItem}>
                  <FavoriteCard
                    ground={ground}
                    onRemove={removeFavorite}
                    onViewDetails={handleViewDetails}
                    onBook={handleBookGround}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={Heart}
              title="No favorites yet"
              description="Start exploring cricket grounds and add them to your favorites for quick access. Click the heart icon on any ground to save it here!"
            >
              <div className="space-y-3">
                <Button variant="glow" onClick={() => navigate("/")} className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Discover Grounds
                </Button>
                <p className="text-sm text-muted-foreground">
                  Or browse by{" "}
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => navigate("/")}
                  >
                    location
                  </Button>
                </p>
              </div>
            </EmptyState>
          )}
        </div>
      </section>
    </PageShell>
  );
};

export default Favorites;
