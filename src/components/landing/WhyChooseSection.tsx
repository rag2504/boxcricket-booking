import { motion } from "framer-motion";
import { Zap, ShieldCheck, Lock, Headphones } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { staggerContainer, staggerItem } from "@/lib/motion";

const features = [
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Book your slot instantly with real-time availability updates",
  },
  {
    icon: ShieldCheck,
    title: "Verified Grounds",
    description: "Every ground is verified for quality, safety, and amenities",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Razorpay-powered payments with bank-grade encryption",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round-the-clock customer support for any queries",
  },
];

const WhyChooseSection = () => (
  <section className="section-padding relative">
    <div className="absolute inset-0 bg-gradient-to-b from-emerald/5 via-transparent to-transparent pointer-events-none" />
    <div className="container-premium relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="heading-display text-3xl sm:text-4xl">Why Choose CricBox?</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Built for players who demand the best booking experience
        </p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={staggerItem}>
            <GlassCard hover className="p-6 text-center h-full">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10 border border-emerald/20">
                <feature.icon className="h-5 w-5 text-emerald" />
              </div>
              <h3 className="font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default WhyChooseSection;
