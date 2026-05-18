import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { motion } from "framer-motion";
import {
  Star,
  MapPin,
  Users,
  Car,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface GroundCardProps {
  ground: any;
  onBook?: (groundId: string) => void;
  onViewDetails?: (groundId: string) => void;
}

const GroundCard = ({ ground, onBook, onViewDetails }: GroundCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageNavigation = (direction: "prev" | "next") => {
    if (!ground.images?.length) return;
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

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleImageNavigation("next"),
    onSwipedRight: () => handleImageNavigation("prev"),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  const averagePrice =
    Array.isArray(ground.price?.ranges) && ground.price.ranges.length > 0
      ? Math.round(
          ground.price.ranges.reduce(
            (sum: number, range: any) => sum + range.perHour,
            0,
          ) / ground.price.ranges.length,
        )
      : ground.price?.perHour || 0;

  const availableSlots = ground.availableSlots ?? 1;

  return (
    <GlassCard hover className="group overflow-hidden">
      <div
        className="relative h-52 sm:h-56 overflow-hidden cursor-pointer"
        {...swipeHandlers}
        onClick={() => onViewDetails?.(ground._id)}
      >
        <motion.img
          key={currentImageIndex}
          initial={{ scale: 1.1, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={
            ground.images?.[currentImageIndex]?.url ||
            ground.images?.[currentImageIndex] ||
            "/placeholder.svg"
          }
          alt={ground.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {ground.images && ground.images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleImageNavigation("prev");
              }}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleImageNavigation("next");
              }}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 gap-1.5">
              {ground.images.map((_: unknown, index: number) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === currentImageIndex
                      ? "w-4 bg-emerald"
                      : "w-1.5 bg-white/40",
                  )}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute bottom-3 right-3 rounded-xl border border-white/10 bg-background/80 px-3 py-2 backdrop-blur-md shadow-glow-sm">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
          <p className="font-display text-lg font-bold text-emerald">₹{averagePrice}/hr</p>
        </div>

        {ground.rating?.average >= 4.5 && (
          <Badge className="absolute top-3 left-3 border-emerald/30 bg-emerald/20 text-emerald backdrop-blur-sm">
            Top Rated
          </Badge>
        )}
      </div>

      <div className="p-5">
        <h3
          className="font-display text-lg font-bold text-foreground transition-colors group-hover:text-emerald cursor-pointer line-clamp-1"
          onClick={() => onViewDetails?.(ground._id)}
        >
          {ground.name}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald" />
          <span className="truncate">{ground.location.address}</span>
          {ground.distance && (
            <span className="shrink-0 text-emerald font-medium">
              · {ground.distance.toFixed(1)} km
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{ground.rating.average}</span>
            <span className="text-sm text-muted-foreground">({ground.rating.count})</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {ground.features.capacity}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {ground.amenities.slice(0, 3).map((amenity: string, index: number) => (
            <Badge
              key={index}
              variant="secondary"
              className="border-white/5 bg-white/[0.04] text-xs text-muted-foreground"
            >
              {amenity}
            </Badge>
          ))}
          {ground.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs border-white/10">
              +{ground.amenities.length - 3}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {ground.features.lighting && (
            <Badge variant="outline" className="gap-1 border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs">
              <Zap className="h-3 w-3" /> Night
            </Badge>
          )}
          {ground.features.parking && (
            <Badge variant="outline" className="gap-1 border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs">
              <Car className="h-3 w-3" /> Parking
            </Badge>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(ground._id)}
          >
            <Eye className="h-4 w-4" />
            Details
          </Button>
          <Button
            variant="glow"
            size="sm"
            className="flex-1"
            onClick={() => onBook?.(ground._id)}
            disabled={availableSlots === 0}
          >
            {availableSlots === 0 ? "Full" : "Book Now"}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
};

export default GroundCard;
