import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MotionCard } from "@/components/motion/MotionCard";
import { StreakWidget } from "@/components/widgets/StreakWidget";
import { WellnessScore } from "@/components/widgets/WellnessScore";
import { QuickLogger } from "@/components/widgets/QuickLogger";
import { MoodGrid } from "@/components/widgets/MoodGrid";
import { SleepChart } from "@/components/charts/SleepChart";
import { CravingRadar } from "@/components/charts/CravingRadar";
import { YearHeatmap } from "@/components/charts/YearHeatmap";
import { TrendingUp, Calendar, Target, Award } from "lucide-react";

const Dashboard = () => {
  const [selectedMood, setSelectedMood] = useState<string>();
  const userName = "Alex";
  const currentHour = new Date().getHours();
  
  const greeting = currentHour < 12 
    ? "Good morning" 
    : currentHour < 18 
    ? "Good afternoon" 
    : "Good evening";

  const handleQuickLog = (id: string) => {
    console.log("Logging:", id);
    // TODO: Open modal for specific log type
  };

  return (
    <DashboardLayout>
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
        {/* Wellness Score - Large */}
        <MotionCard
          className="bento-card-md row-span-2 flex items-center justify-center"
          delay={0}
          hoverLift={false}
        >
          <WellnessScore score={78} />
        </MotionCard>

        {/* Streak Widget */}
        <MotionCard className="bento-card-sm" delay={1}>
          <StreakWidget days={23} />
        </MotionCard>

        {/* Quick Stats */}
        <MotionCard className="bento-card-sm" delay={2}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">+15%</p>
              <p className="text-sm text-muted-foreground">Weekly Progress</p>
            </div>
          </div>
        </MotionCard>

        {/* Today's Goals */}
        <MotionCard className="bento-card-sm" delay={3}>
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

        {/* Days Logged */}
        <MotionCard className="bento-card-sm" delay={4}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-calm/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-calm" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">156</p>
              <p className="text-sm text-muted-foreground">Days Logged</p>
            </div>
          </div>
        </MotionCard>

        {/* Quick Logger */}
        <MotionCard className="bento-card-lg" delay={5} hoverLift={false}>
          <QuickLogger onLog={handleQuickLog} />
        </MotionCard>

        {/* Mood Grid */}
        <MotionCard className="bento-card-lg" delay={6} hoverLift={false}>
          <MoodGrid onMoodSelect={setSelectedMood} selectedMood={selectedMood} />
        </MotionCard>

        {/* Sleep Chart */}
        <MotionCard className="bento-card-lg" delay={7} hoverLift={false}>
          <SleepChart />
        </MotionCard>

        {/* Craving Radar */}
        <MotionCard className="bento-card-md" delay={8} hoverLift={false}>
          <CravingRadar />
        </MotionCard>

        {/* Achievements */}
        <MotionCard className="bento-card-sm" delay={9}>
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
        <MotionCard className="bento-card-full" delay={10} hoverLift={false}>
          <YearHeatmap />
        </MotionCard>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
