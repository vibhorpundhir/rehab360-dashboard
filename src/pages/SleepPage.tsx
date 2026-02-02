import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useData, calculateSleepDebt } from "@/hooks/useData";
import { Moon, Sun, AlertTriangle, CheckCircle2, BedDouble, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

// Mock sleep stages data
const generateSleepStages = () => {
  const stages = [];
  for (let i = 0; i < 48; i++) {
    const hour = Math.floor(i / 6);
    const isDeepSleep = hour >= 1 && hour <= 3;
    const isREM = hour >= 4 && hour <= 6;
    
    stages.push({
      time: `${Math.floor(i * 10 / 60)}:${String((i * 10) % 60).padStart(2, "0")}`,
      deep: isDeepSleep ? 60 + Math.random() * 30 : 10 + Math.random() * 20,
      rem: isREM ? 50 + Math.random() * 30 : 5 + Math.random() * 15,
      light: 20 + Math.random() * 40,
    });
  }
  return stages;
};

const SleepPage = () => {
  const { addLog } = useData();
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState([70]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const sleepStagesData = useMemo(() => generateSleepStages(), []);

  // Calculate sleep hours
  const sleepHours = useMemo(() => {
    const [bedH, bedM] = bedtime.split(":").map(Number);
    const [wakeH, wakeM] = wakeTime.split(":").map(Number);
    
    let hours = wakeH - bedH;
    let minutes = wakeM - bedM;
    
    if (hours < 0) hours += 24;
    if (minutes < 0) {
      hours -= 1;
      minutes += 60;
    }
    
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
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save:", error);
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <MotionCard className="p-6" delay={0} hoverLift={false}>
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-calm" />
            Log Tonight's Sleep
          </h3>

          <div className="space-y-6">
            {/* Bedtime */}
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4" />
                Bedtime
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

            {/* Wake Time */}
            <div>
              <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4" />
                Wake Time
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

            {/* Quality Slider */}
            <div>
              <label className="text-sm text-muted-foreground flex items-center justify-between mb-4">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Sleep Quality
                </span>
                <span className="text-primary font-bold text-lg">{quality[0]}%</span>
              </label>
              <Slider
                value={quality}
                onValueChange={setQuality}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Save Button */}
            <motion.div
              whileTap={{ scale: 0.95 }}
            >
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

        {/* Results Section */}
        <div className="space-y-6">
          {/* Sleep Summary */}
          <MotionCard className="p-6" delay={1}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Total Sleep
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

          {/* Sleep Debt Card */}
          <AnimatePresence mode="wait">
            {isWarning && (
              <motion.div
                key="warning"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <MotionCard
                  className={cn(
                    "p-6 border-2 border-alert/50",
                    "bg-alert/10"
                  )}
                  delay={2}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-alert/20 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-alert" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-alert">Sleep Debt Warning</p>
                      <p className="text-sm text-muted-foreground">
                        You're {sleepDebt.toFixed(1)}h behind on rest. Consider an earlier bedtime.
                      </p>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            )}

            {isRecovery && (
              <motion.div
                key="recovery"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <MotionCard
                  className={cn(
                    "p-6 border-2 border-success/50",
                    "shadow-glow-success"
                  )}
                  delay={2}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-success">Recovery Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Excellent! You're getting optimal rest for recovery.
                      </p>
                    </div>
                  </div>
                </MotionCard>
              </motion.div>
            )}

            {!isWarning && !isRecovery && (
              <motion.div
                key="neutral"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
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

      {/* Sleep Stages Chart */}
      <MotionCard className="p-6" delay={3} hoverLift={false}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Sleep Stages Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Estimated sleep architecture based on your pattern
          </p>
        </div>

        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sleepStagesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                interval={7}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                hide
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="deep"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                name="Deep Sleep"
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="rem"
                stackId="1"
                stroke="hsl(var(--calm))"
                fill="hsl(var(--calm))"
                fillOpacity={0.6}
                name="REM"
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="light"
                stackId="1"
                stroke="hsl(var(--muted-foreground))"
                fill="hsl(var(--muted-foreground))"
                fillOpacity={0.3}
                name="Light Sleep"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </MotionCard>
    </motion.div>
  );
};

export default SleepPage;
