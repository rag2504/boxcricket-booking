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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      <div className="text-center">
        <div className="relative mx-auto mb-8 h-20 w-20">
          <div className="absolute inset-0 rounded-2xl bg-emerald/20 blur-xl animate-pulse-glow" />
          <div className="relative flex h-full w-full items-center justify-center rounded-2xl glass border-emerald/30">
            <span className="font-display text-2xl font-bold gradient-text">CB</span>
          </div>
          <div className="absolute -inset-1 rounded-2xl border border-emerald/20 animate-spin-slow" />
        </div>
        <h2 className="heading-display text-xl mb-2">{message}</h2>
        <p className="text-muted-foreground text-sm">{submessage}</p>
        <div className="mt-6 mx-auto h-1 w-48 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald/50 via-emerald to-emerald/50"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
