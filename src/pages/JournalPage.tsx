import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useData, getCravingRiskByTime } from "@/hooks/useData";
import { Flame, Phone, Heart, BookOpen, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useNavigate } from "react-router-dom";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const moodEmojis = [
  { emoji: "😡", label: "Angry", color: "hsl(0, 70%, 50%)" },
  { emoji: "😢", label: "Sad", color: "hsl(210, 70%, 50%)" },
  { emoji: "😐", label: "Neutral", color: "hsl(45, 10%, 50%)" },
  { emoji: "🙂", label: "Good", color: "hsl(45, 70%, 50%)" },
  { emoji: "🤩", label: "Amazing", color: "hsl(280, 70%, 50%)" },
];

const triggers = ["Stress", "Boredom", "Social", "Habit", "Loneliness", "Celebration"];

const JournalPage = () => {
  const { logs, addLog } = useData();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [cravingIntensity, setCravingIntensity] = useState([5]);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const riskData = getCravingRiskByTime(logs);

  const handleMoodSelect = (emoji: typeof moodEmojis[0]) => {
    setSelectedMood(emoji.label);
    setAccentColor(emoji.color);
    
    // Auto-save mood log
    addLog({
      mood_tag: emoji.label.toLowerCase(),
      log_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleLogCraving = async () => {
    setIsSaving(true);
    
    try {
      await addLog({
        craving_intensity: cravingIntensity[0],
        craving_trigger: selectedTrigger?.toLowerCase() || null,
        craving_time: new Date().toTimeString().slice(0, 5),
        log_date: new Date().toISOString().split("T")[0],
      });

      // Check for crisis mode
      if (cravingIntensity[0] > 7) {
        setShowCrisisModal(true);
      }
    } catch (error) {
      console.error("Failed to log craving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="space-y-8"
      style={{
        "--page-accent": accentColor,
      } as React.CSSProperties}
    >
      {/* Accent Glow Overlay */}
      <AnimatePresence>
        {accentColor && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: `radial-gradient(circle at center, ${accentColor}20 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Mood & Craving <span className="gradient-text">Journal</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your emotional landscape and identify patterns
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 relative z-10">
        {/* Emoji Logger */}
        <MotionCard className="p-6" delay={0} hoverLift={false}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-alert" />
            How are you feeling?
          </h3>

          <div className="flex justify-between gap-2">
            {moodEmojis.map((mood) => (
              <motion.button
                key={mood.label}
                onClick={() => handleMoodSelect(mood)}
                className={cn(
                  "flex-1 aspect-square rounded-2xl",
                  "flex flex-col items-center justify-center gap-2",
                  "bg-secondary/50 hover:bg-secondary/80",
                  "transition-all duration-200",
                  selectedMood === mood.label && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-4xl">{mood.emoji}</span>
                <span className="text-xs text-muted-foreground">{mood.label}</span>
              </motion.button>
            ))}
          </div>

          {selectedMood && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-center text-success"
            >
              ✓ Logged feeling {selectedMood.toLowerCase()}
            </motion.p>
          )}
        </MotionCard>

        {/* Risk Radar */}
        <MotionCard className="p-6" delay={1} hoverLift={false}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Vulnerability by Time
          </h3>

          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={riskData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="time" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <Radar
                  name="Risk Level"
                  dataKey="risk"
                  stroke="hsl(var(--alert))"
                  fill="hsl(var(--alert))"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </MotionCard>
      </div>

      {/* Craving Logger */}
      <MotionCard className="p-6 relative z-10" delay={2} hoverLift={false}>
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Flame className="w-5 h-5 text-alert" />
          Log a Craving
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Intensity Slider */}
          <div>
            <label className="text-sm text-muted-foreground flex items-center justify-between mb-4">
              <span>Craving Intensity</span>
              <span 
                className={cn(
                  "text-lg font-bold",
                  cravingIntensity[0] > 7 ? "text-alert" : 
                  cravingIntensity[0] > 4 ? "text-warning" : "text-success"
                )}
              >
                {cravingIntensity[0]}/10
              </span>
            </label>
            <Slider
              value={cravingIntensity}
              onValueChange={setCravingIntensity}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            
            {cravingIntensity[0] > 7 && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-alert flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                High intensity detected - consider reaching out for support
              </motion.p>
            )}
          </div>

          {/* Trigger Selection */}
          <div>
            <label className="text-sm text-muted-foreground mb-4 block">
              What triggered this?
            </label>
            <div className="flex flex-wrap gap-2">
              {triggers.map((trigger) => (
                <motion.button
                  key={trigger}
                  onClick={() => setSelectedTrigger(trigger)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium",
                    "transition-all duration-200",
                    selectedTrigger === trigger
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary/80"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {trigger}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Log Button */}
        <motion.div className="mt-6" whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleLogCraving}
            disabled={isSaving}
            className={cn(
              "w-full md:w-auto px-8 py-6",
              "bg-gradient-violet hover:shadow-glow-violet",
              "transition-all duration-300"
            )}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            {isSaving ? "Saving..." : "Log Craving"}
          </Button>
        </motion.div>
      </MotionCard>

      {/* Crisis Mode Modal */}
      <Dialog open={showCrisisModal} onOpenChange={setShowCrisisModal}>
        <DialogContent className="glass-card border-alert/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-alert">
              <AlertTriangle className="w-5 h-5" />
              High Craving Detected
            </DialogTitle>
            <DialogDescription className="pt-4">
              I noticed you're experiencing a strong craving (intensity {cravingIntensity[0]}/10). 
              This is a critical moment, and reaching out for support can make a big difference.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  setShowCrisisModal(false);
                  navigate("/mind");
                }}
                className="w-full bg-gradient-violet hover:shadow-glow-violet py-6"
              >
                <Phone className="w-5 h-5 mr-2" />
                Talk to Ally (AI Companion)
              </Button>
            </motion.div>

            <Button
              variant="outline"
              onClick={() => setShowCrisisModal(false)}
              className="w-full"
            >
              I'm okay, just logging
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              If you're in immediate danger, please call 988 (Suicide & Crisis Lifeline)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default JournalPage;
