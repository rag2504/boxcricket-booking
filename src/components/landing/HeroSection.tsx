import { motion } from "framer-motion";
import { MapPin, Shield, Clock, Star, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { GlassCard } from "@/components/ui/glass-card";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion";
import type { City } from "@/lib/cities";

interface HeroSectionProps {
  stats: { grounds: number; players: number; bookings: number };
  selectedCity?: City;
  onCitySelect: () => void;
}

const HeroSection = ({ stats, selectedCity, onCitySelect }: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden section-padding pt-8 sm:pt-12">
      <div className="absolute inset-0 mesh-bg" />
      <div className="absolute top-1/4 -left-32 h-64 w-64 rounded-full bg-emerald/10 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 h-64 w-64 rounded-full bg-emerald/5 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      {/* Floating sports elements */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 left-[10%] hidden lg:block"
      >
        <GlassCard className="p-4 rotate-[-8deg]">
          <span className="text-2xl">🏏</span>
        </GlassCard>
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-48 right-[12%] hidden lg:block"
      >
        <GlassCard className="p-3 rotate-[6deg]">
          <span className="text-xl">🏟️</span>
        </GlassCard>
      </motion.div>

      <div className="container-premium relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div variants={staggerItem}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-4 py-1.5 text-xs font-medium text-emerald">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Box Cricket Booking Platform
            </span>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="heading-display mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-balance"
          >
            Book Your Perfect{" "}
            <span className="gradient-text">Cricket Ground</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed"
          >
            Discover premium box cricket turfs near you. From floodlit arenas to
            budget-friendly pitches — find and book your perfect match in seconds.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="glow" size="xl" onClick={onCitySelect} className="min-w-[200px] gap-2">
              <MapPin className="h-4 w-4" />
              {selectedCity ? selectedCity.name : "Select Your City"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="glass" size="xl" asChild>
              <a href="#grounds">Browse Grounds</a>
            </Button>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald" /> Secure Booking
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald" /> Instant Confirmation
            </span>
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald" /> Verified Grounds
            </span>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            { value: stats.grounds, suffix: "+", label: "Premium Grounds", icon: "🏆" },
            { value: stats.players, suffix: "+", label: "Happy Players", icon: "👥" },
            { value: stats.bookings, suffix: "+", label: "Bookings Made", icon: "⚡" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={staggerItem}>
              <GlassCard hover glow className="p-6 text-center">
                <span className="text-2xl">{stat.icon}</span>
                <p className="mt-3 font-display text-3xl font-bold">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
