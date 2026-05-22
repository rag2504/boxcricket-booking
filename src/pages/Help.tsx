import { useState } from "react";
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  Book,
  CreditCard,
  MapPin,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  Shield,
  Clock,
  HelpCircle,
  Smartphone,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import LiveChatWidget from "@/components/chat/LiveChatWidget";
const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6 text-emerald" />,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      contact: "+91 1800-BOXCRIC",
      availability: "Mon-Sun, 6 AM - 11 PM",
      action: "Call Now",
    },
    {
      icon: <Mail className="w-6 h-6 text-emerald" />,
      title: "Email Support",
      description: "Send us your questions anytime",
      contact: "support@boxcric.com",
      availability: "Response within 24 hours",
      action: "Send Email",
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-emerald" />,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available in app",
      availability: "Mon-Sun, 9 AM - 9 PM",
      action: "Start Chat",
    },
  ];

  const categories = [
    {
      id: "booking",
      icon: <Book className="w-5 h-5" />,
      title: "Booking & Reservations",
      description: "How to book grounds, modify bookings, and cancellations",
      color: "bg-emerald/10 text-emerald border-emerald/20",
      faqCount: 8,
      popular: true,
    },
    {
      id: "payment",
      icon: <CreditCard className="w-5 h-5" />,
      title: "Payments & Refunds",
      description: "Payment methods, refund policies, and billing issues",
      color: "bg-emerald/10 text-emerald border-emerald/20",
      faqCount: 6,
      popular: false,
    },
    {
      id: "grounds",
      icon: <MapPin className="w-5 h-5" />,
      title: "Ground Information",
      description: "Ground details, amenities, and location guidance",
      color: "bg-emerald/10 text-emerald border-emerald/20",
      faqCount: 7,
      popular: true,
    },
    {
      id: "account",
      icon: <Settings className="w-5 h-5" />,
      title: "Account & Settings",
      description: "Profile management, notifications, and app settings",
      color: "bg-emerald/10 text-emerald border-emerald/20",
      faqCount: 5,
      popular: false,
    },
    {
      id: "safety",
      icon: <Shield className="w-5 h-5" />,
      title: "Safety & Security",
      description: "Safety measures, insurance, and emergency procedures",
      color: "bg-emerald/10 text-emerald border-emerald/20",
      faqCount: 4,
      popular: false,
    },
    {
      id: "technical",
      icon: <Smartphone className="w-5 h-5" />,
      title: "Technical Support",
      description: "App issues, website problems, and technical assistance",
      color: "bg-emerald/10 text-emerald border-emerald/20",
      faqCount: 6,
      popular: false,
    },
    {
      id: "amenities",
      icon: <Wifi className="w-5 h-5" />,
      title: "Amenities & Services",
      description: "Available facilities, equipment, and additional services",
      color: "bg-emerald/10 text-emerald border-emerald/20",
      faqCount: 5,
      popular: false,
    },
    {
      id: "community",
      icon: <Users className="w-5 h-5" />,
      title: "Community & Events",
      description: "Tournaments, leagues, and community features",
      color: "bg-emerald/10 text-emerald border-emerald/20",
      faqCount: 4,
      popular: false,
    },
  ];

  const faqs = [
    // Booking & Reservations
    {
      id: "booking-process",
      category: "booking",
      question: "How do I book a cricket ground?",
      answer: "To book a cricket ground: 1) Select your city or allow location access 2) Browse available grounds or use filters 3) Choose your preferred ground and time slot 4) Enter player details and make payment 5) Receive instant confirmation with ground owner contact details.",
      popular: true,
    },
    {
      id: "cancellation-policy",
      category: "booking",
      question: "What is the cancellation policy?",
      answer: "You can cancel your booking up to 4 hours before the scheduled time for a full refund. Cancellations between 2-4 hours will receive a 50% refund. No refund is available for cancellations within 2 hours of the booking time.",
      popular: true,
    },
    {
      id: "booking-modification",
      category: "booking",
      question: "Can I modify my booking after confirmation?",
      answer: "Yes, you can modify your booking up to 2 hours before the scheduled time. Changes include date, time slot, and number of players. Contact our support team or use the 'Modify Booking' option in your booking details.",
      popular: false,
    },
    {
      id: "group-booking",
      category: "booking",
      question: "How do I book for a large group or tournament?",
      answer: "For group bookings of 20+ players or tournament bookings, please contact our support team at least 48 hours in advance. We offer special rates and dedicated assistance for large events.",
      popular: false,
    },
    {
      id: "advance-booking",
      category: "booking",
      question: "How far in advance can I book a ground?",
      answer: "You can book grounds up to 30 days in advance. For special events or tournaments, we recommend booking at least 1 week ahead to ensure availability.",
      popular: false,
    },
    {
      id: "booking-confirmation",
      category: "booking",
      question: "How do I know my booking is confirmed?",
      answer: "You'll receive an instant confirmation email and SMS with booking details. You can also check your booking status in the 'My Bookings' section of your profile.",
      popular: false,
    },
    {
      id: "no-show-policy",
      category: "booking",
      question: "What happens if I don't show up for my booking?",
      answer: "No-shows are charged the full booking amount. If you're running late, please contact the ground owner or our support team immediately to avoid penalties.",
      popular: false,
    },
    {
      id: "weather-cancellation",
      category: "booking",
      question: "What if it rains on the day of my booking?",
      answer: "In case of rain or adverse weather conditions, you can reschedule your booking free of charge up to 2 hours before the scheduled time. Contact our support team for assistance.",
      popular: false,
    },

    // Payments & Refunds
    {
      id: "payment-methods",
      category: "payment",
      question: "What payment methods are accepted?",
      answer: "We accept all major credit/debit cards, UPI payments (PhonePe, Google Pay, Paytm), net banking, and digital wallets. All transactions are secured with 256-bit encryption.",
      popular: true,
    },
    {
      id: "refund-timeline",
      category: "payment",
      question: "How long does it take to receive a refund?",
      answer: "Refunds are processed within 24 hours of cancellation. The amount will be credited back to your original payment method within 5-7 business days depending on your bank.",
      popular: true,
    },
    {
      id: "partial-refund",
      category: "payment",
      question: "When am I eligible for a partial refund?",
      answer: "Partial refunds are available for cancellations between 2-4 hours before booking time, or if listed amenities are unavailable during your visit. Contact support within 24 hours of your booking.",
      popular: false,
    },
    {
      id: "payment-security",
      category: "payment",
      question: "Is my payment information secure?",
      answer: "Yes, we use industry-standard SSL encryption and PCI DSS compliance. We never store your complete payment details on our servers.",
      popular: false,
    },
    {
      id: "invoice-download",
      category: "payment",
      question: "How do I download my booking invoice?",
      answer: "You can download your invoice from the booking details page or from your email confirmation. Invoices are also available in the 'My Bookings' section of your profile.",
      popular: false,
    },
    {
      id: "gst-information",
      category: "payment",
      question: "Is GST included in the booking price?",
      answer: "Yes, all prices shown include applicable GST. The tax breakdown is available in your booking invoice.",
      popular: false,
    },

    // Ground Information
    {
      id: "ground-location",
      category: "grounds",
      question: "How accurate are the ground locations?",
      answer: "All ground locations are verified by our team. We provide exact GPS coordinates, detailed address, and landmark information. You can also contact the ground owner directly for specific directions.",
      popular: true,
    },
    {
      id: "ground-amenities",
      category: "grounds",
      question: "Are the listed amenities guaranteed?",
      answer: "Yes, all amenities listed are verified during our ground inspection process. If any listed amenity is unavailable during your visit, you can report it and may be eligible for a partial refund.",
      popular: true,
    },
    {
      id: "ground-rating",
      category: "grounds",
      question: "How are ground ratings calculated?",
      answer: "Ground ratings are based on user reviews, our quality inspections, and factors like amenities, maintenance, and customer service. Ratings are updated regularly.",
      popular: false,
    },
    {
      id: "ground-photos",
      category: "grounds",
      question: "Are the ground photos recent and accurate?",
      answer: "We regularly update ground photos and verify their accuracy. If you notice outdated photos, please report them through the ground details page.",
      popular: false,
    },
    {
      id: "ground-verification",
      category: "grounds",
      question: "How do you verify ground quality?",
      answer: "Our team conducts regular inspections covering pitch quality, safety measures, amenities, and overall maintenance. We also monitor user feedback and ratings.",
      popular: false,
    },
    {
      id: "ground-availability",
      category: "grounds",
      question: "How often is ground availability updated?",
      answer: "Ground availability is updated in real-time. Ground owners can mark slots as unavailable, and our system immediately reflects these changes.",
      popular: false,
    },
    {
      id: "ground-contact",
      category: "grounds",
      question: "Can I contact the ground owner directly?",
      answer: "Yes, you'll receive the ground owner's contact details in your booking confirmation. You can also find their contact information on the ground details page.",
      popular: false,
    },

    // Account & Settings
    {
      id: "profile-update",
      category: "account",
      question: "How do I update my profile information?",
      answer: "Go to 'My Profile' from the navbar, then click 'Edit Profile'. You can update your name, email, phone number, and location preferences. Don't forget to save your changes.",
      popular: true,
    },
    {
      id: "notification-preferences",
      category: "account",
      question: "How do I manage notification preferences?",
      answer: "Visit Settings > Notification Preferences to customize email, SMS, and push notifications. You can choose to receive booking confirmations, ground recommendations, and promotional offers.",
      popular: true,
    },
    {
      id: "password-change",
      category: "account",
      question: "How do I change my password?",
      answer: "Go to Settings > Security > Change Password. You'll need to enter your current password and then set a new one. Make sure to use a strong password.",
      popular: false,
    },
    {
      id: "account-deletion",
      category: "account",
      question: "How do I delete my account?",
      answer: "To delete your account, contact our support team. Note that this action is irreversible and will cancel all future bookings.",
      popular: false,
    },
    {
      id: "data-privacy",
      category: "account",
      question: "How is my personal data protected?",
      answer: "We follow strict data protection guidelines and never share your personal information with third parties without consent. Read our Privacy Policy for detailed information.",
      popular: false,
    },

    // Safety & Security
    {
      id: "safety-measures",
      category: "safety",
      question: "What safety measures are in place at grounds?",
      answer: "All grounds must meet our safety standards including first aid kits, emergency exits, and proper lighting. Ground owners are trained in basic safety procedures.",
      popular: true,
    },
    {
      id: "insurance-coverage",
      category: "safety",
      question: "Is there insurance coverage for injuries?",
      answer: "Ground owners are required to have basic liability insurance. For comprehensive coverage, we recommend purchasing additional sports insurance.",
      popular: false,
    },
    {
      id: "emergency-contacts",
      category: "safety",
      question: "What should I do in case of an emergency?",
      answer: "In case of emergency, contact the ground owner immediately. You can also call our 24/7 support line for assistance. Always prioritize safety first.",
      popular: false,
    },
    {
      id: "covid-guidelines",
      category: "safety",
      question: "What are the current COVID-19 guidelines?",
      answer: "We follow local health authority guidelines. Currently, masks are optional but recommended in indoor areas. Sanitizers are available at all grounds.",
      popular: false,
    },

    // Technical Support
    {
      id: "app-issues",
      category: "technical",
      question: "The app is not working properly. What should I do?",
      answer: "Try restarting the app and clearing cache. If the issue persists, check your internet connection and app updates. Contact our technical support for further assistance.",
      popular: true,
    },
    {
      id: "login-problems",
      category: "technical",
      question: "I can't log into my account. Help!",
      answer: "Try resetting your password using the 'Forgot Password' option. If you're still having issues, contact our support team with your registered email address.",
      popular: true,
    },
    {
      id: "payment-failed",
      category: "technical",
      question: "My payment failed. What should I do?",
      answer: "Check your payment method and ensure sufficient funds. If the issue persists, try a different payment method or contact our support team for assistance.",
      popular: false,
    },
    {
      id: "booking-not-found",
      category: "technical",
      question: "I can't find my booking confirmation. Help!",
      answer: "Check your email spam folder first. You can also find your booking in the 'My Bookings' section of your profile. Contact support if you still can't locate it.",
      popular: false,
    },
    {
      id: "location-services",
      category: "technical",
      question: "Location services are not working. How to fix?",
      answer: "Enable location services in your device settings and app permissions. Make sure you're using a supported browser or the latest version of our app.",
      popular: false,
    },
    {
      id: "slow-loading",
      category: "technical",
      question: "The website/app is loading slowly. What can I do?",
      answer: "Check your internet connection and try refreshing the page. Clear your browser cache or restart the app. If the issue persists, it might be a temporary server issue.",
      popular: false,
    },

    // Amenities & Services
    {
      id: "equipment-availability",
      category: "amenities",
      question: "What equipment is available at the grounds?",
      answer: "Most grounds provide basic cricket equipment including bats, balls, and stumps. Some grounds also offer helmets, pads, and gloves. Check the ground details for specific amenities.",
      popular: true,
    },
    {
      id: "parking-availability",
      category: "amenities",
      question: "Is parking available at all grounds?",
      answer: "Most grounds offer parking facilities. Check the ground details for parking information including availability, charges, and capacity.",
      popular: false,
    },
    {
      id: "food-services",
      category: "amenities",
      question: "Do grounds provide food and beverages?",
      answer: "Some grounds have cafeterias or food services. Check the ground details for available food options. You can also bring your own food and beverages.",
      popular: false,
    },
    {
      id: "changing-rooms",
      category: "amenities",
      question: "Are changing rooms and showers available?",
      answer: "Many grounds provide changing rooms and shower facilities. Check the ground details for specific amenities and their availability.",
      popular: false,
    },
    {
      id: "wifi-availability",
      category: "amenities",
      question: "Is WiFi available at the grounds?",
      answer: "Some grounds offer WiFi facilities. Check the ground details for WiFi availability and any associated charges.",
      popular: false,
    },

    // Community & Events
    {
      id: "tournament-booking",
      category: "community",
      question: "How do I book grounds for tournaments?",
      answer: "For tournament bookings, contact our support team at least 1 week in advance. We offer special rates and dedicated assistance for tournament organizers.",
      popular: true,
    },
    {
      id: "league-participation",
      category: "community",
      question: "How can I participate in cricket leagues?",
      answer: "Check our 'Tournaments & Leagues' section for upcoming events. You can register your team or join existing teams through our platform.",
      popular: false,
    },
    {
      id: "team-formation",
      category: "community",
      question: "How do I find players for my team?",
      answer: "Use our 'Find Players' feature to connect with other cricket enthusiasts in your area. You can also join our community forums and social media groups.",
      popular: false,
    },
    {
      id: "community-events",
      category: "community",
      question: "Are there any community events or meetups?",
      answer: "Yes, we regularly organize community events, cricket meetups, and skill development sessions. Check our events calendar for upcoming activities.",
      popular: false,
    },
  ];

  const filteredFAQs = (() => {
    let filtered = faqs;

    // First apply search filter if there's a search query
    if (searchQuery) {
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          categories
            .find((c) => c.id === faq.category)
            ?.title.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Then apply category filter if a category is selected
    if (selectedCategory && !searchQuery) {
      filtered = filtered.filter((faq) => faq.category === selectedCategory);
    }
    return filtered;
  })();

  const popularFAQs = faqs.filter((faq) => faq.popular);

  const handleCategoryClick = (categoryId: string) => {
    const isAlreadySelected = selectedCategory === categoryId;
    setSelectedCategory(isAlreadySelected ? null : categoryId);
    setSearchQuery("");
    setActiveTab("all");
    
    // Smoothly scroll to the FAQ section
    setTimeout(() => {
      document.getElementById("faq-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setActiveTab("all");
  };

  const handleLiveChat = () => {
    setIsChatOpen(true);
  };

  const handleSendEmail = () => {
    toast.info("Support Email", {
      description: "Please send your query to support@boxcric.com (or oneloki05@gmail.com).",
      duration: 4000,
    });
  };

  return (
    <PageShell>
      <Navbar />

      <div className="container-premium section-padding max-w-6xl">
        {/* Header Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-12 w-72 h-72 bg-emerald/10 rounded-full blur-3xl pointer-events-none" />
          
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-4 py-1.5 text-xs font-medium text-emerald mb-6">
            <HelpCircle className="h-3.5 w-3.5" />
            Support Center
          </span>
          <h1 className="heading-display text-4xl sm:text-5xl lg:text-6xl mb-4 text-balance">
            How can we <span className="gradient-text">help you?</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Find answers to your questions, explore ground policies, or get in touch with our team.
          </p>
        </div>

        {/* Elegant Search Bar */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-emerald" />
            </div>
            <Input
              type="text"
              placeholder="Search ground booking, payments, cancellation policies..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) {
                  setSelectedCategory(null);
                }
              }}
              className="pl-12 pr-10 py-4 h-14 text-base bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl focus:border-emerald focus:ring-2 focus:ring-emerald/20 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300 shadow-glass"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-center mt-3 text-sm text-muted-foreground">
              Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? "s" : ""} for "{searchQuery}"
            </div>
          )}
          {(searchQuery || selectedCategory) && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-emerald border-emerald/20 hover:border-emerald hover:bg-emerald/5"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>

        {/* Contact Methods Section */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold font-display text-foreground">Get in Touch</h2>
            <p className="text-sm text-muted-foreground mt-2">Need personal assistance? We are here to support you 24/7.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <GlassCard
                key={index}
                hover
                glow
                className="p-6 text-center flex flex-col justify-between border-white/[0.08]"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6 shadow-glass">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2 font-display">
                    {method.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {method.description}
                  </p>
                </div>
                <div>
                  <div className="text-base text-emerald font-semibold mb-1 font-display">
                    {method.contact}
                  </div>
                  <div className="text-xs text-muted-foreground/70 mb-6">
                    {method.availability}
                  </div>
                  <Button
                    size="sm"
                    variant={method.action === "Start Chat" ? "glow" : "outline"}
                    className="w-full"
                    onClick={
                      method.action === "Start Chat"
                        ? handleLiveChat
                        : method.action === "Send Email"
                        ? handleSendEmail
                        : () => window.open(`tel:${method.contact.replace(/\s+/g, "")}`)
                    }
                  >
                    {method.action}
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Browse by Category Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold font-display text-foreground">Browse by Category</h2>
              <p className="text-sm text-muted-foreground mt-1">Select a topic to filter related questions</p>
            </div>
            {selectedCategory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-emerald border-emerald/20 hover:border-emerald hover:bg-emerald/5"
              >
                View All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => {
              const isSelected = selectedCategory === category.id;
              return (
                <GlassCard
                  key={index}
                  hover
                  className={cn(
                    "p-5 cursor-pointer border transition-all duration-300 flex flex-col justify-between h-full",
                    isSelected
                      ? "border-emerald/50 bg-emerald/[0.06] shadow-glow-sm"
                      : "border-white/[0.08] hover:border-emerald/30 hover:bg-white/[0.06]"
                  )}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          isSelected ? "bg-emerald text-white" : "bg-emerald/10 text-emerald"
                        )}
                      >
                        {category.icon}
                      </div>
                      {category.popular && (
                        <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px]">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-sm sm:text-base mb-2">
                      {category.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                      {category.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] mt-auto">
                    <span className="text-xs text-muted-foreground/80 font-medium">
                      {category.faqCount} FAQs
                    </span>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform duration-300",
                        isSelected ? "text-emerald translate-x-1" : "text-muted-foreground/50"
                      )}
                    />
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* FAQs Tabs Section */}
        <section id="faq-section" className="mb-20 scroll-mt-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display text-foreground">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground mt-2">Find instant answers to common booking and ground query topics</p>
          </div>

          {/* Fast Search Bar inside FAQ section */}
          <div className="max-w-2xl mx-auto mb-10 px-4 sm:px-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-emerald" />
              </div>
              <Input
                type="text"
                placeholder="Fast search within FAQs (e.g., refund, slots, rain...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    setSelectedCategory(null);
                    setActiveTab("all"); // Auto-switch to All Questions tab when typing
                  }
                }}
                className="pl-11 pr-10 py-3 h-12 text-sm bg-white/[0.02] border border-white/[0.08] rounded-xl focus:border-emerald focus:ring-2 focus:ring-emerald/20 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300 shadow-glass"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-white/[0.02] border border-white/[0.08] rounded-2xl mb-8">
              <TabsTrigger
                value="all"
                className="rounded-xl py-3 text-sm font-medium transition-all data-[state=active]:bg-emerald data-[state=active]:text-white"
              >
                All Questions
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="rounded-xl py-3 text-sm font-medium transition-all data-[state=active]:bg-emerald data-[state=active]:text-white"
              >
                Popular FAQs
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="rounded-xl py-3 text-sm font-medium transition-all data-[state=active]:bg-emerald data-[state=active]:text-white"
              >
                Recent Updates
              </TabsTrigger>
              <TabsTrigger
                value="category"
                className="rounded-xl py-3 text-sm font-medium transition-all data-[state=active]:bg-emerald data-[state=active]:text-white"
              >
                By Category
              </TabsTrigger>
            </TabsList>

            {/* ALL QUESTIONS TAB */}
            <TabsContent value="all" className="space-y-4 outline-none">
              <div className="max-w-4xl mx-auto space-y-4">
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq) => {
                    const isOpen = openFAQ === faq.id;
                    return (
                      <GlassCard
                        key={faq.id}
                        className={cn(
                          "overflow-hidden border transition-all duration-300",
                          isOpen ? "border-emerald/30 bg-white/[0.05]" : "border-white/[0.08]"
                        )}
                      >
                        <Collapsible
                          open={isOpen}
                          onOpenChange={() => setOpenFAQ(isOpen ? null : faq.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.01] transition-colors duration-200">
                              <div className="flex flex-col md:flex-row md:items-center gap-3">
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge className="bg-emerald/10 text-emerald border border-emerald/20 text-[10px]">
                                    {categories.find((c) => c.id === faq.category)?.title}
                                  </Badge>
                                  {faq.popular && (
                                    <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px]">
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                                <span className="font-display font-semibold text-foreground text-left text-sm sm:text-base leading-snug">
                                  {faq.question}
                                </span>
                              </div>
                              <div className="ml-4 shrink-0">
                                {isOpen ? (
                                  <ChevronDown className="w-5 h-5 text-emerald" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-muted-foreground/60" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-5 pb-5 pt-1 text-muted-foreground leading-relaxed text-sm sm:text-base border-t border-white/[0.04]">
                              {faq.answer}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </GlassCard>
                    );
                  })
                ) : (
                  <GlassCard className="p-12 text-center border-white/[0.08]">
                    <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
                      No matching answers found
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                      We couldn't find any results for "{searchQuery}". Try editing your query or search term, or select one of the core categories above.
                    </p>
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="text-emerald border-emerald/20 hover:border-emerald hover:bg-emerald/5"
                    >
                      Clear Filters
                    </Button>
                  </GlassCard>
                )}
              </div>
            </TabsContent>

            {/* POPULAR TAB */}
            <TabsContent value="popular" className="space-y-4 outline-none">
              <div className="max-w-4xl mx-auto space-y-4">
                {popularFAQs.map((faq) => {
                  const isOpen = openFAQ === faq.id;
                  return (
                    <GlassCard
                      key={faq.id}
                      className={cn(
                        "overflow-hidden border transition-all duration-300",
                        isOpen ? "border-emerald/30 bg-white/[0.05]" : "border-white/[0.08]"
                      )}
                    >
                      <Collapsible
                        open={isOpen}
                        onOpenChange={() => setOpenFAQ(isOpen ? null : faq.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.01] transition-colors duration-200">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px]">
                                  Popular
                                </Badge>
                                <Badge className="bg-emerald/10 text-emerald border border-emerald/20 text-[10px]">
                                  {categories.find((c) => c.id === faq.category)?.title}
                                </Badge>
                              </div>
                              <span className="font-display font-semibold text-foreground text-left text-sm sm:text-base leading-snug">
                                {faq.question}
                              </span>
                            </div>
                            <div className="ml-4 shrink-0">
                              {isOpen ? (
                                <ChevronDown className="w-5 h-5 text-emerald" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground/60" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-5 pb-5 pt-1 text-muted-foreground leading-relaxed text-sm sm:text-base border-t border-white/[0.04]">
                            {faq.answer}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </GlassCard>
                  );
                })}
              </div>
            </TabsContent>

            {/* RECENT TAB */}
            <TabsContent value="recent" className="space-y-4 outline-none">
              <div className="max-w-4xl mx-auto">
                <GlassCard className="p-12 text-center border-white/[0.08]">
                  <Clock className="w-12 h-12 text-emerald mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-semibold text-foreground mb-2 font-display">
                    Recent Updates & FAQs
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                    This section highlights newly added policy updates, tournament announcements, and seasonal rain-reschedule guidelines.
                  </p>
                  <Badge variant="outline" className="text-emerald border-emerald/20 bg-emerald/5 px-3 py-1">
                    Feature Coming Soon
                  </Badge>
                </GlassCard>
              </div>
            </TabsContent>

            {/* BY CATEGORY TAB */}
            <TabsContent value="category" className="space-y-4 outline-none">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categories.map((category) => (
                    <GlassCard
                      key={category.id}
                      className="border border-white/[0.08] p-6 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald/10 text-emerald shrink-0">
                            {category.icon}
                          </div>
                          <div>
                            <h4 className="font-display font-semibold text-foreground text-base sm:text-lg">
                              {category.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {category.faqCount} questions
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3 mb-6">
                          {faqs
                            .filter((faq) => faq.category === category.id)
                            .slice(0, 3)
                            .map((faq) => (
                              <div
                                key={faq.id}
                                className="text-sm text-muted-foreground cursor-pointer hover:text-emerald transition-colors flex items-start gap-2"
                                onClick={() => {
                                  setSelectedCategory(category.id);
                                  setOpenFAQ(faq.id);
                                  // Find and click 'All Questions' tab to show this category expanded
                                }}
                              >
                                <span className="text-emerald mt-1 shrink-0">•</span>
                                <span>{faq.question}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-emerald border-emerald/20 hover:border-emerald hover:bg-emerald/5"
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        View All {category.title} FAQs
                      </Button>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Bottom Banner Section */}
        <section className="mb-16">
          <GlassCard glow className="p-8 md:p-12 text-center border-emerald/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald/5 rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 font-display">
              Still Need Help?
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              Can't find what you're looking for? Our friendly support team is always ready to assist you with booking issues or ground questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="glow" size="lg" onClick={handleLiveChat} className="w-full sm:w-auto">
                <MessageCircle className="w-5 h-5 mr-2" />
                Start Live Chat
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleSendEmail}
                className="w-full sm:w-auto border-white/10 hover:border-emerald/30"
              >
                <Mail className="w-5 h-5 mr-2 text-emerald" />
                Send Email
              </Button>
            </div>
          </GlassCard>
        </section>
      </div>
      <LiveChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </PageShell>
  );
};

export default Help;
