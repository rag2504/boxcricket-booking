import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Navigation, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import {
  indianCities,
  getPopularCities,
  searchCities,
  type City,
} from "@/lib/cities";

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onCitySelect: (city: City) => void;
  selectedCity?: City;
}

const ease = [0.22, 1, 0.36, 1] as const;

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

interface CityButtonProps {
  city: City;
  isSelected: boolean;
  onSelect: (city: City) => void;
  compact?: boolean;
}

const CityButton = ({ city, isSelected, onSelect, compact }: CityButtonProps) => (
  <motion.button
    variants={itemVariants}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(city)}
    className={cn(
      "w-full text-left rounded-xl border transition-all duration-200",
      compact ? "p-2.5" : "p-3.5",
      isSelected
        ? "border-emerald/40 bg-emerald/10 shadow-glow-sm"
        : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15]",
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className={cn("font-medium text-foreground", compact ? "text-sm" : "text-base")}>
          {city.name}
        </div>
        {!compact && (
          <div className="text-xs text-muted-foreground mt-0.5">{city.state}</div>
        )}
      </div>
      {city.popular && !compact && (
        <Badge className="bg-emerald/10 text-emerald border-emerald/20 text-[10px] shrink-0">
          Popular
        </Badge>
      )}
    </div>
  </motion.button>
);

const LocationSelector = ({
  isOpen,
  onClose,
  onCitySelect,
  selectedCity,
}: LocationSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCities, setFilteredCities] =
    useState<City[]>(getPopularCities());
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      setFilteredCities(searchCities(searchQuery));
    } else {
      setFilteredCities(getPopularCities());
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        },
      );

      const { latitude, longitude } = position.coords;

      let closestCity = indianCities[0];
      let minDistance = Number.MAX_SAFE_INTEGER;

      indianCities.forEach((city) => {
        const distance = Math.sqrt(
          Math.pow(city.latitude - latitude, 2) +
            Math.pow(city.longitude - longitude, 2),
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestCity = city;
        }
      });

      onCitySelect(closestCity);
      onClose();
    } catch (error) {
      console.error("Error detecting location:", error);
      const delhi = indianCities.find((city) => city.id === "delhi");
      if (delhi) {
        onCitySelect(delhi);
        onClose();
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleCitySelect = (city: City) => {
    onCitySelect(city);
    onClose();
  };

  const popularCities = getPopularCities();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-md p-0 overflow-hidden border-white/[0.08] bg-[#0a0a0a]/95 shadow-glass-lg backdrop-blur-2xl",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-emerald/10 before:via-transparent before:to-emerald/5",
        )}
      >
        <DialogDescription className="sr-only">
          Select your city to find nearby cricket grounds.
        </DialogDescription>

        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald/10 blur-3xl" />
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="relative z-10 p-6"
        >
          <DialogHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/15 border border-emerald/25">
                <MapPin className="w-5 h-5 text-emerald" />
              </div>
              <div>
                <DialogTitle className="font-display text-xl font-bold">
                  Select Your <span className="gradient-text">City</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Find grounds near you
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={detectCurrentLocation}
              disabled={isDetectingLocation}
              variant="outline"
              className="w-full h-12 rounded-xl border-emerald/20 bg-emerald/5 hover:bg-emerald/10 hover:border-emerald/30 text-emerald"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span>
                {isDetectingLocation ? "Detecting..." : "Auto-detect Location"}
              </span>
            </Button>

            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-emerald" />
              <Input
                type="text"
                placeholder="Search for your city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-white/[0.08] bg-white/[0.03] backdrop-blur-md"
              />
            </div>

            <AnimatePresence mode="wait">
              {!searchQuery ? (
                <motion.div
                  key="popular"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Popular Cities
                    </h3>
                  </div>
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-2"
                  >
                    {popularCities.slice(0, 8).map((city) => (
                      <CityButton
                        key={city.id}
                        city={city}
                        isSelected={selectedCity?.id === city.id}
                        onSelect={handleCitySelect}
                      />
                    ))}
                  </motion.div>

                  {popularCities.length > 8 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        All Cities
                      </h3>
                      <GlassCard className="p-2 max-h-36 overflow-y-auto scrollbar-hide">
                        <motion.div
                          variants={listVariants}
                          initial="hidden"
                          animate="visible"
                          className="grid grid-cols-2 gap-1"
                        >
                          {indianCities
                            .filter((city) => !city.popular)
                            .slice(0, 20)
                            .map((city) => (
                              <CityButton
                                key={city.id}
                                city={city}
                                isSelected={selectedCity?.id === city.id}
                                onSelect={handleCitySelect}
                                compact
                              />
                            ))}
                        </motion.div>
                      </GlassCard>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease }}
                >
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    Search Results
                  </h3>
                  {filteredCities.length > 0 ? (
                    <GlassCard className="p-2 max-h-64 overflow-y-auto scrollbar-hide">
                      <motion.div
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-1"
                      >
                        {filteredCities.map((city) => (
                          <CityButton
                            key={city.id}
                            city={city}
                            isSelected={selectedCity?.id === city.id}
                            onSelect={handleCitySelect}
                          />
                        ))}
                      </motion.div>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No cities found matching &ldquo;{searchQuery}&rdquo;
                      </p>
                    </GlassCard>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSelector;
