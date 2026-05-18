import { motion } from "framer-motion";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  MapPin,
  Shield,
  Wallet,
} from "lucide-react";

const items = [
  {
    icon: CalendarCheck,
    title: "Easy Turf Booking",
    description: "Book your slot in seconds with real-time availability and instant confirmation.",
    color: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Clock,
    title: "Live Match Scheduling",
    description: "Schedule friendly matches or tournaments with smart time-slot management.",
    color: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-400",
  },
  {
    icon: Wallet,
    title: "Affordable Pricing",
    description: "Transparent rates, no hidden fees — cricket that fits your budget.",
    color: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: MapPin,
    title: "Professional Grounds",
    description: "Verified turfs with quality pitches, lighting, and amenities you can trust.",
    color: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-400",
  },
  {
    icon: Shield,
    title: "Real-time Availability",
    description: "See open slots live and never double-book your favourite ground again.",
    color: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: CreditCard,
    title: "Secure Online Payments",
    description: "Pay safely via Razorpay with UPI, cards, and net banking support.",
    color: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-400",
  },
];

export function AboutWhyChoose() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="why-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
            Why CricBox
          </p>
          <h2
            id="why-heading"
            className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl"
          >
            Why Choose Us
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
            Everything you need to play, book, and win — in one premium platform.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -8 }}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${item.color} p-6 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10`}
            >
              <motion.div
                className={`mb-4 inline-flex rounded-xl bg-black/30 p-3 ${item.iconColor}`}
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                <item.icon className="h-7 w-7" />
              </motion.div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {item.description}
              </p>
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl transition-opacity group-hover:opacity-100 opacity-0" />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
