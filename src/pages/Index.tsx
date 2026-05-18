import { useState, useEffect, useMemo } from "react";
import { MapPin, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import LocationSelector from "@/components/LocationSelector";
import FilterPanel from "@/components/FilterPanel";
import NewBookingModal from "@/components/NewBookingModal";
import type { City } from "@/lib/cities";
import { groundsApi } from "@/lib/api";
import type { FilterOptions } from "@/components/FilterPanel";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isMongoObjectId } from "@/lib/utils";
import { bookingsApi } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/config";
import PageShell from "@/components/layout/PageShell";
import { PageLoader } from "@/components/ui/page-loader";
import HeroSection from "@/components/landing/HeroSection";
import BookingTicker from "@/components/landing/BookingTicker";
import GroundsListingSection from "@/components/landing/GroundsListingSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyChooseSection from "@/components/landing/WhyChooseSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import { GlassCard } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";

// Demo data removed — testimonials live in TestimonialsSection component

// Helper to merge and deduplicate notifications by id and status
function mergeNotifications(oldNotifs: any[], newNotifs: any[]) {
  const map = new Map();
  
  // Process old notifications first
  oldNotifs.forEach(n => {
    const key = n.id + '-' + n.status;
    map.set(key, n);
  });
  
  // Process new notifications, overwriting old ones if they have the same key
  newNotifs.forEach(n => {
    const key = n.id + '-' + n.status;
    // If this notification exists in the database, remove the isLocal flag
    if (map.has(key) && map.get(key).isLocal) {
      n.isLocal = false;
    }
    map.set(key, n);
  });
  
  return Array.from(map.values());
}

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<City | undefined>();
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedGround, setSelectedGround] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [grounds, setGrounds] = useState<any[]>([]);
  const [isLoadingGrounds, setIsLoadingGrounds] = useState(false);
  const [heroStats, setHeroStats] = useState({ grounds: 500, players: 50000, bookings: 10000 });

  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('boxcric_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

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

  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  useEffect(() => {
    const animateStats = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setHeroStats({
          grounds: Math.floor(500 * progress),
          players: Math.floor(50000 * progress),
          bookings: Math.floor(10000 * progress),
        });
        
        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);
    };

    animateStats();
  }, []);

  useEffect(() => {
    const run = async () => {
      const base = getApiBaseUrl().replace(/\/$/, "");
      try {
        console.log("🧪 Checking API:", `${base}/health`);
        const res = await fetch(`${base}/health`, { method: "GET" });
        const text = await res.text();
        let data: unknown = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = { raw: text?.slice(0, 200) };
        }
        if (!res.ok) {
          console.error("❌ API health HTTP", res.status, data);
          return;
        }
        console.log("✅ API health OK:", data);
      } catch (error) {
        console.error("❌ API health check failed:", error);
      }
    };
    run();
  }, []);

  // Auto-open location selector on first visit
  useEffect(() => {
    if (!selectedCity) {
      const timer = setTimeout(() => {
        setIsLocationSelectorOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedCity]);

  // Add smooth scroll behavior
  useEffect(() => {
    const smoothScroll = (e: any) => {
      if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    document.addEventListener('click', smoothScroll);
    return () => document.removeEventListener('click', smoothScroll);
  }, []);

  // Fetch grounds when city or filters change
  useEffect(() => {
    if (selectedCity) {
      fetchGrounds();
    }
  }, [selectedCity, searchQuery, filters]);

  // Restore selected city from localStorage on mount
  useEffect(() => {
    const savedCity = localStorage.getItem("boxcric_selected_city");
    if (savedCity) {
      setSelectedCity(JSON.parse(savedCity));
    }
  }, []);

  // Fetch user booking notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const fetchNotifications = async () => {
      try {
        const res = await bookingsApi.getMyBookings();
        console.log('Notifications API response:', res);
        
        // Handle different response structures
        let bookings = [];
        if (res.data && res.data.success && Array.isArray(res.data.bookings)) {
          bookings = res.data.bookings;
        } else if (res.data && res.data.success && Array.isArray(res.data.bookings)) {
          bookings = res.data.bookings;
        } else if (Array.isArray(res.data)) {
          bookings = res.data;
        }
        
        if (bookings.length > 0) {
          const newNotifs = bookings
            .filter(b => ["pending", "confirmed", "cancelled", "completed"].includes(b.status))
            .map(b => ({
              id: b._id || b.id,
              status: b.status,
              ground: b.groundId?.name || b.groundId || 'Unknown Ground',
              date: b.bookingDate,
              time: b.timeSlot ? `${b.timeSlot.startTime} - ${b.timeSlot.endTime}` : 'Time not specified',
              reason: b.cancellation?.reason || '',
              createdAt: b.createdAt || new Date().toISOString(),
            }));
          
          setNotifications(prevNotifs => {
            // Keep any local notifications (newly created) and merge with API notifications
            const localNotifs = prevNotifs.filter(n => n.isLocal);
            const merged = mergeNotifications([...localNotifs, ...newNotifs], []);
            localStorage.setItem('boxcric_notifications', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('boxcric_notifications');
  };

  const MAX_RETRIES = 2;
  const RETRY_DELAY = 2000; // 2 seconds

  const fetchGrounds = async (retryCount = 0) => {
    if (!selectedCity) return;

    try {
      setIsLoadingGrounds(true);
      console.log(
        `🔍 Fetching grounds for city: ${selectedCity.name} (${selectedCity.id})`,
        `Attempt ${retryCount + 1}/${MAX_RETRIES + 1}`
      );

      const params: any = {
        cityId: selectedCity.id,
        page: 1,
        limit: 20,
        _t: new Date().getTime(), // Cache buster
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (filters.priceRange[0] !== 500 || filters.priceRange[1] !== 2000) {
        params.minPrice = filters.priceRange[0];
        params.maxPrice = filters.priceRange[1];
      }

      if (filters.amenities.length > 0) {
        params.amenities = filters.amenities;
      }

      if (filters.pitchType !== "all") {
        params.pitchType = filters.pitchType;
      }

      if (filters.lighting) {
        params.lighting = true;
      }

      if (filters.parking) {
        params.parking = true;
      }

      if (filters.rating > 0) {
        params.minRating = filters.rating;
      }

      if (filters.distance < 25) {
        params.maxDistance = filters.distance;
        params.lat = selectedCity.latitude;
        params.lng = selectedCity.longitude;
      }

      console.log("📡 API Request params:", params);
      const response = await groundsApi.getGrounds(params) as any;
      
      console.log("📥 API Response:", response);

      if (response.success) {
        console.log("✅ Found grounds:", response.grounds?.length);
        setGrounds(response.grounds || []);
      } else {
        console.log("❌ API returned error:", response.message);
        setGrounds([]);
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch grounds:", error);
      toast.error("Failed to load grounds. Please try again.");
      setGrounds([]);
    } finally {
      setIsLoadingGrounds(false);
    }
  };

  // Replace displayGrounds with only real MongoDB grounds
  const realGrounds = useMemo(() => grounds.filter(g => isMongoObjectId(g._id)), [grounds]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    localStorage.setItem("boxcric_selected_city", JSON.stringify(city));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleBookGround = (groundId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to book a ground");
      return;
    }
    if (!isMongoObjectId(groundId)) {
      toast.error("This ground cannot be booked online.");
      return;
    }
    const ground = grounds.find((g) => g._id === groundId);
    if (ground) {
      setSelectedGround(ground);
      setIsBookingModalOpen(true);
    }
  };

  const handleViewDetails = (groundId: string) => {
    console.log("View details clicked for ground ID:", groundId);
    console.log("Ground data:", realGrounds.find(g => g._id === groundId));
    navigate(`/ground/${groundId}`);
  };

  const handleBookingCreated = (booking: any) => {
    toast.success("Booking created successfully!");
    
    // Add notification for new booking
    const newNotification = {
      id: booking._id || booking.id || Date.now().toString(),
      status: booking.status || 'pending', // Use actual booking status
      ground: booking.groundId?.name || selectedGround?.name || 'Unknown Ground',
      date: booking.bookingDate,
      time: booking.timeSlot ? `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}` : 'Time not specified',
      reason: '',
      createdAt: new Date().toISOString(),
      isLocal: true, // Mark as local notification
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      localStorage.setItem('boxcric_notifications', JSON.stringify(updated));
      return updated;
    });
    
    navigate(`/booking/${booking._id}`);
  };

  return (
    <PageShell>
      <AnimatePresence>
        {isPageLoading && <PageLoader />}
      </AnimatePresence>

      <Navbar
        selectedCity={selectedCity?.name}
        onCitySelect={() => setIsLocationSelectorOpen(true)}
        onSearch={handleSearch}
        onFilterToggle={() => setIsFilterPanelOpen(true)}
      />

      <HeroSection
        stats={heroStats}
        selectedCity={selectedCity}
        onCitySelect={() => setIsLocationSelectorOpen(true)}
      />

      <BookingTicker />

      {selectedCity && (
        <GroundsListingSection
          selectedCity={selectedCity}
          realGrounds={realGrounds}
          isLoadingGrounds={isLoadingGrounds}
          filters={filters}
          onFilterOpen={() => setIsFilterPanelOpen(true)}
          onFilterChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          onBook={handleBookGround}
          onViewDetails={handleViewDetails}
        />
      )}

      {!selectedCity && (
        <section className="py-12 px-4">
          <div className="container-premium text-center">
            <GlassCard className="inline-flex items-center gap-3 px-6 py-4">
              <MapPin className="h-5 w-5 text-emerald animate-pulse" />
              <span className="text-emerald font-medium">
                Select your city to discover nearby cricket grounds
              </span>
            </GlassCard>
          </div>
        </section>
      )}

      <HowItWorksSection />
      <WhyChooseSection />
      <TestimonialsSection />

      {/* Newsletter CTA */}
      <section className="section-padding">
        <div className="container-premium">
          <GlassCard glow className="relative overflow-hidden p-10 sm:p-14 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald/10 via-transparent to-emerald/5 pointer-events-none" />
            <div className="relative">
              <h2 className="heading-display text-3xl sm:text-4xl mb-4">Stay in the Loop</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Get notified about new grounds, special offers, and cricket events in your area
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 h-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm focus:outline-none focus:border-emerald/50 focus:ring-2 focus:ring-emerald/20"
                />
                <Button variant="glow" size="lg">Subscribe</Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <LocationSelector
        isOpen={isLocationSelectorOpen}
        onClose={() => setIsLocationSelectorOpen(false)}
        onCitySelect={handleCitySelect}
        selectedCity={selectedCity}
      />

      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      <NewBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        ground={selectedGround}
        onBookingCreated={handleBookingCreated}
      />

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald text-white shadow-glow"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </motion.button>
    </PageShell>
  );
};

export default Index;
