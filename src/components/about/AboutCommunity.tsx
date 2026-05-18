import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

const testimonials = [
  {
    name: "Arjun Mehta",
    role: "Weekend League Captain",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "CricBox changed how our office team books turfs. No more WhatsApp chaos — just pick a slot and play.",
  },
  {
    name: "Sneha Reddy",
    role: "All-rounder, Hyderabad",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Premium grounds, fair prices, and instant booking. This is what cricket booking should feel like.",
  },
  {
    name: "Vikram Singh",
    role: "Tournament Organizer",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
    text: "Hosted three corporate tournaments through CricBox. Scheduling and payments were flawless.",
  },
];

const communityStats = [
  { end: 12000, suffix: "+", label: "Active Players" },
  { end: 98, suffix: "%", label: "Happy Bookings" },
  { end: 24, suffix: "/7", label: "Support" },
];

export function AboutCommunity() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="community-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Community
          </p>
          <h2
            id="community-heading"
            className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl"
          >
            Join the CricBox family
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
            Thousands of players trust us for their next big match.
          </p>
        </motion.div>

        <div className="mt-12 flex flex-wrap justify-center gap-8">
          {communityStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-3xl font-bold text-emerald-400">
                <AnimatedCounter end={stat.end} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
            >
              <Quote className="absolute right-4 top-4 h-8 w-8 text-emerald-500/20" />
              <motion.div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-orange-400 text-orange-400"
                  />
                ))}
              </motion.div>
              <p className="mt-4 text-zinc-300">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-12 w-12 rounded-full border-2 border-emerald-500/50 object-cover"
                />
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-sm text-zinc-500">{t.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center -space-x-3"
        >
          {testimonials.map((t) => (
            <img
              key={t.name}
              src={t.avatar}
              alt=""
              className="h-10 w-10 rounded-full border-2 border-[#0a0f0d] object-cover"
            />
          ))}
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0a0f0d] bg-emerald-500 text-xs font-bold text-white">
            +10k
          </span>
        </motion.div>
      </div>
    </section>
  );
}
