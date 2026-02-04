import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useData, getLogsForDays } from "@/hooks/useData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-white/10">
        <p className="text-foreground font-semibold">{label}</p>
        <p className="text-calm text-sm">
          {payload[0]?.value?.toFixed(1)} hours
        </p>
        {payload[1] && (
          <p className="text-primary text-sm">
            Quality: {payload[1].value}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const SleepChart = () => {
  const { logs } = useData();
  const last7Days = getLogsForDays(logs, 7);

  // Transform logs to chart data
  const chartData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    return last7Days
      .map((log) => {
        const date = new Date(log.log_date);
        return {
          day: dayNames[date.getDay()],
          hours: log.sleep_hours || 0,
          quality: log.sleep_quality || 0,
          date: log.log_date,
        };
      })
      .reverse(); // Show oldest first
  }, [last7Days]);

  // Use mock data if no real data
  const displayData = chartData.length > 0 ? chartData : [
    { day: "Mon", hours: 6.5, quality: 65 },
    { day: "Tue", hours: 7.2, quality: 78 },
    { day: "Wed", hours: 5.8, quality: 52 },
    { day: "Thu", hours: 8.0, quality: 88 },
    { day: "Fri", hours: 7.5, quality: 82 },
    { day: "Sat", hours: 8.5, quality: 90 },
    { day: "Sun", hours: 7.0, quality: 75 },
  ];

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Sleep This Week</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-calm" />
            <span className="text-muted-foreground">Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Quality</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--calm))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--calm))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="hsl(var(--calm))"
            strokeWidth={2}
            fill="url(#sleepGradient)"
            isAnimationActive={true}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
