import { Home, Search, Calendar, User, Heart } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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

  const filteredItems = navItems.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  );

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-pb pointer-events-none"
      aria-label="Mobile navigation"
    >
      <div
        className={cn(
          "relative pointer-events-auto mx-auto max-w-lg",
          "rounded-2xl border border-white/[0.08]",
          "bg-background/70 backdrop-blur-2xl shadow-glass-lg",
          "ring-1 ring-white/[0.04]",
        )}
      >
        {/* Top highlight edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-2xl pointer-events-none" />

        <div className="relative flex items-stretch h-[4.25rem] px-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-x-1.5 inset-y-1.5 rounded-xl bg-emerald/10 border border-emerald/20 shadow-glow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <motion.div
                  className="relative z-10"
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors duration-200",
                      isActive ? "text-emerald" : "text-muted-foreground",
                    )}
                    strokeWidth={isActive ? 2.25 : 2}
                  />

                  {item.badge != null && item.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.5)] ring-2 ring-background/80"
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </motion.span>
                  )}
                </motion.div>

                <motion.span
                  className={cn(
                    "relative z-10 text-[10px] font-medium tracking-wide transition-colors duration-200",
                    isActive ? "text-emerald" : "text-muted-foreground",
                  )}
                  animate={{ opacity: isActive ? 1 : 0.75 }}
                >
                  {item.label}
                </motion.span>

                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-0.5 h-0.5 w-4 rounded-full bg-emerald shadow-glow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default MobileBottomNav;
