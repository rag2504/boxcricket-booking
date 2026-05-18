import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function RouteLoader() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="route-loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-sm"
        >
          {/* Spinning ring loader */}
          <div className="relative flex items-center justify-center">
            {/* Outer glow */}
            <div className="absolute h-24 w-24 rounded-full bg-emerald/20 blur-xl animate-pulse" />

            {/* Spinning ring */}
            <svg
              className="h-20 w-20 animate-spin"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ animationDuration: "0.9s" }}
            >
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="4"
                className="text-white/5"
              />
              <path
                d="M40 6 A34 34 0 0 1 74 40"
                stroke="url(#grad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="grad" x1="40" y1="6" x2="74" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22c55e" stopOpacity="0" />
                  <stop offset="1" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center logo */}
            <div className="absolute flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-emerald-light shadow-glow-sm">
              <span className="font-display text-sm font-bold text-white">CB</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
