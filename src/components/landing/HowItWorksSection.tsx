import { motion } from "framer-motion";
import { Search, Calendar, CreditCard } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { staggerContainer, staggerItem } from "@/lib/motion";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Search & Select",
    description:
      "Find cricket grounds near you. Filter by location, price, and amenities to find your perfect pitch.",
  },
  {
    icon: Calendar,
    step: "02",
    title: "Choose Time Slot",
    description:
      "Pick your preferred date and time from real-time availability. Live slot updates as you browse.",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Book & Play",
    description:
      "Complete secure payment and get instant confirmation. Show up and enjoy your game!",
  },
];

const HowItWorksSection = () => (
  <section className="section-padding">
    <div className="container-premium">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="heading-display text-3xl sm:text-4xl">How It Works</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Book your cricket ground in three simple steps
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {steps.map((item, index) => (
          <motion.div key={item.step} variants={staggerItem}>
            <GlassCard hover className="relative p-8 h-full">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-emerald/50 to-transparent z-10" />
              )}
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10 border border-emerald/20">
                  <item.icon className="h-5 w-5 text-emerald" />
                </div>
                <span className="font-display text-sm font-bold text-emerald/60">
                  {item.step}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default HowItWorksSection;
