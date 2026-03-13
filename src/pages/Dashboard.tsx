import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { WellnessScore } from "@/components/widgets/WellnessScore";
import { QuickLogger } from "@/components/widgets/QuickLogger";
import { MoodGrid } from "@/components/widgets/MoodGrid";
import { CorrelationChart } from "@/components/charts/CorrelationChart";
import { BiologicalRadar } from "@/components/charts/BiologicalRadar";
import { YearHeatmap } from "@/components/charts/YearHeatmap";
import { Flame, Moon, Droplets, TrendingUp } from "lucide-react";
import { useData, getLogsForDays } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string>();
  const { logs, addLog } = useData();
  const last7Days = getLogsForDays(logs, 7);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
      ? "Good afternoon"
      : "Good evening";

  // KPI calculations
  const streakDays = logs.length;

  const avgSleepScore = useMemo(() => {
    if (last7Days.length === 0) return 0;
    return Math.round(
      last7Days.reduce((s, l) => s + (l.sleep_quality || 0), 0) / last7Days.length
    );
  }, [last7Days]);

  const avgMood = useMemo(() => {
    const moodMap: Record<string, number> = {
      happy: 5, calm: 4, neutral: 3, anxious: 2, sad: 1, angry: 1,
    };
    const withMood = last7Days.filter((l) => l.mood_tag);
    if (withMood.length === 0) return "—";
    const avg =
      withMood.reduce((s, l) => s + (moodMap[l.mood_tag!] || 3), 0) /
      withMood.length;
    if (avg >= 4.5) return "😊";
    if (avg >= 3.5) return "😌";
    if (avg >= 2.5) return "😐";
    return "😟";
  }, [last7Days]);

  const avgWater = useMemo(() => {
    if (last7Days.length === 0) return 0;
    return Math.round(
      last7Days.reduce((s, l) => s + (l.water_glasses || 0), 0) / last7Days.length
    );
  }, [last7Days]);

  const handleQuickLog = (id: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (id === "sleep") addLog({ log_date: today, sleep_hours: 7, sleep_quality: 70 });
    else if (id === "mood") addLog({ log_date: today, mood_tag: "calm" });
    else if (id === "craving") addLog({ log_date: today, craving_intensity: 3 });
    else if (id === "water") addLog({ log_date: today, water_glasses: 8 });
  };

  const kpis = [
    {
      label: "Current Streak",
      value: `${streakDays}`,
      unit: "days",
      icon: Flame,
      color: "text-warning",
      bg: "bg-warning/15",
    },
    {
      label: "Sleep Score",
      value: `${avgSleepScore}`,
      unit: "/ 100",
      icon: Moon,
      color: "text-calm",
      bg: "bg-calm/15",
    },
    {
      label: "Avg Mood",
      value: avgMood,
      unit: "7-day",
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/15",
    },
    {
      label: "Water Intake",
      value: `${avgWater}`,
      unit: "glasses/day",
      icon: Droplets,
      color: "text-primary",
      bg: "bg-primary/15",
    },
  ];

  return (
    <>
      {/* ── Header ── */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground">
          {greeting},{" "}
          <span className="gradient-text">{user?.name || "Guest"}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your recovery dashboard for today
        </p>
      </motion.div>

      {/* ── Row 1 — KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <MotionCard key={kpi.label} className="p-5" delay={i} hoverLift>
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-foreground leading-tight truncate">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {kpi.label}
                  </p>
                </div>
              </div>
            </MotionCard>
          );
        })}
      </div>

      {/* ── Row 2 — Deep Dive (Correlation 60% + Radar 40%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <MotionCard
          className="lg:col-span-3 p-6"
          delay={5}
          hoverLift={false}
        >
          <CorrelationChart logs={logs} />
        </MotionCard>

        <MotionCard
          className="lg:col-span-2 p-6"
          delay={6}
          hoverLift={false}
        >
          <BiologicalRadar logs={logs} />
        </MotionCard>
      </div>

      {/* ── Row 2.5 — Wellness Score + Quick Logger + Mood Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MotionCard
          className="flex items-center justify-center p-6"
          delay={7}
          hoverLift={false}
        >
          <WellnessScore score={avgSleepScore || 78} />
        </MotionCard>

        <MotionCard className="p-6" delay={8} hoverLift={false}>
          <QuickLogger onLog={handleQuickLog} />
        </MotionCard>

        <MotionCard className="p-6" delay={9} hoverLift={false}>
          <MoodGrid onMoodSelect={setSelectedMood} selectedMood={selectedMood} />
        </MotionCard>
      </div>

      {/* ── Row 3 — Full-Width Heatmap ── */}
      <MotionCard className="p-6" delay={10} hoverLift={false}>
        <YearHeatmap logs={logs} />
      </MotionCard>
    </>
  );
};

export default Dashboard;
