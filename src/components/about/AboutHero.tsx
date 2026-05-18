import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1531418845092-fd31986849a4?auto=format&fit=crop&w=1920&q=80";

export function AboutHero() {
  const scrollToStory = () => {
    document.getElementById("our-story")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
      aria-label="Hero"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d]/90 via-[#0d1410]/85 to-[#0a0f0d]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,197,94,0.15),transparent_55%)]" />
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        animate={{ backgroundPosition: ["0px 0px", "48px 48px"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-28 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          India&apos;s Premium Box Cricket Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Where Passion{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-orange-400 bg-clip-text text-transparent">
            Meets Cricket
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg md:text-xl"
        >
          CricBox brings cricket lovers together — book premium turfs, schedule
          matches, and build your community. Play more. Stress less.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="h-12 min-w-[160px] rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 text-base font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-emerald-500/50"
          >
            <Link to="/">
              <Calendar className="mr-2 h-5 w-5" />
              Book Turf
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 min-w-[160px] rounded-xl border-orange-500/50 bg-orange-500/10 px-8 text-base font-semibold text-orange-300 backdrop-blur-sm hover:bg-orange-500/20 hover:text-orange-200"
          >
            <Link to="/profile/bookings">
              <Play className="mr-2 h-5 w-5" />
              Explore Matches
            </Link>
          </Button>
        </motion.div>
      </div>

      <motion.button
        type="button"
        onClick={scrollToStory}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1 },
          y: { duration: 2, repeat: Infinity },
        }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-500 hover:text-emerald-400"
        aria-label="Scroll to our story"
      >
        <span className="text-xs uppercase tracking-widest">Discover</span>
        <ChevronDown className="h-6 w-6" />
      </motion.button>
    </section>
  );
}
