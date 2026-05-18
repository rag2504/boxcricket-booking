import { motion } from "framer-motion";

const images = [
  {
    src: "https://images.unsplash.com/photo-1531418845092-fd31986849a4?auto=format&fit=crop&w=600&q=80",
    tall: true,
  },
  {
    src: "https://images.unsplash.com/photo-1624526267949-4c40d832ab3f?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
  {
    src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50c?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
  {
    src: "https://images.unsplash.com/photo-1540747913346-19eb32f3d0e7?auto=format&fit=crop&w=600&q=80",
    tall: true,
  },
  {
    src: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
  {
    src: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
];

export function AboutGallery() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="gallery-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400">
            Gallery
          </p>
          <h2
            id="gallery-heading"
            className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl"
          >
            Under the stadium lights
          </h2>
        </motion.div>

        <div className="columns-2 gap-4 sm:columns-3 lg:gap-5">
          {images.map((img, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`group relative mb-4 break-inside-avoid overflow-hidden rounded-xl border border-white/10 ${
                img.tall ? "sm:mb-5" : ""
              }`}
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-transparent to-orange-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <motion.img
                src={img.src}
                alt={`Box cricket moment ${i + 1}`}
                className={`w-full object-cover ${img.tall ? "aspect-[3/4]" : "aspect-square"}`}
                loading="lazy"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0">
                <span className="text-xs font-medium text-emerald-400">
                  Match Day #{i + 1}
                </span>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
