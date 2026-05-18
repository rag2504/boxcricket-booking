import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Menu,
  X,
  User,
  MapPin,
  LogOut,
  Heart,
  BookOpen,
  Bell,
  Home,
  Info,
  HelpCircle,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCity } from "@/contexts/CityContext";
import AuthModal from "./AuthModal";
import NotificationPanel from "./NotificationPanel";
import LocationSelector from "./LocationSelector";

interface NavbarProps {
  selectedCity?: string;
  onCitySelect?: () => void;
  onSearch?: (query: string) => void;
  onFilterToggle?: () => void;
}

const Navbar = ({
  selectedCity: selectedCityLabel,
  onCitySelect,
  onSearch,
  onFilterToggle,
}: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [scrolled, setScrolled] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const {
    selectedCity: contextCity,
    setSelectedCity,
    isLocationSelectorOpen,
    setLocationSelectorOpen,
  } = useCity();
  const navigate = useNavigate();
  const location = useLocation();

  const displayCityName = selectedCityLabel || contextCity?.name || "Select City";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleAuthClick = (tab: "login" | "register") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleCityClick = () => {
    if (onCitySelect) {
      onCitySelect();
      return;
    }
    setLocationSelectorOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "About", path: "/about", icon: Info },
    { name: "Help", path: "/help", icon: HelpCircle },
  ];

  const getUserInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "py-2" : "py-4",
        )}
      >
        <nav
          className={cn(
            "mx-auto max-w-7xl px-4 sm:px-6 transition-all duration-300",
            scrolled
              ? "rounded-2xl border border-white/[0.08] bg-background/80 backdrop-blur-xl shadow-glass"
              : "bg-transparent",
          )}
        >
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="group flex shrink-0 items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-emerald/30 blur-md opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-emerald-light shadow-glow-sm">
                  <span className="font-display text-sm font-bold text-white">CB</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-display text-lg font-bold tracking-tight text-foreground">
                  CricBox
                </span>
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Book · Play · Win
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                    location.pathname === item.path
                      ? "text-emerald"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.name}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-emerald/10 border border-emerald/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={handleCityClick}
                className="gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-emerald" />
                <span className="max-w-[120px] truncate">
                  {displayCityName}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>

              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search grounds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-52 pl-9 h-9"
                />
              </form>

              {onFilterToggle && (
                <Button variant="glass" size="icon" onClick={onFilterToggle}>
                  <Filter className="h-4 w-4" />
                </Button>
              )}

              {isAuthenticated && user ? (
                <div className="flex items-center gap-2 ml-1">
                  <NotificationPanel />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2 pl-2 pr-3 h-10">
                        <Avatar className="h-8 w-8 ring-2 ring-emerald/20">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-emerald text-white text-xs font-bold">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden lg:block text-sm font-medium max-w-[80px] truncate">
                          {user.name.split(" ")[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 glass border-white/10 bg-background/95 backdrop-blur-xl"
                    >
                      <div className="px-3 py-3 border-b border-white/10">
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <User className="mr-2 h-4 w-4" /> My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/profile/bookings")}>
                        <BookOpen className="mr-2 h-4 w-4" /> My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/favorites")}>
                        <Heart className="mr-2 h-4 w-4" /> Favorites
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/notifications")}>
                        <Bell className="mr-2 h-4 w-4" /> Notifications
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        <Settings className="mr-2 h-4 w-4" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-400 focus:text-red-400"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-1">
                  <Button variant="ghost" size="sm" onClick={() => handleAuthClick("login")}>
                    Login
                  </Button>
                  <Button variant="glow" size="sm" onClick={() => handleAuthClick("register")}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <Button
              variant="glass"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[min(100vw-3rem,320px)] border-l border-white/10 bg-background/95 backdrop-blur-xl md:hidden overflow-y-auto"
            >
              <div className="flex flex-col gap-6 p-6 pt-24">
                <Button variant="glass" onClick={handleCityClick} className="justify-start gap-3 h-12">
                  <MapPin className="h-4 w-4 text-emerald" />
                  {displayCityName}
                </Button>

                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search grounds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </form>

                {onFilterToggle && (
                  <Button variant="outline" onClick={onFilterToggle} className="gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </Button>
                )}

                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        location.pathname === item.path
                          ? "bg-emerald/10 text-emerald"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>

                {isAuthenticated && user ? (
                  <div className="space-y-1 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                      <Avatar className="h-10 w-10 ring-2 ring-emerald/20">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-emerald text-white text-sm">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    {[
                      { label: "Profile", path: "/profile", icon: User },
                      { label: "Bookings", path: "/profile/bookings", icon: BookOpen },
                      { label: "Favorites", path: "/favorites", icon: Heart },
                      { label: "Notifications", path: "/notifications", icon: Bell },
                      { label: "Settings", path: "/settings", icon: Settings },
                    ].map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      >
                        <item.icon className="h-4 w-4 text-emerald" />
                        {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
                    <Button variant="outline" onClick={() => handleAuthClick("login")}>
                      Login
                    </Button>
                    <Button variant="glow" onClick={() => handleAuthClick("register")}>
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-[88px]" aria-hidden />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      {!onCitySelect && (
        <LocationSelector
          isOpen={isLocationSelectorOpen}
          onClose={() => setLocationSelectorOpen(false)}
          onCitySelect={setSelectedCity}
          selectedCity={contextCity}
        />
      )}
    </>
  );
};

export default Navbar;
