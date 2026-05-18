import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";

const recentBookings = [
  "Amit booked Marine Drive Arena, Mumbai",
  "Priya booked Andheri Sports Complex, Mumbai",
  "Rahul booked Powai Cricket Club, Mumbai",
  "Sneha booked Delhi Cricket Stadium, Delhi",
  "Vikram booked Eden Gardens, Kolkata",
  "Anjali booked Chinnaswamy Stadium, Bangalore",
];

const BookingTicker = () => {
  const items = [...recentBookings, ...recentBookings];

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-3">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((booking, i) => (
          <span
            key={i}
            className="mx-8 inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald shrink-0" />
            {booking}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BookingTicker;
