import { motion } from "framer-motion";
import { Eye, Rocket } from "lucide-react";

const cards = [
  {
    icon: Eye,
    title: "Our Vision",
    gradient: "from-emerald-500/20 via-emerald-600/10 to-transparent",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
    content:
      "To become India's most trusted box cricket ecosystem — where every player, from gully cricket heroes to corporate league stars, finds their perfect turf and community.",
  },
  {
    icon: Rocket,
    title: "Our Mission",
    gradient: "from-orange-500/20 via-orange-600/10 to-transparent",
    border: "border-orange-500/20",
    glow: "shadow-orange-500/10",
    content:
      "To democratize access to quality cricket facilities through technology — seamless booking, fair pricing, secure payments, and unforgettable match-day experiences for all.",
  },
];

export function AboutVisionMission() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="vision-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.h2
          id="vision-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center font-display text-3xl font-bold text-white sm:text-4xl"
        >
          Vision & Mission
        </motion.h2>

        <motion.div className="grid gap-8 md:grid-cols-2">
          {cards.map((card, i) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ scale: 1.02 }}
              className={`relative overflow-hidden rounded-3xl border ${card.border} bg-gradient-to-br ${card.gradient} p-8 backdrop-blur-xl sm:p-10 shadow-xl ${card.glow}`}
            >
              <motion.div
                className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <div className="relative">
                <div className="mb-6 inline-flex rounded-2xl bg-black/30 p-4">
                  <card.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white">
                  {card.title}
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-zinc-400">
                  {card.content}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
