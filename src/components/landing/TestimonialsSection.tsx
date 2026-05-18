import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Amit Sharma",
    city: "Mumbai",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    review:
      "Booking a ground was super easy and the facilities were top-notch! Highly recommend CricBox to all cricket lovers.",
    rating: 5,
  },
  {
    name: "Priya Verma",
    city: "Delhi",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    review:
      "Loved the instant confirmation and the variety of grounds available. The support team was very helpful!",
    rating: 5,
  },
  {
    name: "Rahul Singh",
    city: "Bangalore",
    photo: "https://randomuser.me/api/portraits/men/65.jpg",
    review:
      "The best platform for booking cricket grounds. The reviews and ratings helped me pick the perfect pitch.",
    rating: 5,
  },
  {
    name: "Sneha Patel",
    city: "Ahmedabad",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    review:
      "Great experience! The booking process was smooth and the ground was exactly as described.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const current = testimonials[index];

  return (
    <section className="section-padding">
      <div className="container-premium">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="heading-display text-3xl sm:text-4xl">What Players Say</h2>
          <p className="mt-3 text-muted-foreground">Trusted by thousands of cricket enthusiasts</p>
        </motion.div>

        <div className="relative mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard glow className="p-8 sm:p-10 text-center">
                <Quote className="mx-auto mb-4 h-8 w-8 text-emerald/40" />
                <p className="text-lg leading-relaxed text-foreground/90 mb-6">
                  "{current.review}"
                </p>
                <div className="flex justify-center gap-1 mb-4">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <img
                    src={current.photo}
                    alt={current.name}
                    className="h-12 w-12 rounded-full ring-2 ring-emerald/30 object-cover"
                  />
                  <div className="text-left">
                    <p className="font-semibold">{current.name}</p>
                    <p className="text-sm text-muted-foreground">{current.city}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="glass"
              size="icon"
              onClick={() => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-emerald" : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="glass"
              size="icon"
              onClick={() => setIndex((prev) => (prev + 1) % testimonials.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
