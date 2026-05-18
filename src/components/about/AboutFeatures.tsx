import { motion } from "framer-motion";
import { Bell, Smartphone, Trophy, Users, Zap } from "lucide-react";

const features = [
  {
    title: "Team Matchmaking",
    description:
      "Find players at your skill level, form squads, and fill empty slots before match day.",
    image:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
    icon: Users,
    reverse: false,
  },
  {
    title: "Tournament Hosting",
    description:
      "Run corporate cups, weekend leagues, or knockout tournaments with brackets and scheduling built in.",
    image:
      "https://images.unsplash.com/photo-1540747913346-19eb32f3d0e7?auto=format&fit=crop&w=800&q=80",
    icon: Trophy,
    reverse: true,
  },
  {
    title: "Live Score Tracking",
    description:
      "Keep every ball counted with live scores your team and fans can follow in real time.",
    image:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80",
    icon: Zap,
    reverse: false,
  },
  {
    title: "Mobile Friendly Experience",
    description:
      "Book turfs, manage bookings, and get updates — all optimized for your phone on the go.",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
    icon: Smartphone,
    reverse: true,
  },
  {
    title: "Instant Notifications",
    description:
      "Booking confirmations, match reminders, and payment alerts — never miss a game again.",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    icon: Bell,
    reverse: false,
  },
];

export function AboutFeatures() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Platform Features
          </p>
          <h2
            id="features-heading"
            className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl"
          >
            Built for modern cricket
          </h2>
        </motion.div>

        <div className="space-y-20 sm:space-y-28">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                feature.reverse ? "lg:[direction:rtl]" : ""
              }`}
            >
              <motion.div className={feature.reverse ? "lg:[direction:ltr]" : ""}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/10">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0d] via-transparent to-transparent opacity-60" />
                </div>
              </motion.div>

              <motion.div className={feature.reverse ? "lg:[direction:ltr]" : ""}>
                <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
                <motion.div
                  className="mt-6 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-orange-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: 64 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
