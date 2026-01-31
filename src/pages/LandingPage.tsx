import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Brain, 
  Heart, 
  Moon, 
  Shield, 
  Sparkles,
  ArrowRight,
  Check
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Track Your Journey",
    description: "Monitor cravings, moods, and sleep patterns in one beautiful dashboard.",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get personalized recommendations from Ally, your empathetic AI companion.",
  },
  {
    icon: Heart,
    title: "Emotional Wellness",
    description: "Log your feelings and understand the patterns affecting your recovery.",
  },
  {
    icon: Moon,
    title: "Sleep Analysis",
    description: "Track sleep quality and discover how rest impacts your progress.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is encrypted and never shared. Your journey, your control.",
  },
  {
    icon: Sparkles,
    title: "Celebrate Wins",
    description: "Track streaks, earn achievements, and celebrate every milestone.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-success/10 rounded-full blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet">
              <span className="text-xl font-bold text-white">R</span>
            </div>
            <span className="font-display text-xl font-bold gradient-text">
              Rehab360
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
            <Button
              className="bg-gradient-violet hover:opacity-90 shadow-glow-violet"
              onClick={() => navigate("/auth")}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary">Your Recovery, Reimagined</span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-tight mb-6">
                <span className="text-foreground">Track Your</span>
                <br />
                <span className="gradient-text">Holistic Recovery</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-lg">
                A beautiful, intelligent companion for your wellness journey. 
                Track cravings, moods, and sleep with AI-powered insights.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-violet hover:opacity-90 shadow-glow-violet text-lg px-8"
                  onClick={() => navigate("/auth")}
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 hover:bg-white/5 text-lg"
                  onClick={() => navigate("/dashboard")}
                >
                  Explore Demo
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>100% private</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>No credit card</span>
                </div>
              </div>
            </motion.div>

            {/* Right - Dashboard Preview */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
                
                {/* Dashboard mockup */}
                <div className="relative glass-card p-6 rounded-3xl border border-white/10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-muted-foreground text-sm">Good morning</p>
                      <p className="text-xl font-semibold text-foreground">Dashboard</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-violet" />
                  </div>

                  {/* Mini widgets grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Wellness Score */}
                    <motion.div
                      className="glass-card p-4 rounded-xl"
                      animate={{ boxShadow: ["0 0 20px hsl(262 83% 66% / 0.2)", "0 0 40px hsl(262 83% 66% / 0.4)", "0 0 20px hsl(262 83% 66% / 0.2)"] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <div className="w-20 h-20 mx-auto rounded-full border-4 border-primary flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-foreground">78</span>
                      </div>
                      <p className="text-center text-sm text-muted-foreground">Wellness</p>
                    </motion.div>

                    {/* Streak */}
                    <div className="glass-card p-4 rounded-xl">
                      <div className="text-center">
                        <span className="text-4xl">🔥</span>
                        <p className="text-2xl font-bold text-foreground mt-2">23</p>
                        <p className="text-sm text-muted-foreground">Day Streak</p>
                      </div>
                    </div>

                    {/* Mood */}
                    <div className="glass-card p-4 rounded-xl col-span-2">
                      <p className="text-sm text-muted-foreground mb-3">Today's Mood</p>
                      <div className="flex justify-between">
                        {["😊", "😌", "😰", "😢", "🌟"].map((emoji, i) => (
                          <motion.span
                            key={i}
                            className="text-2xl cursor-pointer"
                            whileHover={{ scale: 1.3 }}
                          >
                            {emoji}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold mb-4">
              Everything You Need to <span className="gradient-text">Thrive</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed with empathy, backed by science.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="glass-card p-6 rounded-2xl group hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          className="max-w-4xl mx-auto glass-card p-12 rounded-3xl text-center relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-display font-bold mb-4">
              Ready to Start Your <span className="gradient-text">Journey</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands who are transforming their recovery with Rehab360.
            </p>
            <Button
              size="lg"
              className="bg-gradient-violet hover:opacity-90 shadow-glow-violet text-lg px-10"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-violet flex items-center justify-center">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <span className="font-display font-bold text-foreground">Rehab360</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Rehab360. Built with 💜 for your recovery.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
