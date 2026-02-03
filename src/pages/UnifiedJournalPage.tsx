import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useData, getCravingRiskByTime } from "@/hooks/useData";
import { 
  Heart, BookOpen, Flame, ChevronRight, ChevronLeft, 
  CheckCircle2, AlertTriangle, Sparkles, Phone 
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

const moodEmojis = [
  { emoji: "😡", label: "Angry", value: 1, color: "hsl(0, 70%, 50%)" },
  { emoji: "😢", label: "Sad", value: 2, color: "hsl(210, 70%, 50%)" },
  { emoji: "😐", label: "Neutral", value: 3, color: "hsl(45, 10%, 50%)" },
  { emoji: "🙂", label: "Good", value: 4, color: "hsl(120, 50%, 50%)" },
  { emoji: "🤩", label: "Amazing", value: 5, color: "hsl(280, 70%, 50%)" },
];

const triggers = ["Stress", "Boredom", "Social", "Habit", "Loneliness", "Celebration", "HALT"];

const UnifiedJournalPage = () => {
  const { logs, addLog } = useData();
  const navigate = useNavigate();
  
  // Wizard state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  
  // Form state
  const [selectedMood, setSelectedMood] = useState<typeof moodEmojis[0] | null>(null);
  const [hasCraving, setHasCraving] = useState<boolean | null>(null);
  const [cravingIntensity, setCravingIntensity] = useState([5]);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const riskData = getCravingRiskByTime(logs);

  const isLowMood = selectedMood && selectedMood.value <= 2;
  const totalSteps = hasCraving ? 4 : 3;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await addLog({
        mood_tag: selectedMood?.label.toLowerCase() || null,
        craving_intensity: hasCraving ? cravingIntensity[0] : null,
        craving_trigger: selectedTrigger?.toLowerCase() || null,
        craving_time: hasCraving ? new Date().toTimeString().slice(0, 5) : null,
        notes: notes || null,
        log_date: new Date().toISOString().split("T")[0],
      });

      // Check for crisis mode
      if (hasCraving && cravingIntensity[0] > 7) {
        setShowCrisisModal(true);
      } else {
        setShowSuccess(true);
        toast.success("Journal entry saved!", {
          description: "Your entry has been recorded and charts are updated.",
        });
        
        // Reset after success
        setTimeout(() => {
          setStep(1);
          setSelectedMood(null);
          setHasCraving(null);
          setCravingIntensity([5]);
          setSelectedTrigger(null);
          setNotes("");
          setShowSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to save journal entry:", error);
      toast.error("Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            variants={stepVariants}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Heart className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold text-foreground">How are you feeling?</h2>
              <p className="text-muted-foreground mt-2">Select the emoji that best matches your mood</p>
            </div>

            <div className="flex justify-center gap-4 py-8">
              {moodEmojis.map((mood) => (
                <motion.button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood)}
                  className={cn(
                    "w-20 h-20 rounded-2xl",
                    "flex flex-col items-center justify-center gap-1",
                    "bg-secondary/50 hover:bg-secondary/80",
                    "transition-all duration-200",
                    selectedMood?.label === mood.label && "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                  )}
                  whileHover={{ scale: 1.1, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-4xl">{mood.emoji}</span>
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            variants={stepVariants}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Flame className="w-12 h-12 mx-auto text-alert mb-4" />
              <h2 className="text-2xl font-bold text-foreground">
                {isLowMood ? "Are you experiencing any cravings?" : "Any cravings today?"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isLowMood 
                  ? "Low moods can sometimes trigger cravings. It's okay either way."
                  : "Tracking cravings helps identify patterns"
                }
              </p>
            </div>

            <div className="flex justify-center gap-6 py-8">
              <motion.button
                onClick={() => setHasCraving(true)}
                className={cn(
                  "px-12 py-6 rounded-2xl text-lg font-medium",
                  "bg-secondary/50 hover:bg-alert/20",
                  "transition-all duration-200",
                  hasCraving === true && "bg-alert/30 ring-2 ring-alert"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Yes
              </motion.button>
              <motion.button
                onClick={() => setHasCraving(false)}
                className={cn(
                  "px-12 py-6 rounded-2xl text-lg font-medium",
                  "bg-secondary/50 hover:bg-success/20",
                  "transition-all duration-200",
                  hasCraving === false && "bg-success/30 ring-2 ring-success"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                No
              </motion.button>
            </div>
          </motion.div>
        );

      case 3:
        if (hasCraving) {
          return (
            <motion.div
              key="step3-craving"
              variants={stepVariants}
              custom={direction}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="space-y-8"
            >
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-warning mb-4" />
                <h2 className="text-2xl font-bold text-foreground">Craving Details</h2>
                <p className="text-muted-foreground mt-2">Understanding your cravings helps build resilience</p>
              </div>

              {/* Intensity Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Intensity</span>
                  <span 
                    className={cn(
                      "text-2xl font-bold",
                      cravingIntensity[0] > 7 ? "text-alert" : 
                      cravingIntensity[0] > 4 ? "text-warning" : "text-success"
                    )}
                  >
                    {cravingIntensity[0]}/10
                  </span>
                </div>
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-alert flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    High intensity - support will be offered after saving
                  </motion.p>
                )}
              </div>

              {/* Trigger Selection */}
              <div className="space-y-3">
                <span className="text-sm text-muted-foreground">What triggered this?</span>
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
            </motion.div>
          );
        }
        // Fall through to notes step if no craving
        return renderNotesStep();

      case 4:
        return renderNotesStep();

      default:
        return null;
    }
  };

  const renderNotesStep = () => (
    <motion.div
      key="step-notes"
      variants={stepVariants}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="space-y-6"
    >
      <div className="text-center">
        <BookOpen className="w-12 h-12 mx-auto text-calm mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Any thoughts to capture?</h2>
        <p className="text-muted-foreground mt-2">Optional - but journaling can be therapeutic</p>
      </div>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write anything on your mind... gratitude, challenges, insights, wins..."
        className="min-h-[150px] bg-secondary/30 border-white/10 focus:border-primary/50"
      />
    </motion.div>
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="space-y-8"
      style={{
        "--page-accent": selectedMood?.color,
      } as React.CSSProperties}
    >
      {/* Accent Glow */}
      <AnimatePresence>
        {selectedMood && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: `radial-gradient(circle at center, ${selectedMood.color}15 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Daily <span className="gradient-text">Journal</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          A quick check-in to track your wellness journey
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 relative z-10">
        {/* Wizard Card */}
        <MotionCard className="lg:col-span-2 p-8" delay={0} hoverLift={false}>
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex items-center flex-1">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                    step > i + 1 ? "bg-success text-success-foreground" :
                    step === i + 1 ? "bg-primary text-primary-foreground" :
                    "bg-secondary/50 text-muted-foreground"
                  )}
                  animate={{ scale: step === i + 1 ? 1.1 : 1 }}
                >
                  {step > i + 1 ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </motion.div>
                {i < totalSteps - 1 && (
                  <div 
                    className={cn(
                      "flex-1 h-1 mx-2 rounded-full transition-colors",
                      step > i + 1 ? "bg-success" : "bg-secondary/50"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait" custom={direction}>
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center h-[300px]"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-success" />
                  </motion.div>
                  <p className="text-xl font-semibold mt-4 text-foreground">Entry Saved!</p>
                  <p className="text-muted-foreground">Charts and analytics are now updated</p>
                </motion.div>
              ) : (
                renderStep()
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          {!showSuccess && (
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={step === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button
                  onClick={goNext}
                  disabled={
                    (step === 1 && !selectedMood) ||
                    (step === 2 && hasCraving === null)
                  }
                  className="gap-2 bg-gradient-violet hover:shadow-glow-violet"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2 bg-gradient-violet hover:shadow-glow-violet px-8"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Entry"}
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </MotionCard>

        {/* Risk Radar Sidebar */}
        <MotionCard className="p-6" delay={1} hoverLift={false}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Your Risk Patterns
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Based on your logged cravings by time of day
          </p>

          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={riskData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="time" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={false}
                />
                <Radar
                  name="Risk Level"
                  dataKey="risk"
                  stroke="hsl(var(--alert))"
                  fill="hsl(var(--alert))"
                  fillOpacity={0.4}
                  animationDuration={1500}
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

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Higher values indicate times when you're more vulnerable
          </p>
        </MotionCard>
      </div>

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
              onClick={() => {
                setShowCrisisModal(false);
                setShowSuccess(true);
                toast.success("Journal entry saved!");
                setTimeout(() => {
                  setStep(1);
                  setSelectedMood(null);
                  setHasCraving(null);
                  setCravingIntensity([5]);
                  setSelectedTrigger(null);
                  setNotes("");
                  setShowSuccess(false);
                }, 2000);
              }}
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

export default UnifiedJournalPage;
