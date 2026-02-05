import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  AlertTriangle, 
  Moon, 
  Flame, 
  TrendingUp, 
  Shield, 
  Sparkles,
  Brain,
  Zap
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface InsightEngineProps {
  logs: DailyLog[];
  className?: string;
}

interface Insight {
  id: string;
  type: "warning" | "success" | "info" | "critical";
  icon: React.ReactNode;
  title: string;
  description: string;
  metric?: string;
}

export function InsightEngine({ logs, className }: InsightEngineProps) {
  const insights = useMemo(() => {
    const result: Insight[] = [];
    
    if (logs.length === 0) {
      return [{
        id: "no-data",
        type: "info" as const,
        icon: <Brain className="w-5 h-5" />,
        title: "Start Tracking",
        description: "Log your first entry to unlock personalized insights.",
      }];
    }

    // Get recent logs (last 7 days)
    const recentLogs = logs.slice(0, 7);
    const today = recentLogs[0];
    
    // Calculate metrics
    const avgSleepHours = recentLogs.reduce((sum, log) => 
      sum + (log.sleep_hours || 0), 0) / recentLogs.filter(l => l.sleep_hours).length || 0;
    
    const avgSleepQuality = recentLogs.reduce((sum, log) => 
      sum + (log.sleep_quality || 0), 0) / recentLogs.filter(l => l.sleep_quality).length || 0;
    
    const avgCravingIntensity = recentLogs.reduce((sum, log) => 
      sum + (log.craving_intensity || 0), 0) / recentLogs.filter(l => l.craving_intensity).length || 0;

    // Check for consecutive days of consistent sleep (3+ days)
    const consistentSleepDays = recentLogs.filter(log => 
      log.sleep_hours && log.sleep_hours >= 7 && log.sleep_hours <= 9
    ).length;

    // CRITICAL: Sleep deprivation + high craving correlation
    if (avgSleepHours < 6 && avgCravingIntensity > 7) {
      result.push({
        id: "critical-correlation",
        type: "critical",
        icon: <AlertTriangle className="w-5 h-5" />,
        title: "High Risk Alert",
        description: "Your craving sensitivity is up 40% due to sleep deprivation. Prioritize rest tonight.",
        metric: `${(avgCravingIntensity * 1.4).toFixed(0)}% sensitivity`,
      });
    }

    // WARNING: Low sleep quality affecting cravings
    if (avgSleepQuality < 60 && avgCravingIntensity > 5) {
      result.push({
        id: "quality-warning",
        type: "warning",
        icon: <Moon className="w-5 h-5" />,
        title: "Sleep Quality Impact",
        description: `Poor sleep quality (${avgSleepQuality.toFixed(0)}%) is linked to elevated cravings. Consider a calming bedtime routine.`,
        metric: `${avgSleepQuality.toFixed(0)}% quality`,
      });
    }

    // SUCCESS: Consistent sleep pattern
    if (consistentSleepDays >= 3) {
      result.push({
        id: "recovery-baseline",
        type: "success",
        icon: <Shield className="w-5 h-5" />,
        title: "Recovery Baseline Achieved",
        description: `${consistentSleepDays} days of optimal sleep! Your emotional stability is peaking.`,
        metric: `${consistentSleepDays}-day streak`,
      });
    }

    // INFO: Sleep debt calculation
    const sleepDebt = recentLogs.reduce((debt, log) => {
      return debt + Math.max(0, 8 - (log.sleep_hours || 0));
    }, 0);

    if (sleepDebt > 5) {
      result.push({
        id: "sleep-debt",
        type: "warning",
        icon: <Zap className="w-5 h-5" />,
        title: "Sleep Debt Accumulating",
        description: `You've accumulated ${sleepDebt.toFixed(1)}h of sleep debt this week. Consider an earlier bedtime.`,
        metric: `${sleepDebt.toFixed(1)}h debt`,
      });
    }

    // SUCCESS: Low craving average
    if (avgCravingIntensity < 4 && logs.length >= 3) {
      result.push({
        id: "low-craving",
        type: "success",
        icon: <TrendingUp className="w-5 h-5" />,
        title: "Craving Control Strong",
        description: `Average intensity at ${avgCravingIntensity.toFixed(1)}/10. Your coping strategies are working!`,
        metric: `${avgCravingIntensity.toFixed(1)}/10`,
      });
    }

    // Check for improvement trend
    if (recentLogs.length >= 3) {
      const recentAvg = recentLogs.slice(0, 3).reduce((sum, log) => 
        sum + (log.craving_intensity || 5), 0) / 3;
      const olderAvg = recentLogs.slice(-3).reduce((sum, log) => 
        sum + (log.craving_intensity || 5), 0) / 3;
      
      if (recentAvg < olderAvg - 1) {
        result.push({
          id: "improving-trend",
          type: "success",
          icon: <Sparkles className="w-5 h-5" />,
          title: "Positive Momentum",
          description: `Cravings trending down ${((olderAvg - recentAvg) / olderAvg * 100).toFixed(0)}% compared to earlier this week.`,
          metric: `-${(olderAvg - recentAvg).toFixed(1)} intensity`,
        });
      }
    }

    // If no specific insights, provide general encouragement
    if (result.length === 0) {
      result.push({
        id: "general-info",
        type: "info",
        icon: <Brain className="w-5 h-5" />,
        title: "Keep Tracking",
        description: "Continue logging to unlock deeper insights about your patterns.",
      });
    }

    return result.slice(0, 3); // Show max 3 insights
  }, [logs]);

  const getTypeConfig = (type: Insight["type"]) => {
    switch (type) {
      case "critical":
        return {
          bg: "bg-alert/10",
          border: "border-alert/30",
          iconBg: "bg-alert/20",
          iconColor: "text-alert",
          glow: "shadow-[0_0_20px_-5px_hsl(var(--alert)/0.5)]",
        };
      case "warning":
        return {
          bg: "bg-warning/10",
          border: "border-warning/30",
          iconBg: "bg-warning/20",
          iconColor: "text-warning",
          glow: "",
        };
      case "success":
        return {
          bg: "bg-success/10",
          border: "border-success/30",
          iconBg: "bg-success/20",
          iconColor: "text-success",
          glow: "shadow-[0_0_20px_-5px_hsl(var(--success)/0.3)]",
        };
      default:
        return {
          bg: "bg-primary/10",
          border: "border-primary/30",
          iconBg: "bg-primary/20",
          iconColor: "text-primary",
          glow: "",
        };
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Smart Insights</h3>
      </div>

      <AnimatePresence mode="popLayout">
        {insights.map((insight, index) => {
          const config = getTypeConfig(insight.type);
          
          return (
            <motion.div
              key={insight.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-xl border",
                config.bg,
                config.border,
                config.glow,
                insight.type === "critical" && "animate-pulse"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  config.iconBg
                )}>
                  <span className={config.iconColor}>{insight.icon}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-foreground text-sm">
                      {insight.title}
                    </h4>
                    {insight.metric && (
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        config.bg,
                        config.iconColor
                      )}>
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
