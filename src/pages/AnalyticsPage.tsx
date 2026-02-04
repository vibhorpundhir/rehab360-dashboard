import { motion } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { YearHeatmap } from "@/components/charts/YearHeatmap";
import { PredictionCard } from "@/components/widgets/PredictionCard";
import { useData, getLogsForDays } from "@/hooks/useData";
import { TrendingUp, TrendingDown, Brain, Moon, Flame, Target, Sparkles } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const AnalyticsPage = () => {
  const { logs, isLoading } = useData();
  const last14Days = getLogsForDays(logs, 14);

  // Prepare chart data
  const chartData = last14Days
    .map((log) => ({
      date: new Date(log.log_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      sleepQuality: log.sleep_quality || 0,
      cravingIntensity: (log.craving_intensity || 0) * 10, // Scale to 0-100
    }))
    .reverse();

  // Calculate averages
  const avgSleep = Math.round(
    last14Days.reduce((sum, log) => sum + (log.sleep_quality || 0), 0) / last14Days.length
  );
  const avgCraving = Math.round(
    last14Days.reduce((sum, log) => sum + (log.craving_intensity || 0), 0) / last14Days.length
  );

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
      <MotionCard className="p-6" delay={4} hoverLift={false}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Correlation Engine
          </h3>
          <p className="text-sm text-muted-foreground">
            Sleep Quality vs Craving Intensity (Last 14 Days)
          </p>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />
              <Bar
                dataKey="sleepQuality"
                name="Sleep Quality"
                fill="hsl(var(--calm))"
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="cravingIntensity"
                name="Craving Intensity"
                stroke="hsl(var(--alert))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--alert))", strokeWidth: 0, r: 4 }}
                animationDuration={1500}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insight Card */}
        <motion.div
          className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-success flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            <span>
              <strong>Insight:</strong> On days with 70%+ sleep quality, your cravings are {correlationPercent}% lower on average.
            </span>
          </p>
        </motion.div>
      </MotionCard>

      {/* Year Heatmap */}
      <MotionCard className="p-6" delay={5} hoverLift={false}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">
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
