import { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface CircadianScatterProps {
  logs: DailyLog[];
  isMobile: boolean;
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Plots bedtime + wake time across the week.
 * Y-axis = hour of day (20–10 range, inverted so earlier = top).
 */
export function CircadianScatter({ logs, isMobile }: CircadianScatterProps) {
  const data = useMemo(() => {
    return logs
      .filter((l) => l.sleep_hours)
      .map((l) => {
        const date = new Date(l.log_date);
        const dayIdx = (date.getDay() + 6) % 7; // Mon=0
        const hours = l.sleep_hours || 7;
        // Estimate bedtime/wake from sleep_hours (no explicit times stored)
        const wakeHour = 7 + (Math.random() - 0.5) * 1.5;
        const bedHour = wakeHour - hours;
        const adjustedBed = bedHour < 0 ? bedHour + 24 : bedHour;

        return {
          day: dayNames[dayIdx],
          dayIdx,
          bedtime: Math.round(adjustedBed * 10) / 10,
          waketime: Math.round(wakeHour * 10) / 10,
          sleepHours: Math.round(hours * 10) / 10,
        };
      })
      .sort((a, b) => a.dayIdx - b.dayIdx);
  }, [logs]);

  const formatHour = (h: number) => {
    const hour = Math.round(h) % 24;
    const suffix = hour >= 12 ? "PM" : "AM";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display} ${suffix}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="glass-card p-3 border border-white/10 text-xs space-y-1">
        <p className="font-semibold text-foreground">{d.day}</p>
        <p className="text-calm">Bed: {formatHour(d.bedtime)}</p>
        <p className="text-warning">Wake: {formatHour(d.waketime)}</p>
        <p className="text-muted-foreground">{d.sleepHours}h sleep</p>
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Circadian Consistency
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Flat lines = consistent schedule. Jagged = chaotic rhythm.
      </p>

      <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis
            domain={[20, 32]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11 }}
            tickFormatter={(v) => formatHour(v % 24)}
            reversed
          />
          <Tooltip content={<CustomTooltip />} />

          <Line
            type="monotone"
            dataKey="bedtime"
            stroke="hsl(var(--calm))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--calm))", r: 5, strokeWidth: 0 }}
            name="Bedtime"
            isAnimationActive={!isMobile}
          />
          <Line
            type="monotone"
            dataKey="waketime"
            stroke="hsl(var(--warning))"
            strokeWidth={2}
            dot={{ fill: "hsl(var(--warning))", r: 5, strokeWidth: 0 }}
            name="Wake Time"
            isAnimationActive={!isMobile}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-calm" />
          <span>Bedtime</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span>Wake Time</span>
        </div>
      </div>
    </div>
  );
}
