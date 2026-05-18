import { Target, Users, Shield, Clock, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { staggerContainer, staggerItem } from "@/lib/motion";

const About = () => {
  const features = [
    {
      icon: <Target className="w-8 h-8 text-cricket-green" />,
      title: "Verified Grounds",
      description:
        "All cricket grounds on our platform are verified and meet quality standards for the best playing experience.",
    },
    {
      icon: <Users className="w-8 h-8 text-cricket-yellow" />,
      title: "Community Driven",
      description:
        "Built by cricket enthusiasts for cricket lovers. Join thousands of players who trust BoxCric for their games.",
    },
    {
      icon: <Shield className="w-8 h-8 text-sky-blue" />,
      title: "Secure Booking",
      description:
        "Your bookings and payments are secured with industry-standard encryption and fraud protection.",
    },
    {
      icon: <Clock className="w-8 h-8 text-cricket-green" />,
      title: "Instant Confirmation",
      description:
        "Get immediate booking confirmation and access to ground owner contact details for seamless coordination.",
    },
  ];

  const stats = [
    {
      number: "500+",
      label: "Cricket Grounds",
      icon: <Target className="w-6 h-6" />,
    },
    {
      number: "50,000+",
      label: "Happy Players",
      icon: <Users className="w-6 h-6" />,
    },
    {
      number: "25+",
      label: "Cities Covered",
      icon: <Star className="w-6 h-6" />,
    },
    { number: "4.8", label: "App Rating", icon: <Award className="w-6 h-6" /> },
  ];

  const team = [
    {
      name: "Rajesh Kumar",
      role: "Founder & CEO",
      bio: "Former state-level cricketer passionate about making cricket accessible to everyone.",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Priya Sharma",
      role: "Head of Operations",
      bio: "Ensuring quality standards and smooth operations across all partner grounds.",
      image:
        "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=150&h=150&fit=crop&crop=face",
    },
    {
      name: "Amit Patel",
      role: "Tech Lead",
      bio: "Building the platform that connects cricket lovers with their perfect playing grounds.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
  ];

  return (
    <PageShell>
      <Navbar />

      <section className="section-padding pt-8">
        <div className="container-premium max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-4 py-1.5 text-xs font-medium text-emerald mb-6">
            <Target className="h-3.5 w-3.5" />
            About CricBox
          </span>
          <h1 className="heading-display text-4xl md:text-5xl lg:text-6xl text-balance">
            Revolutionizing{" "}
            <span className="gradient-text">Cricket Ground Booking</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            CricBox is India's premier platform for discovering and booking cricket grounds.
            We connect enthusiasts with verified, high-quality box cricket facilities across major cities.
          </p>
        </div>
      </section>

      <section className="section-padding pt-0">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="heading-display text-3xl mb-6">Our Mission</h2>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                We believe cricket should be accessible to everyone, everywhere.
                Our mission is to democratize access to quality cricket grounds
                by connecting players with verified facilities.
              </p>
              <div className="space-y-3">
                {["Make cricket grounds easily discoverable", "Ensure quality and safety standards", "Create a vibrant cricket community"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald/20 text-emerald text-xs">✓</div>
                    <span className="text-foreground/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <GlassCard className="overflow-hidden p-0">
              <img
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop"
                alt="Cricket ground"
                className="w-full h-64 object-cover"
              />
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="text-center mb-12">
            <h2 className="heading-display text-3xl mb-4">Why Choose CricBox?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Features designed for both players and ground owners.
            </p>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div key={index} variants={staggerItem}>
                <GlassCard hover className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald/10">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="text-center mb-12">
            <h2 className="heading-display text-3xl mb-4">CricBox by Numbers</h2>
            <p className="text-muted-foreground">Growing every day with our cricket community</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <GlassCard key={index} hover glow className="p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                  {stat.icon}
                </div>
                <div className="font-display text-3xl font-bold gradient-text">{stat.number}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-premium">
          <div className="text-center mb-12">
            <h2 className="heading-display text-3xl mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Passionate cricket enthusiasts revolutionizing ground booking.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <GlassCard key={index} hover className="p-6 text-center">
                <img src={member.image} alt={member.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover ring-2 ring-emerald/30" />
                <h3 className="font-display font-semibold text-lg">{member.name}</h3>
                <Badge className="mt-2 mb-3 bg-emerald/10 text-emerald border-emerald/20">{member.role}</Badge>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding pb-24">
        <div className="container-premium max-w-3xl">
          <GlassCard glow className="p-10 text-center">
            <h2 className="heading-display text-3xl mb-4">Join the CricBox Community</h2>
            <p className="text-muted-foreground mb-8">
              Start exploring cricket grounds in your city and book your next game today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="glow" size="lg" asChild>
                <Link to="/">Find Grounds</Link>
              </Button>
              <Button variant="outline" size="lg">List Your Ground</Button>
            </div>
          </GlassCard>
        </div>
      </section>
    </PageShell>
  );
};

export default About;
