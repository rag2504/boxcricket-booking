import { useState } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  IndianRupee,
  MapPin,
  Star,
  Clock,
  Zap,
  Car,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  priceRange: [number, number];
  distance: number;
  amenities: string[];
  pitchType: string;
  lighting: boolean;
  parking: boolean;
  rating: number;
  availability: string;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const defaultFilters: FilterOptions = {
  priceRange: [500, 2000],
  distance: 25,
  amenities: [],
  pitchType: "all",
  lighting: false,
  parking: false,
  rating: 0,
  availability: "all",
};

const ease = [0.22, 1, 0.36, 1] as const;

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease },
  }),
};

interface FilterSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  index: number;
}

const FilterSection = ({ icon, title, children, index }: FilterSectionProps) => (
  <motion.div
    custom={index}
    variants={sectionVariants}
    initial="hidden"
    animate="visible"
    className="space-y-4"
  >
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20 text-emerald">
        {icon}
      </div>
      <Label className="text-sm font-semibold text-foreground">{title}</Label>
    </div>
    {children}
  </motion.div>
);

const FilterPanel = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearFilters,
}: FilterPanelProps) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const amenitiesOptions = [
    "Floodlights",
    "Parking",
    "Washroom",
    "Changing Room",
    "AC Changing Room",
    "Drinking Water",
    "First Aid",
    "Equipment Rental",
    "Cafeteria",
    "Scoreboard",
    "Referee",
  ];

  const pitchTypes = [
    { value: "all", label: "All Types" },
    { value: "Artificial Turf", label: "Artificial Turf" },
    { value: "Synthetic", label: "Synthetic" },
    { value: "Matting", label: "Matting" },
    { value: "Concrete", label: "Concrete" },
  ];

  const availabilityOptions = [
    { value: "all", label: "All Slots" },
    { value: "morning", label: "Morning (6 AM - 12 PM)" },
    { value: "afternoon", label: "Afternoon (12 PM - 6 PM)" },
    { value: "evening", label: "Evening (6 PM - 10 PM)" },
  ];

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const updatedAmenities = checked
      ? [...localFilters.amenities, amenity]
      : localFilters.amenities.filter((a) => a !== amenity);
    updateFilter("amenities", updatedAmenities);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const clearFilters = () => {
    setLocalFilters(defaultFilters);
    onClearFilters();
    onClose();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (
      localFilters.priceRange[0] !== 500 ||
      localFilters.priceRange[1] !== 2000
    )
      count++;
    if (localFilters.distance !== 25) count++;
    if (localFilters.amenities.length > 0) count++;
    if (localFilters.pitchType !== "all") count++;
    if (localFilters.lighting) count++;
    if (localFilters.parking) count++;
    if (localFilters.rating > 0) count++;
    if (localFilters.availability !== "all") count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className={cn(
          "w-[90vw] max-w-sm sm:w-96 overflow-y-auto border-white/[0.08] bg-[#0a0a0a]/95 p-0 shadow-glass-lg backdrop-blur-2xl",
          "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-emerald/8 before:via-transparent before:to-emerald/4",
        )}
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-emerald/15 blur-3xl" />
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-25" />

        <div className="relative z-10 flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
            <SheetTitle className="flex items-center gap-3 font-display text-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald/15 border border-emerald/25">
                <SlidersHorizontal className="w-4 h-4 text-emerald" />
              </div>
              <span>
                Filters
                {activeCount > 0 && (
                  <Badge className="ml-2 bg-emerald/15 text-emerald border-emerald/25 hover:bg-emerald/20">
                    {activeCount}
                  </Badge>
                )}
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-hide">
            {activeCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3"
              >
                <span className="text-sm text-emerald font-medium">
                  {activeCount} filter{activeCount > 1 ? "s" : ""} active
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-emerald h-8"
                >
                  Clear All
                </Button>
              </motion.div>
            )}

            <FilterSection icon={<IndianRupee className="w-3.5 h-3.5" />} title="Price Range (per hour)" index={0}>
              <GlassCard className="p-4">
                <Slider
                  value={localFilters.priceRange}
                  onValueChange={(value) => updateFilter("priceRange", value)}
                  max={3000}
                  min={200}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-sm mt-4">
                  <span className="text-muted-foreground">₹{localFilters.priceRange[0]}</span>
                  <span className="font-semibold text-emerald">₹{localFilters.priceRange[1]}</span>
                </div>
              </GlassCard>
            </FilterSection>

            <FilterSection icon={<MapPin className="w-3.5 h-3.5" />} title="Distance" index={1}>
              <GlassCard className="p-4">
                <Slider
                  value={[localFilters.distance]}
                  onValueChange={(value) => updateFilter("distance", value[0])}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm mt-4">
                  <span className="text-muted-foreground">1 km</span>
                  <span className="font-semibold text-emerald">{localFilters.distance} km</span>
                  <span className="text-muted-foreground">50 km</span>
                </div>
              </GlassCard>
            </FilterSection>

            <FilterSection icon={<Star className="w-3.5 h-3.5" />} title="Minimum Rating" index={2}>
              <GlassCard className="p-4">
                <Slider
                  value={[localFilters.rating]}
                  onValueChange={(value) => updateFilter("rating", value[0])}
                  max={5}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm mt-4">
                  <span className="text-muted-foreground">Any</span>
                  <span className="font-semibold text-emerald">
                    {localFilters.rating > 0
                      ? `${localFilters.rating}+ stars`
                      : "Any rating"}
                  </span>
                  <span className="text-muted-foreground">5 stars</span>
                </div>
              </GlassCard>
            </FilterSection>

            <FilterSection icon={<Sparkles className="w-3.5 h-3.5" />} title="Pitch Type" index={3}>
              <GlassCard className="p-3">
                <RadioGroup
                  value={localFilters.pitchType}
                  onValueChange={(value) => updateFilter("pitchType", value)}
                  className="space-y-1"
                >
                  {pitchTypes.map((type) => (
                    <label
                      key={type.value}
                      htmlFor={type.value}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                        localFilters.pitchType === type.value
                          ? "bg-emerald/10 border border-emerald/20"
                          : "hover:bg-white/[0.04]",
                      )}
                    >
                      <RadioGroupItem value={type.value} id={type.value} />
                      <span className="text-sm text-foreground">{type.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </GlassCard>
            </FilterSection>

            <FilterSection icon={<Clock className="w-3.5 h-3.5" />} title="Preferred Time" index={4}>
              <GlassCard className="p-3">
                <RadioGroup
                  value={localFilters.availability}
                  onValueChange={(value) => updateFilter("availability", value)}
                  className="space-y-1"
                >
                  {availabilityOptions.map((option) => (
                    <label
                      key={option.value}
                      htmlFor={option.value}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                        localFilters.availability === option.value
                          ? "bg-emerald/10 border border-emerald/20"
                          : "hover:bg-white/[0.04]",
                      )}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <span className="text-sm text-foreground">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </GlassCard>
            </FilterSection>

            <FilterSection icon={<Zap className="w-3.5 h-3.5" />} title="Essential Features" index={5}>
              <GlassCard className="p-3 space-y-1">
                {[
                  { id: "lighting", label: "Night Lighting", checked: localFilters.lighting, key: "lighting" as const },
                  { id: "parking", label: "Parking Available", checked: localFilters.parking, key: "parking" as const },
                ].map((item) => (
                  <label
                    key={item.id}
                    htmlFor={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors",
                      item.checked
                        ? "bg-emerald/10 border border-emerald/20"
                        : "hover:bg-white/[0.04]",
                    )}
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={(checked) => updateFilter(item.key, checked)}
                    />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </label>
                ))}
              </GlassCard>
            </FilterSection>

            <FilterSection icon={<Car className="w-3.5 h-3.5" />} title="Amenities" index={6}>
              <GlassCard className="p-3">
                <div className="grid grid-cols-1 gap-0.5 max-h-48 overflow-y-auto scrollbar-hide">
                  {amenitiesOptions.map((amenity) => (
                    <label
                      key={amenity}
                      htmlFor={amenity}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                        localFilters.amenities.includes(amenity)
                          ? "bg-emerald/10 border border-emerald/20"
                          : "hover:bg-white/[0.04]",
                      )}
                    >
                      <Checkbox
                        id={amenity}
                        checked={localFilters.amenities.includes(amenity)}
                        onCheckedChange={(checked) =>
                          handleAmenityChange(amenity, checked as boolean)
                        }
                      />
                      <span className="text-sm text-foreground">{amenity}</span>
                    </label>
                  ))}
                </div>
              </GlassCard>
            </FilterSection>
          </div>

          <div className="relative z-10 border-t border-white/[0.06] px-6 py-4 bg-white/[0.02] backdrop-blur-md">
            <Button
              onClick={applyFilters}
              variant="glow"
              size="lg"
              className="w-full h-12 rounded-xl font-semibold"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterPanel;
