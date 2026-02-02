import { motion } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { useData, getLogsForDays } from "@/hooks/useData";
import { Activity, Droplets, Pill, Timer, TrendingUp, Heart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const VitalsPage = () => {
  const { logs } = useData();
  const last7Days = getLogsForDays(logs, 7);

  // Calculate averages
  const avgWater = Math.round(
    last7Days.reduce((sum, log) => sum + (log.water_glasses || 0), 0) / last7Days.length
  );
  const avgExercise = Math.round(
    last7Days.reduce((sum, log) => sum + (log.exercise_minutes || 0), 0) / last7Days.length
  );
  const avgMeditation = Math.round(
    last7Days.reduce((sum, log) => sum + (log.meditation_minutes || 0), 0) / last7Days.length
  );
  const medAdherence = Math.round(
    (last7Days.filter((log) => log.took_meds).length / last7Days.length) * 100
  );

  // Radial chart data for daily goals
  const radialData = [
    { name: "Water", value: Math.min(100, avgWater * 12.5), fill: "hsl(var(--calm))" },
    { name: "Exercise", value: Math.min(100, avgExercise * 3.3), fill: "hsl(var(--success))" },
    { name: "Meditation", value: Math.min(100, avgMeditation * 5), fill: "hsl(var(--primary))" },
  ];

  // Bar chart data for exercise
  const exerciseData = last7Days
    .map((log) => ({
      date: new Date(log.log_date).toLocaleDateString("en-US", { weekday: "short" }),
      minutes: log.exercise_minutes || 0,
    }))
    .reverse();

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
          Daily <span className="gradient-text">Vitals</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your wellness habits and build healthy routines
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MotionCard className="p-4" delay={0}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-calm/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-calm" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgWater}</p>
              <p className="text-xs text-muted-foreground">Glasses/Day</p>
            </div>
          </div>
        </MotionCard>

        <MotionCard className="p-4" delay={1}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgExercise}m</p>
              <p className="text-xs text-muted-foreground">Avg Exercise</p>
            </div>
          </div>
        </MotionCard>

        <MotionCard className="p-4" delay={2}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{avgMeditation}m</p>
              <p className="text-xs text-muted-foreground">Avg Meditation</p>
            </div>
          </div>
        </MotionCard>

        <MotionCard className="p-4" delay={3}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Pill className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{medAdherence}%</p>
              <p className="text-xs text-muted-foreground">Med Adherence</p>
            </div>
          </div>
        </MotionCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Radial Progress */}
        <MotionCard className="p-6" delay={4} hoverLift={false}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-alert" />
            Daily Goals Progress
          </h3>

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="90%"
                data={radialData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
                <Legend
                  iconSize={10}
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </MotionCard>

        {/* Exercise Bar Chart */}
        <MotionCard className="p-6" delay={5} hoverLift={false}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Exercise This Week
          </h3>

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exerciseData}>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="minutes"
                  name="Minutes"
                  fill="hsl(var(--success))"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MotionCard>
      </div>

      {/* Today's Checklist */}
      <MotionCard className="p-6" delay={6} hoverLift={false}>
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Today's Wellness Checklist
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets className="w-5 h-5 text-calm" />
              <span className="text-sm text-foreground">Water (8 glasses)</span>
            </div>
            <div className="flex items-center gap-3 w-1/2">
              <Progress value={75} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12">6/8</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-success" />
              <span className="text-sm text-foreground">Exercise (30 min)</span>
            </div>
            <div className="flex items-center gap-3 w-1/2">
              <Progress value={100} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12">✓ Done</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-primary" />
              <span className="text-sm text-foreground">Meditation (10 min)</span>
            </div>
            <div className="flex items-center gap-3 w-1/2">
              <Progress value={50} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12">5/10</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pill className="w-5 h-5 text-warning" />
              <span className="text-sm text-foreground">Medication</span>
            </div>
            <div className="flex items-center gap-3 w-1/2">
              <Progress value={100} className="flex-1" />
              <span className="text-xs text-muted-foreground w-12">✓ Taken</span>
            </div>
          </div>
        </div>
      </MotionCard>
    </motion.div>
  );
};

export default VitalsPage;
