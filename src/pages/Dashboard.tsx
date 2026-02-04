import { useState } from "react";
import { motion } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { StreakWidget } from "@/components/widgets/StreakWidget";
import { WellnessScore } from "@/components/widgets/WellnessScore";
import { QuickLogger } from "@/components/widgets/QuickLogger";
import { MoodGrid } from "@/components/widgets/MoodGrid";
import { SleepChart } from "@/components/charts/SleepChart";
import { CravingRadar } from "@/components/charts/CravingRadar";
import { YearHeatmap } from "@/components/charts/YearHeatmap";
import { PredictionCard } from "@/components/widgets/PredictionCard";
import { TrendingUp, Calendar, Target, Award } from "lucide-react";
import { useData, getLogsForDays } from "@/hooks/useData";

const Dashboard = () => {
  const [selectedMood, setSelectedMood] = useState<string>();
  const { logs, addLog } = useData();
  const last7Days = getLogsForDays(logs, 7);
  
  const userName = "Alex";
  const currentHour = new Date().getHours();
  
  const greeting = currentHour < 12 
    ? "Good morning" 
    : currentHour < 18 
    ? "Good afternoon" 
    : "Good evening";

  // Calculate real stats from logs
  const avgSleepQuality = last7Days.length > 0 
    ? Math.round(last7Days.reduce((sum, log) => sum + (log.sleep_quality || 0), 0) / last7Days.length)
    : 0;
  
  const weeklyProgress = last7Days.length > 0 
    ? Math.round((last7Days.filter(log => (log.craving_intensity || 5) < 5).length / last7Days.length) * 100)
    : 0;

  const handleQuickLog = (id: string) => {
    console.log("Quick logging:", id);
    // Quick log with default values
    const today = new Date().toISOString().split("T")[0];
    if (id === "sleep") {
      addLog({ log_date: today, sleep_hours: 7, sleep_quality: 70 });
    } else if (id === "mood") {
      addLog({ log_date: today, mood_tag: "calm" });
    } else if (id === "craving") {
      addLog({ log_date: today, craving_intensity: 3 });
    }
  };

  return (
    <>
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground">
          {greeting}, <span className="gradient-text">{userName}</span> 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your recovery dashboard for today
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* AI Prediction Card - Featured */}
        <MotionCard
          className="bento-card-lg row-span-1"
          delay={0}
          hoverLift={false}
        >
          <PredictionCard logs={logs} />
        </MotionCard>

        {/* Wellness Score */}
        <MotionCard
          className="bento-card-md row-span-2 flex items-center justify-center"
          delay={1}
          hoverLift={false}
        >
          <WellnessScore score={avgSleepQuality || 78} />
        </MotionCard>

        {/* Streak Widget */}
        <MotionCard className="bento-card-sm" delay={2}>
          <StreakWidget days={logs.length} />
        </MotionCard>

        {/* Quick Stats - Now with real data */}
        <MotionCard className="bento-card-sm" delay={3}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {weeklyProgress > 0 ? `+${weeklyProgress}%` : "0%"}
              </p>
              <p className="text-sm text-muted-foreground">Low Craving Days</p>
            </div>
          </div>
        </MotionCard>

        {/* Today's Goals */}
        <MotionCard className="bento-card-sm" delay={4}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">5/7</p>
              <p className="text-sm text-muted-foreground">Goals Today</p>
            </div>
          </div>
        </MotionCard>

        {/* Days Logged - Real count */}
        <MotionCard className="bento-card-sm" delay={5}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-calm/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-calm" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{logs.length}</p>
              <p className="text-sm text-muted-foreground">Days Logged</p>
            </div>
          </div>
        </MotionCard>

        {/* Quick Logger */}
        <MotionCard className="bento-card-lg" delay={6} hoverLift={false}>
          <QuickLogger onLog={handleQuickLog} />
        </MotionCard>

        {/* Mood Grid */}
        <MotionCard className="bento-card-lg" delay={7} hoverLift={false}>
          <MoodGrid onMoodSelect={setSelectedMood} selectedMood={selectedMood} />
        </MotionCard>

        {/* Sleep Chart */}
        <MotionCard className="bento-card-lg" delay={8} hoverLift={false}>
          <SleepChart />
        </MotionCard>

        {/* Craving Radar */}
        <MotionCard className="bento-card-md" delay={9} hoverLift={false}>
          <CravingRadar />
        </MotionCard>

        {/* Achievements */}
        <MotionCard className="bento-card-sm" delay={10}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </div>
        </MotionCard>

        {/* Year Heatmap */}
        <MotionCard className="bento-card-full" delay={11} hoverLift={false}>
          <YearHeatmap />
        </MotionCard>
      </div>
    </>
  );
};

export default Dashboard;
