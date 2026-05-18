import { motion } from "framer-motion";
import { Filter, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import GroundCard from "@/components/GroundCard";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import type { City } from "@/lib/cities";
import type { FilterOptions } from "@/components/FilterPanel";
import { staggerContainer, staggerItem } from "@/lib/motion";

interface GroundsListingSectionProps {
  selectedCity: City;
  realGrounds: any[];
  isLoadingGrounds: boolean;
  filters: FilterOptions;
  onFilterOpen: () => void;
  onFilterChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  onBook: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const hasActiveFilters = (filters: FilterOptions) =>
  filters.priceRange[0] !== 500 ||
  filters.priceRange[1] !== 2000 ||
  filters.distance !== 25 ||
  filters.amenities.length > 0 ||
  filters.pitchType !== "all" ||
  filters.lighting ||
  filters.parking ||
  filters.rating > 0 ||
  filters.availability !== "all";

const GroundsListingSection = ({
  selectedCity,
  realGrounds,
  isLoadingGrounds,
  filters,
  onFilterOpen,
  onFilterChange,
  onClearFilters,
  onBook,
  onViewDetails,
}: GroundsListingSectionProps) => {
  const quickFilters = [
    {
      label: "Budget Friendly",
      active: filters.priceRange[1] <= 1000,
      onClick: () => onFilterChange({ ...filters, priceRange: [500, 1000] }),
    },
    {
      label: "Night Games",
      active: filters.lighting,
      onClick: () => onFilterChange({ ...filters, lighting: true }),
    },
    {
      label: "Highly Rated",
      active: filters.rating >= 4.5,
      onClick: () => onFilterChange({ ...filters, rating: 4.5 }),
    },
    {
      label: "Nearby",
      active: filters.distance <= 5,
      onClick: () => onFilterChange({ ...filters, distance: 5 }),
    },
  ];

  return (
    <section id="grounds" className="section-padding pt-8">
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 text-emerald text-sm font-medium mb-2">
              <MapPin className="h-4 w-4" />
              {selectedCity.name}
            </div>
            <h2 className="heading-display text-3xl sm:text-4xl">
              Trending Grounds
            </h2>
            <p className="mt-2 text-muted-foreground">
              {realGrounds.length} premium turfs available for booking
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters(filters) && (
              <Badge className="bg-emerald/10 text-emerald border-emerald/20">
                Filters Active
              </Badge>
            )}
            <Button variant="glass" onClick={onFilterOpen} className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-8">
          {quickFilters.map((qf) => (
            <Button
              key={qf.label}
              variant="outline"
              size="sm"
              onClick={qf.onClick}
              className={cn(
                "rounded-full",
                qf.active && "border-emerald/40 bg-emerald/10 text-emerald",
              )}
            >
              {qf.label}
            </Button>
          ))}
        </div>

        {isLoadingGrounds ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i} className="overflow-hidden">
                <Skeleton className="h-52 w-full rounded-none bg-white/5" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4 bg-white/5" />
                  <Skeleton className="h-4 w-1/2 bg-white/5" />
                  <Skeleton className="h-10 w-full bg-white/5" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : realGrounds.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {realGrounds.map((ground) => (
              <motion.div key={ground._id} variants={staggerItem}>
                <GroundCard
                  ground={ground}
                  onBook={onBook}
                  onViewDetails={onViewDetails}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <GlassCard className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald/10">
              <Sparkles className="h-8 w-8 text-emerald" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">No grounds found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No cricket grounds found in {selectedCity.name}. Try adjusting your filters.
            </p>
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
          </GlassCard>
        )}
      </div>
    </section>
  );
};

export default GroundsListingSection;
