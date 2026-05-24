import { motion } from "framer-motion";

interface PageLoaderProps {
  message?: string;
  submessage?: string;
}

export function PageLoader({
  message = "Loading CricBox",
  submessage = "Preparing your experience...",
}: PageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-emerald/20 blur-2xl animate-pulse" />

          {/* Outer spinning ring */}
          <svg
            className="h-24 w-24"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="3" className="text-white/5" />
            <motion.path
              d="M48 6 A42 42 0 1 1 6 48"
              stroke="url(#pageGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "48px 48px" }}
            />
            <defs>
              <linearGradient id="pageGrad" x1="48" y1="6" x2="6" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22c55e" stopOpacity="0" />
                <stop offset="1" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner spinning ring (counter) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute h-14 w-14 rounded-full border-2 border-dashed border-emerald/20"
          />

          {/* Center logo */}
          <div className="absolute flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden border border-white/10 shadow-glow-sm">
            <img src="/newLogo.jpeg" alt="CricBox Logo" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="heading-display text-xl mb-1"
          >
            {message}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground text-sm"
          >
            {submessage}
          </motion.p>
        </div>

        {/* Progress bar */}
        <div className="mx-auto h-0.5 w-48 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald/40 via-emerald to-emerald/40"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
