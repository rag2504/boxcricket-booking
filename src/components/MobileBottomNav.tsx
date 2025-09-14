import { Home, Search, Calendar, User, Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface MobileBottomNavProps {
  notifications?: number;
}

const MobileBottomNav = ({ notifications = 0 }: MobileBottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
      requiresAuth: false,
    },
    {
      icon: Search,
      label: "Search",
      path: "/search",
      requiresAuth: false,
    },
    {
      icon: Calendar,
      label: "Bookings",
      path: "/profile/bookings",
      requiresAuth: true,
      badge: notifications,
    },
    {
      icon: Heart,
      label: "Favorites",
      path: "/favorites",
      requiresAuth: true,
    },
    {
      icon: User,
      label: "Profile",
      path: "/profile",
      requiresAuth: true,
    },
  ];

  const filteredItems = navItems.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="grid grid-cols-5 h-16">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center p-2 transition-all duration-200 relative",
                isActive
                  ? "text-cricket-green bg-cricket-green/5"
                  : "text-gray-600 hover:text-cricket-green hover:bg-gray-50"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                isActive && "text-cricket-green"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-cricket-green rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
