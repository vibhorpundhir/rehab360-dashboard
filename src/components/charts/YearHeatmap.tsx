import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface YearHeatmapProps {
  logs: DailyLog[];
}

const moodScoreMap: Record<string, number> = {
  happy: 3, calm: 2.5, neutral: 1.5, anxious: 0.5, sad: 0.5, angry: 0,
};

function calculateWellnessScore(log: DailyLog): number {
  let score = 0;
  // Sleep quality (0-100 → 0-4)
  if (log.sleep_quality) score += (log.sleep_quality / 100) * 4;
  // Mood (0-3)
  if (log.mood_tag && moodScoreMap[log.mood_tag] !== undefined) score += moodScoreMap[log.mood_tag];
  // Craving resistance (inverse: 10→0, 0→3)
  if (log.craving_intensity !== null) score += Math.max(0, 3 * (1 - (log.craving_intensity / 10)));
  return Math.min(10, Math.round(score));
}

function getHeatColor(value: number): string {
  if (value === 0) return "bg-muted/20";
  if (value <= 2) return "bg-success/15";
  if (value <= 4) return "bg-success/30";
  if (value <= 6) return "bg-success/45";
  if (value <= 8) return "bg-success/65";
  return "bg-success/90";
}

function getMoodLabel(tag: string | null): string {
  if (!tag) return "No mood";
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

function getCravingLabel(intensity: number | null): string {
  if (intensity === null) return "N/A";
  if (intensity <= 3) return "Low";
  if (intensity <= 6) return "Medium";
  return "High";
}

export function YearHeatmap({ logs }: YearHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  // Build a lookup map from logs
  const logMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    logs.forEach((log) => map.set(log.log_date, log));
    return map;
  }, [logs]);

  // Generate 365 days of data
  const { days, weeks, goodDays } = useMemo(() => {
    const today = new Date();
    const allDays: { date: Date; dateStr: string; score: number; log: DailyLog | null }[] = [];

    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const log = logMap.get(dateStr) || null;
      const score = log ? calculateWellnessScore(log) : 0;
      allDays.push({ date, dateStr, score, log });
    }

    const weekGroups: typeof allDays[] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekGroups.push(allDays.slice(i, i + 7));
    }

    return {
      days: allDays,
      weeks: weekGroups,
      goodDays: allDays.filter((d) => d.score > 0).length,
    };
  }, [logMap]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleHover = (e: React.MouseEvent, day: typeof days[0]) => {
    if (!day.log) {
      setTooltip(null);
      return;
    }
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const sleepLabel = day.log.sleep_hours ? `${day.log.sleep_hours.toFixed(1)}h Sleep` : "No sleep data";
    const moodLabel = `Mood: ${getMoodLabel(day.log.mood_tag)}`;
    const cravingLabel = `Cravings: ${getCravingLabel(day.log.craving_intensity)}`;
    const dateLabel = day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      content: `${dateLabel}: ${sleepLabel}, ${moodLabel}, ${cravingLabel}`,
    });
  };

  return (
    <motion.div
      className="space-y-4 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Consistency Tracker</h3>
          <p className="text-sm text-muted-foreground">Real wellness scores from your logs</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-success">{goodDays}</span>
          <span className="text-muted-foreground"> / 365 days</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((day, dayIndex) => (
              <motion.div
                key={day.dateStr}
                className={cn(
                  "w-3 h-3 rounded-sm cursor-pointer transition-colors",
                  getHeatColor(day.score)
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (weekIndex * 7 + dayIndex) * 0.0008 }}
                onMouseEnter={(e) => handleHover(e, day)}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 text-xs rounded-lg bg-card border border-border shadow-lg text-foreground pointer-events-none whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 2, 4, 6, 8, 10].map((value) => (
            <div key={value} className={cn("w-3 h-3 rounded-sm", getHeatColor(value))} />
          ))}
        </div>
        <span>More</span>
      </div>
    </motion.div>
  );
}
