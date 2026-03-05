import { useMemo } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface DailyMomentumRingsProps {
  logs: DailyLog[];
  className?: string;
}

export function DailyMomentumRings({ logs, className }: DailyMomentumRingsProps) {
  const isMobile = useIsMobile();

  const ringData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayLog = logs.find((l) => l.log_date === today);

    const waterPct = todayLog?.water_glasses ? Math.min(100, (todayLog.water_glasses / 8) * 100) : 0;
    const exercisePct = todayLog?.exercise_minutes ? Math.min(100, (todayLog.exercise_minutes / 30) * 100) : 0;
    const meditationPct = todayLog?.meditation_minutes ? Math.min(100, (todayLog.meditation_minutes / 15) * 100) : 0;

    return [
      { name: "Meditation", value: meditationPct, fill: "hsl(var(--primary))", goal: "15 min" },
      { name: "Exercise", value: exercisePct, fill: "hsl(var(--success))", goal: "30 min" },
      { name: "Water", value: waterPct, fill: "hsl(var(--calm))", goal: "8 glasses" },
    ];
  }, [logs]);

  const completedCount = ringData.filter((r) => r.value >= 100).length;

  return (
    <motion.div
      className={cn("h-full", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Daily Momentum</h3>
          <p className="text-xs text-muted-foreground">Close your rings today</p>
        </div>
        <span className="text-sm font-bold text-success">{completedCount}/3</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" aspect={1}>
            <RadialBarChart
              innerRadius="30%"
              outerRadius="100%"
              data={ringData}
              startAngle={90}
              endAngle={-270}
              barSize={isMobile ? 8 : 10}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={!isMobile}
                animationDuration={1200}
                background={{ fill: "hsl(var(--muted) / 0.3)" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {ringData.map((ring) => (
            <div key={ring.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ring.fill }} />
              <div>
                <p className="text-xs font-medium text-foreground">{ring.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {ring.value >= 100 ? "✓ Done" : `${Math.round(ring.value)}% of ${ring.goal}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
