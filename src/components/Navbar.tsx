import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, Menu, X, User, MapPin, LogOut, Heart, BookOpen, Bell, Home, Info, HelpCircle, Settings } from "lucide-react";
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
import AuthModal from "./AuthModal";
import NotificationPanel from "./NotificationPanel";

interface NavbarProps {
  selectedCity?: string;
  onCitySelect?: () => void;
  onSearch?: (query: string) => void;
  onFilterToggle?: () => void;
}

const Navbar = ({
  selectedCity,
  onCitySelect,
  onSearch,
  onFilterToggle,
}: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
    "login",
  );

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleAuthClick = (tab: "login" | "register") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "About Us", path: "/about", icon: Info },
    { name: "Help & Support", path: "/help", icon: HelpCircle },
  ];

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* BoxCric Logo - Positioned at the far left */}
            <div className="flex-shrink-0 mr-4">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-cricket rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-md">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-cricket-green rounded-md"></div>
                  </div>
                </div>
                <div className="text-left">
                  <h1 className="text-xl sm:text-2xl font-bold font-display text-cricket-green group-hover:text-cricket-green/80 transition-colors">
                    BoxCric
                  </h1>
                  <p className="hidden xs:block text-xs text-gray-500 -mt-0.5 sm:-mt-1 font-medium">Book. Play. Win.</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Centered */}
            <div className="hidden md:flex items-center space-x-4 lg:space-x-8 flex-1 justify-center">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="text-gray-700 hover:text-cricket-green transition-colors duration-200 font-medium relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cricket-green transition-all duration-200 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Mobile menu button placeholder - actual menu is at the bottom */}

            {/* Search Bar and Actions - Right side */}
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              {/* Location Selector */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCitySelect}
                className="flex items-center space-x-2 hover:bg-cricket-green/5 hover:border-cricket-green/20 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{selectedCity || "Select City"}</span>
              </Button>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search grounds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-72 pl-10 pr-4 border-gray-200 focus:border-cricket-green focus:ring-cricket-green/20"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>

              {/* Filter */}
              {onFilterToggle && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onFilterToggle}
                  className="flex items-center space-x-2 hover:bg-cricket-green/5 hover:border-cricket-green/20 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden lg:inline">Filters</span>
                </Button>
              )}

              {/* Auth Section */}
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  {/* New Notification Panel */}
                  <NotificationPanel />
                  
                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-3 h-10 hover:bg-gray-100"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-cricket-green text-white text-sm font-semibold">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:block text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name.split(" ")[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-cricket-green text-white">
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </div>
                      <DropdownMenuItem onClick={() => navigate("/profile")}>
                        <User className="w-4 h-4 mr-3" />
                        My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/profile/bookings")}>
                        <BookOpen className="w-4 h-4 mr-3" />
                        My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/favorites")}>
                        <Heart className="w-4 h-4 mr-3" />
                        Favorites
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/settings")}>
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAuthClick("login")}
                    className="hover:text-cricket-green transition-colors"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="bg-cricket-green hover:bg-cricket-green/90 text-white font-semibold px-6"
                    onClick={() => handleAuthClick("register")}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`md:hidden flex items-center justify-center p-3 rounded-full transition-colors shadow-md absolute top-3 right-4 z-[201] ${
                isMenuOpen 
                  ? "bg-cricket-green text-white hover:bg-cricket-green/90" 
                  : "bg-white hover:bg-cricket-green/10 text-cricket-green border border-gray-200"
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMenuOpen ? (
                <X className="w-7 h-7" />
              ) : (
                <Menu className="w-7 h-7" />
              )}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-[200] overflow-y-auto bg-white/95 backdrop-blur-lg shadow-xl">
              <div className="space-y-6 px-4 py-6 pt-20 max-h-screen overflow-y-auto relative">

                {/* Mobile Location and Filter */}
                <div className="flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={onCitySelect}
                    className="flex items-center justify-center space-x-3 py-3 h-12"
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="text-base font-medium">
                      {selectedCity || "Select City"}
                    </span>
                  </Button>
                  {onFilterToggle && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={onFilterToggle}
                      className="flex items-center justify-center space-x-3 py-3 h-12"
                    >
                      <Filter className="w-5 h-5" />
                      <span className="text-base">Filters</span>
                    </Button>
                  )}
                </div>

                {/* Mobile Auth */}
                {isAuthenticated && user ? (
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    {/* User Info at Top */}
                    <div className="flex items-center space-x-4 px-4 py-3 bg-gray-50 rounded-lg">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-cricket-green text-white font-semibold text-lg">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 text-base">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    {/* Combined Navigation Items */}
                    <div className="grid grid-cols-1 gap-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="flex items-center px-4 py-4 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-lg transition-colors duration-200 font-medium text-base shadow-sm border border-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <item.icon className="w-5 h-5 mr-3 text-cricket-green" />
                          {item.name}
                        </Link>
                      ))}
                    </div>

                    {/* User-specific links */}
                    <div className="grid grid-cols-1 gap-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-4 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-lg transition-colors duration-200 text-base shadow-sm border border-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-5 h-5 mr-3 text-cricket-green" />
                        My Profile
                      </Link>
                      <Link
                        to="/profile/bookings"
                        className="flex items-center px-4 py-4 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-lg transition-colors duration-200 text-base shadow-sm border border-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BookOpen className="w-5 h-5 mr-3 text-cricket-green" />
                        My Bookings
                      </Link>
                      <Link
                        to="/favorites"
                        className="flex items-center px-4 py-4 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-lg transition-colors duration-200 text-base shadow-sm border border-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Heart className="w-5 h-5 mr-3 text-cricket-green" />
                        Favorites
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-4 text-gray-700 hover:text-cricket-green hover:bg-gray-50 rounded-lg transition-colors duration-200 text-base shadow-sm border border-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5 mr-3 text-cricket-green" />
                        Settings
                      </Link>
                    </div>

                    <div className="border-t border-gray-200 my-2"></div>

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center w-full text-left px-4 py-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 text-base shadow-sm border border-red-100 mt-2"
                    >
                      <LogOut className="w-5 h-5 mr-3 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="lg"
                      className="py-3 h-12 text-base shadow-sm border border-gray-200 hover:border-cricket-green/50 hover:text-cricket-green transition-all"
                      onClick={() => {
                        handleAuthClick("login");
                        setIsMenuOpen(false);
                      }}
                    >
                      <User className="w-5 h-5 mr-3 text-cricket-green" />
                      Login
                    </Button>
                    <Button
                      size="lg"
                      className="py-3 h-12 bg-cricket-green hover:bg-cricket-green/90 text-white font-semibold text-base shadow-sm"
                      onClick={() => {
                        handleAuthClick("register");
                        setIsMenuOpen(false);
                      }}
                    >
                      <User className="w-5 h-5 mr-3 text-white" />
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </>
  );
};

export default Navbar;