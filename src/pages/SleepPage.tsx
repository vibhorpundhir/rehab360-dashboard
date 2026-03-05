import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useData, calculateSleepDebt, getLogsForDays } from "@/hooks/useData";
import { InsightEngine } from "@/components/widgets/InsightEngine";
import { EmptyState } from "@/components/widgets/EmptyState";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle2,
  BedDouble,
  Clock,
  Zap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SleepStagesChart } from "@/components/charts/SleepStagesChart";
import { CircadianScatter } from "@/components/charts/CircadianScatter";
import { SleepEfficiencyRadial } from "@/components/charts/SleepEfficiencyRadial";
import { SleepDebtWaterfall } from "@/components/charts/SleepDebtWaterfall";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const SleepPage = () => {
  const { logs, addLog } = useData();
  const isMobile = useIsMobile();
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState([70]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [animateChart, setAnimateChart] = useState(false);

  const last7Days = getLogsForDays(logs, 7);
  const hasSleepData = last7Days.some((l) => l.sleep_hours);

  const sleepHours = useMemo(() => {
    const [bedH, bedM] = bedtime.split(":").map(Number);
    const [wakeH, wakeM] = wakeTime.split(":").map(Number);
    let hours = wakeH - bedH;
    let minutes = wakeM - bedM;
    if (hours < 0) hours += 24;
    if (minutes < 0) { hours -= 1; minutes += 60; }
    return hours + minutes / 60;
  }, [bedtime, wakeTime]);

  const sleepDebt = calculateSleepDebt(sleepHours);
  const isWarning = sleepDebt > 2;
  const isRecovery = sleepDebt < 1;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await addLog({
        sleep_hours: sleepHours,
        sleep_quality: quality[0],
        log_date: new Date().toISOString().split("T")[0],
      });
      setShowSuccess(true);
      setAnimateChart(true);
      toast.success("Sleep logged!", {
        description: sleepDebt > 2
          ? "⚠️ Consider an earlier bedtime tonight."
          : "✨ Great rest! Charts updated.",
      });
      setTimeout(() => { setShowSuccess(false); setAnimateChart(false); }, 3000);
    } catch {
      toast.error("Failed to save. Please try again.");
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
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Sleep <span className="gradient-text">Tracker</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your rest to optimize recovery
        </p>
      </div>

      {/* Input + Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <MotionCard className="p-6" delay={0} hoverLift={false}>
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-calm" />
            Log Tonight's Sleep
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4" /> Bedtime
              </label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
                  "bg-secondary/50 border border-white/10",
                  "text-foreground text-lg font-medium",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  "transition-all duration-200"
                )}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4" /> Wake Time
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
                  "bg-secondary/50 border border-white/10",
                  "text-foreground text-lg font-medium",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  "transition-all duration-200"
                )}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground flex items-center justify-between mb-4">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Sleep Quality
                </span>
                <span className="text-primary font-bold text-lg">{quality[0]}%</span>
              </label>
              <Slider value={quality} onValueChange={setQuality} max={100} min={1} step={1} className="w-full" />
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "w-full py-6 text-lg font-semibold",
                  "bg-gradient-violet hover:shadow-glow-violet",
                  "transition-all duration-300"
                )}
              >
                {isSaving ? "Saving..." : showSuccess ? "Saved! ✓" : "Save Sleep Log"}
              </Button>
            </motion.div>
          </div>
        </MotionCard>

        {/* Results */}
        <div className="space-y-6">
          <MotionCard className="p-6" delay={1}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Total Sleep
                </p>
                <p className="text-4xl font-bold text-foreground mt-1">
                  {sleepHours.toFixed(1)}h
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-calm/20 flex items-center justify-center">
                <Moon className="w-8 h-8 text-calm" />
              </div>
            </div>
          </MotionCard>

          <AnimatePresence mode="wait">
            {isWarning && (
              <motion.div key="warning" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <MotionCard className={cn("p-6 border-2 border-alert/50", "bg-alert/10")} delay={2}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-alert/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-alert" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-alert">Sleep Debt Warning</p>
                      <p className="text-sm text-muted-foreground">
                        You're {sleepDebt.toFixed(1)}h behind on rest.
                      </p>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            )}
            {isRecovery && (
              <motion.div key="recovery" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <MotionCard className={cn("p-6 border-2 border-success/50", "shadow-glow-success")} delay={2}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-success">Recovery Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Excellent! Optimal rest for recovery.
                      </p>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            )}
            {!isWarning && !isRecovery && (
              <motion.div key="neutral" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <MotionCard className="p-6" delay={2}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">Sleep Debt</p>
                      <p className="text-sm text-muted-foreground">
                        {sleepDebt.toFixed(1)}h behind ideal. Getting closer!
                      </p>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Insights */}
      <MotionCard className="p-6" delay={3} hoverLift={false}>
        <InsightEngine logs={logs} />
      </MotionCard>

      {/* Sleep Stages Chart (fixed) */}
      <MotionCard className="p-6" delay={4} hoverLift={false}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Sleep Stages Analysis
            {animateChart && (
              <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="text-success">
                <Sparkles className="w-4 h-4" />
              </motion.span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            Estimated sleep architecture based on your pattern
          </p>
        </div>
        <SleepStagesChart sleepHours={sleepHours} isMobile={isMobile} />
      </MotionCard>

      {/* ── Sleep Intelligence Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Sleep <span className="gradient-text-teal">Intelligence</span>
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Advanced analysis of your sleep patterns
        </p>
      </motion.div>

      {!hasSleepData ? (
        <EmptyState message="Log tonight's sleep to unlock your Circadian Analysis." />
      ) : (
        <>
          {/* Circadian + Efficiency */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <MotionCard className="lg:col-span-3 p-6" delay={5} hoverLift={false}>
              <CircadianScatter logs={last7Days} isMobile={isMobile} />
            </MotionCard>
            <MotionCard className="lg:col-span-2 p-6" delay={6} hoverLift={false}>
              <SleepEfficiencyRadial logs={last7Days} />
            </MotionCard>
          </div>

          {/* Sleep Debt Waterfall */}
          <MotionCard className="p-6" delay={7} hoverLift={false}>
            <SleepDebtWaterfall logs={last7Days} isMobile={isMobile} />
          </MotionCard>
        </>
      )}
    </motion.div>
  );
};

export default SleepPage;
