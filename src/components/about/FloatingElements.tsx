import { motion } from "framer-motion";

export function FloatingElements() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 5) % 100}%`,
    top: `${(i * 23 + 10) % 100}%`,
    size: 2 + (i % 4),
    delay: i * 0.15,
  }));

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-emerald-400/30"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            y: [0, -30, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 4 + (p.id % 3),
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}

      <motion.div
        className="absolute -right-8 top-1/4 h-16 w-16 rounded-full border-2 border-dashed border-orange-500/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="absolute left-[8%] top-[55%] text-4xl opacity-[0.07] sm:text-6xl"
        animate={{
          y: [0, -24, 0],
          rotate: [0, 15, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        🏏
      </motion.div>

      <motion.div
        className="absolute right-[12%] bottom-[20%] h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-orange-500/20 blur-xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </motion.div>
  );
}
