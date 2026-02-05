import { motion } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { YearHeatmap } from "@/components/charts/YearHeatmap";
import { CorrelationChart } from "@/components/charts/CorrelationChart";
import { InsightEngine } from "@/components/widgets/InsightEngine";
import { PredictionCard } from "@/components/widgets/PredictionCard";
import { useData, getLogsForDays } from "@/hooks/useData";
import { TrendingUp, Moon, Flame, Target, Activity, BarChart3 } from "lucide-react";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const AnalyticsPage = () => {
  const { logs } = useData();
  const last14Days = getLogsForDays(logs, 14);

  // Calculate averages
  const avgSleep = last14Days.length > 0 
    ? Math.round(last14Days.reduce((sum, log) => sum + (log.sleep_quality || 0), 0) / last14Days.length)
    : 0;
  const avgCraving = last14Days.length > 0
    ? Math.round(last14Days.reduce((sum, log) => sum + (log.craving_intensity || 0), 0) / last14Days.length)
    : 0;

  // Calculate correlation insight
  const highSleepDays = last14Days.filter((l) => (l.sleep_quality || 0) >= 70);
  const lowCravingOnHighSleep = highSleepDays.filter((l) => (l.craving_intensity || 0) <= 4);
  const correlationPercent = highSleepDays.length > 0 
    ? Math.round((lowCravingOnHighSleep.length / highSleepDays.length) * 100)
    : 0;

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
          Deep <span className="gradient-text">Analytics</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Understand the patterns in your recovery journey
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MotionCard className="p-4" delay={0}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-calm/20 flex items-center justify-center">
              <Moon className="w-5 h-5 text-calm" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgSleep}%</p>
              <p className="text-xs text-muted-foreground">Avg Sleep Quality</p>
            </div>
          </div>
        </MotionCard>

        <MotionCard className="p-4" delay={1}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-alert/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-alert" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgCraving}/10</p>
              <p className="text-xs text-muted-foreground">Avg Craving</p>
            </div>
          </div>
        </MotionCard>

        <MotionCard className="p-4" delay={2}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{correlationPercent}%</p>
              <p className="text-xs text-muted-foreground">Sleep-Craving Link</p>
            </div>
          </div>
        </MotionCard>

        <MotionCard className="p-4" delay={3}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{last14Days.length}</p>
              <p className="text-xs text-muted-foreground">Days Tracked</p>
            </div>
          </div>
        </MotionCard>
      </div>

      {/* AI Prediction Card */}
      <MotionCard className="p-0" delay={4} hoverLift={false}>
        <PredictionCard logs={logs} className="border-0 shadow-none bg-transparent" />
      </MotionCard>

      {/* Main Grid: Correlation + Insights */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Correlation Chart - 2 columns */}
        <MotionCard className="lg:col-span-2 p-6" delay={5} hoverLift={false}>
          <CorrelationChart logs={logs} />
        </MotionCard>

        {/* Smart Insights - 1 column */}
        <MotionCard className="p-6" delay={6} hoverLift={false}>
          <InsightEngine logs={logs} />
        </MotionCard>
      </div>

      {/* Year Heatmap */}
      <MotionCard className="p-6" delay={7} hoverLift={false}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-success" />
            Mental Clarity Heatmap
          </h3>
          <p className="text-sm text-muted-foreground">
            Your year in review - Green days indicate high mental clarity
          </p>
        </div>
        <YearHeatmap />
      </MotionCard>
    </motion.div>
  );
};

export default AnalyticsPage;
