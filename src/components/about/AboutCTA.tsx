import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutCTA() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-[#0d1410] to-orange-600/20 px-6 py-16 text-center sm:px-12 sm:py-20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.15),transparent_70%)]" />
          <motion.div
            className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-orange-500/20 blur-3xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />

          <div className="relative z-10">
            <h2
              id="cta-heading"
              className="font-display text-3xl font-bold text-white sm:text-4xl md:text-5xl"
            >
              Ready to Play Your Next Match?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              Book a premium turf in minutes. Your team is waiting.
            </p>
            <motion.div
              className="mt-10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                asChild
                size="lg"
                className="h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-10 text-lg font-bold shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)]"
              >
                <Link to="/">
                  Book Your Turf Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
