import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { staggerContainer, staggerItem } from "@/lib/motion";

const Footer = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const services = [
    "Ground Booking",
    "Team Management",
    "Match Scheduling",
    "Online Payments",
    "Player Stats",
    "Tournaments",
  ];

  const quickLinks = [
    { text: "About Us", path: "/about" },
    { text: "Help & Support", path: "/help" },
    { text: "My Bookings", path: "/profile/bookings" },
    { text: "Settings", path: "/settings" },
    { text: "Home", path: "/" },
  ];

  const socialLinks = [
    { Icon: Facebook, label: "Facebook" },
    { Icon: Instagram, label: "Instagram" },
    { Icon: Twitter, label: "Twitter" },
    { Icon: Youtube, label: "YouTube" },
  ];

  const FooterSection = ({
    title,
    id,
    children,
  }: {
    title: string;
    id: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-white/10 pb-2 md:border-0 md:pb-0">
      <button
        onClick={() => toggleSection(id)}
        className="flex w-full items-center justify-between py-3 text-left font-display font-semibold md:pointer-events-none md:cursor-default"
      >
        {title}
        <span className="md:hidden">
          {expandedSection === id ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>
      <div className={`${expandedSection === id ? "block" : "hidden"} md:block pb-4 md:pb-0`}>
        {children}
      </div>
    </div>
  );

  return (
    <footer className="relative mt-24 border-t border-white/10 bg-background">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald/50 to-transparent" />

      <div className="container-premium section-padding pb-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={staggerItem}>
            <FooterSection title="About CricBox" id="about">
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                CricBox is your premium platform to discover, compare, and book the best box
                cricket grounds. Seamless booking, verified reviews, and exclusive offers.
              </p>
              <div className="flex gap-2">
                {socialLinks.map(({ Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground transition-all hover:border-emerald/30 hover:bg-emerald/10 hover:text-emerald"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </FooterSection>
          </motion.div>

          <motion.div variants={staggerItem}>
            <FooterSection title="Services" id="services">
              <ul className="space-y-2.5">
                {services.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-muted-foreground transition-colors hover:text-emerald cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </FooterSection>
          </motion.div>

          <motion.div variants={staggerItem}>
            <FooterSection title="Quick Links" id="links">
              <ul className="space-y-2.5">
                {quickLinks.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="group flex items-center text-sm text-muted-foreground transition-colors hover:text-emerald"
                    >
                      {item.text}
                      <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </FooterSection>
          </motion.div>

          <motion.div variants={staggerItem}>
            <FooterSection title="Contact" id="contact">
              <ul className="mb-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald shrink-0" />
                  +91 98765 43210
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald shrink-0" />
                  support@cricbox.com
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald shrink-0 mt-0.5" />
                  Ahmedabad, Gujarat, India
                </li>
              </ul>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stay Updated
              </p>
              <div className="flex gap-2">
                <Input placeholder="Your email" className="h-10 text-sm" />
                <Button variant="glow" size="sm" className="shrink-0">
                  Join
                </Button>
              </div>
            </FooterSection>
          </motion.div>
        </motion.div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CricBox. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-emerald transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-emerald transition-colors">
              Terms
            </a>
            <a href="/cookies" className="hover:text-emerald transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
