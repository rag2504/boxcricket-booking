import { motion } from "framer-motion";
import { fadeInUp, defaultTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  withMesh?: boolean;
}

const PageShell = ({ children, className, withMesh = true }: PageShellProps) => {
  return (
    <div className={cn("min-h-screen relative", withMesh && "mesh-bg", className)}>
      <div className="absolute inset-0 noise-overlay pointer-events-none opacity-50" />
      <motion.main
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={defaultTransition}
        className="relative z-10"
      >
        {children}
      </motion.main>
    </div>
  );
};

export default PageShell;
