import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface BiologicalRadarProps {
  logs: DailyLog[];
  className?: string;
}

export function BiologicalRadar({ logs, className }: BiologicalRadarProps) {
  const isMobile = useIsMobile();

  const data = useMemo(() => {
    const recent = logs.slice(0, 7);
    if (recent.length === 0) return null;

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const sleepScores = recent.filter(l => l.sleep_quality).map(l => l.sleep_quality!);
    const cravings = recent.filter(l => l.craving_intensity !== null).map(l => l.craving_intensity!);
    const water = recent.filter(l => l.water_glasses !== null).map(l => l.water_glasses!);
    const exercise = recent.filter(l => l.exercise_minutes !== null).map(l => l.exercise_minutes!);
    const moods = recent.filter(l => l.mood_tag).map(l => {
      const scores: Record<string, number> = { happy: 100, calm: 80, neutral: 60, anxious: 30, sad: 20, angry: 10 };
      return scores[l.mood_tag!] ?? 50;
    });

    return [
      { axis: "Sleep", value: Math.min(100, avg(sleepScores)), fullMark: 100 },
      { axis: "Mood", value: Math.min(100, avg(moods)), fullMark: 100 },
      { axis: "Hydration", value: Math.min(100, (avg(water) / 8) * 100), fullMark: 100 },
      { axis: "Craving Resist.", value: Math.min(100, avg(cravings.map(c => (10 - c) * 10))), fullMark: 100 },
      { axis: "Activity", value: Math.min(100, (avg(exercise) / 60) * 100), fullMark: 100 },
    ];
  }, [logs]);

  if (!data) return null;

  return (
    <motion.div
      className={cn("h-full", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-1">Biological Balance</h3>
      <p className="text-xs text-muted-foreground mb-4">Are you neglecting any health area?</p>

      <ResponsiveContainer width="100%" aspect={isMobile ? 1 : 1.2}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Balance"
            dataKey="value"
            stroke="hsl(262 83% 66%)"
            fill="hsl(262 83% 66%)"
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={!isMobile}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
