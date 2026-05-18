import { motion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";

const STORY_IMAGE =
  "https://images.unsplash.com/photo-1624526267949-4c40d832ab3f?auto=format&fit=crop&w=800&q=80";

const stats = [
  { value: 10000, suffix: "+", label: "Players" },
  { value: 500, suffix: "+", label: "Matches Played" },
  { value: 50, suffix: "+", label: "Premium Turfs" },
  { value: 4.9, suffix: "", label: "Rating", decimals: 1 },
];

export function AboutStory() {
  return (
    <section
      id="our-story"
      className="relative py-20 sm:py-28"
      aria-labelledby="story-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-orange-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <img
                src={STORY_IMAGE}
                alt="Players enjoying box cricket on turf"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <motion.div
                className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-sm font-medium text-emerald-400">Community First</p>
                <p className="text-sm text-zinc-300">
                  Built for weekend warriors, league teams, and cricket fanatics.
                </p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Our Story
            </p>
            <h2
              id="story-heading"
              className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl"
            >
              Born from a love of the game
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400">
              CricBox started when a group of friends struggled to find quality
              box cricket turfs at fair prices. We built a platform that makes
              cricket accessible, fun, and friction-free for everyone.
            </p>
            <p className="mt-4 text-zinc-500">
              Our mission is simple: connect players with professional grounds,
              enable live scheduling, and grow a community where every match
              feels like a tournament final.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-shadow hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                    <AnimatedCounter
                      end={stat.value}
                      suffix={stat.suffix}
                      decimals={stat.decimals ?? 0}
                    />
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
