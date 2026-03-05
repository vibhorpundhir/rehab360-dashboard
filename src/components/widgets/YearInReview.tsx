import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Moon, Shield, Flame } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface YearInReviewProps {
  logs: DailyLog[];
  userName?: string;
  className?: string;
}

export function YearInReview({ logs, userName = "there", className }: YearInReviewProps) {
  const stats = useMemo(() => {
    if (logs.length === 0) return null;

    // Total clean days (craving < 3)
    const cleanDays = logs.filter(
      (l) => l.craving_intensity !== null && l.craving_intensity < 3
    ).length;

    // Sleep debt recovered (total hours vs 7h baseline)
    const totalSleepHours = logs.reduce((sum, l) => sum + (l.sleep_hours || 0), 0);
    const baselineHours = logs.filter((l) => l.sleep_hours).length * 7;
    const sleepSurplus = Math.round((totalSleepHours - baselineHours) * 10) / 10;

    // Top trigger
    const triggerCounts: Record<string, number> = {};
    logs.forEach((l) => {
      if (l.craving_trigger) {
        triggerCounts[l.craving_trigger] = (triggerCounts[l.craving_trigger] || 0) + 1;
      }
    });
    const topTrigger =
      Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet";

    // Best streak of clean days
    let currentStreak = 0;
    let bestStreak = 0;
    const sorted = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
    sorted.forEach((l) => {
      if (l.craving_intensity !== null && l.craving_intensity < 3) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return { cleanDays, sleepSurplus, topTrigger, bestStreak, totalDays: logs.length };
  }, [logs]);

  if (!stats) return null;

  const kpis = [
    {
      label: "Clean Days",
      value: stats.cleanDays,
      suffix: `/ ${stats.totalDays}`,
      icon: <Shield className="w-6 h-6" />,
      color: "text-success",
      bg: "bg-success/10",
      glow: "shadow-glow-success",
    },
    {
      label: "Sleep Surplus",
      value: stats.sleepSurplus > 0 ? `+${stats.sleepSurplus}` : `${stats.sleepSurplus}`,
      suffix: "hrs vs 7h/night",
      icon: <Moon className="w-6 h-6" />,
      color: "text-calm",
      bg: "bg-calm/10",
      glow: "shadow-glow-teal",
    },
    {
      label: "Top Trigger",
      value: stats.topTrigger.charAt(0).toUpperCase() + stats.topTrigger.slice(1),
      suffix: "most logged",
      icon: <Flame className="w-6 h-6" />,
      color: "text-alert",
      bg: "bg-alert/10",
      glow: "shadow-glow-alert",
    },
    {
      label: "Best Streak",
      value: stats.bestStreak,
      suffix: "days clean",
      icon: <Sparkles className="w-6 h-6" />,
      color: "text-primary",
      bg: "bg-primary/10",
      glow: "shadow-glow-violet",
    },
  ];

  return (
    <motion.div
      className={cn("space-y-6", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Hey <span className="gradient-text">{userName}</span>, here's your progress 🎉
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your wellness journey at a glance
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className={cn(
              "glass-card p-5 text-center",
              kpi.glow
            )}
          >
            <div className={cn("w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center", kpi.bg)}>
              <span className={kpi.color}>{kpi.icon}</span>
            </div>
            <p className={cn("text-3xl font-bold", kpi.color)}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.suffix}</p>
            <p className="text-xs font-medium text-foreground mt-2">{kpi.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
