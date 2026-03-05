import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface SleepDebtWaterfallProps {
  logs: DailyLog[];
  isMobile: boolean;
}

const GOAL = 8;
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SleepDebtWaterfall({ logs, isMobile }: SleepDebtWaterfallProps) {
  const data = useMemo(() => {
    return logs
      .filter((l) => l.sleep_hours)
      .map((l) => {
        const date = new Date(l.log_date);
        const day = dayNames[date.getDay()];
        const diff = Math.round(((l.sleep_hours || 0) - GOAL) * 10) / 10;
        return { day, diff, hours: l.sleep_hours || 0 };
      })
      .reverse(); // chronological
  }, [logs]);

  const totalDebt = useMemo(
    () => Math.round(data.reduce((s, d) => s + d.diff, 0) * 10) / 10,
    [data]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="glass-card p-3 border border-white/10 text-xs space-y-1">
        <p className="font-semibold text-foreground">{d.day}</p>
        <p className="text-muted-foreground">Slept: {d.hours}h</p>
        <p className={d.diff >= 0 ? "text-success" : "text-alert"}>
          {d.diff >= 0 ? "+" : ""}{d.diff}h vs {GOAL}h goal
        </p>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Sleep Debt Tracker
          </h3>
          <p className="text-xs text-muted-foreground">
            Daily surplus / deficit vs {GOAL}h goal
          </p>
        </div>
        <div className="text-right">
          <span className={`text-xl font-bold ${totalDebt >= 0 ? "text-success" : "text-alert"}`}>
            {totalDebt >= 0 ? "+" : ""}{totalDebt}h
          </span>
          <p className="text-xs text-muted-foreground">Weekly balance</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 10 : 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11 }}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}h`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.5} />

          <Bar
            dataKey="diff"
            radius={[4, 4, 0, 0]}
            isAnimationActive={!isMobile}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.diff >= 0 ? "hsl(var(--success))" : "hsl(var(--alert))"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
