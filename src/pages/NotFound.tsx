import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/layout/PageShell";
import Navbar from "@/components/Navbar";
import { GlassCard } from "@/components/ui/glass-card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageShell>
      <Navbar />
      <section className="flex min-h-[70vh] items-center justify-center section-padding">
        <div className="container-premium max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard glow className="p-10 sm:p-14">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-display text-8xl sm:text-9xl font-bold gradient-text leading-none"
              >
                404
              </motion.p>
              <h1 className="heading-display mt-4 text-2xl sm:text-3xl">
                Page Not Found
              </h1>
              <p className="mt-3 text-muted-foreground">
                The page <code className="text-emerald/80">{location.pathname}</code> doesn't exist or has been moved.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="glow" size="lg" asChild>
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
};

export default NotFound;
