import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface CorrelationChartProps {
  logs: DailyLog[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-white/10 min-w-[150px]">
        <p className="text-foreground font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.name === "Sleep Quality" 
                ? `${entry.value}%` 
                : `${entry.value}/10`}
            </span>
          </div>
        ))}
        {/* Correlation insight */}
        {payload.length >= 2 && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/10">
            {payload[0].value < 60 && payload[1].value > 6 
              ? "⚠️ Low sleep = higher cravings"
              : payload[0].value >= 70 && payload[1].value < 4
              ? "✨ Good sleep = better control"
              : ""}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function CorrelationChart({ logs, className }: CorrelationChartProps) {
  const chartData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Get last 14 days of data
    const last14Days = logs.slice(0, 14);
    
    return last14Days
      .map((log) => {
        const date = new Date(log.log_date);
        const dayNum = date.getDate();
        const dayName = dayNames[date.getDay()];
        
        return {
          date: `${dayName} ${dayNum}`,
          sleepQuality: log.sleep_quality || 0,
          cravingIntensity: log.craving_intensity || 0,
          sleepHours: log.sleep_hours || 0,
        };
      })
      .reverse();
  }, [logs]);

  // Calculate correlation insight
  const correlation = useMemo(() => {
    if (chartData.length < 3) return null;
    
    const lowSleepHighCraving = chartData.filter(
      d => d.sleepQuality < 60 && d.cravingIntensity > 6
    ).length;
    
    const highSleepLowCraving = chartData.filter(
      d => d.sleepQuality >= 70 && d.cravingIntensity < 4
    ).length;
    
    const correlationStrength = ((highSleepLowCraving + lowSleepHighCraving) / chartData.length) * 100;
    
    return {
      strength: correlationStrength,
      insight: correlationStrength > 50 
        ? "Strong correlation detected between sleep and cravings"
        : "Building pattern data...",
    };
  }, [chartData]);

  // Fallback mock data if no real data
  const displayData = chartData.length > 0 ? chartData : [
    { date: "Mon 1", sleepQuality: 65, cravingIntensity: 7 },
    { date: "Tue 2", sleepQuality: 78, cravingIntensity: 5 },
    { date: "Wed 3", sleepQuality: 52, cravingIntensity: 8 },
    { date: "Thu 4", sleepQuality: 88, cravingIntensity: 3 },
    { date: "Fri 5", sleepQuality: 42, cravingIntensity: 9 },
    { date: "Sat 6", sleepQuality: 90, cravingIntensity: 2 },
    { date: "Sun 7", sleepQuality: 75, cravingIntensity: 4 },
  ];

  return (
    <motion.div
      className={cn("h-full", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Recovery Correlation
          </h3>
          <p className="text-xs text-muted-foreground">
            Sleep Quality vs Craving Intensity
          </p>
        </div>
        
        {correlation && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{correlation.insight}</p>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="sleepBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            opacity={0.3} 
            vertical={false}
          />
          
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            interval={displayData.length > 7 ? 1 : 0}
          />
          
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            domain={[0, 10]}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
            iconType="circle"
            iconSize={8}
          />
          
          <Bar
            yAxisId="left"
            dataKey="sleepQuality"
            name="Sleep Quality"
            fill="url(#sleepBarGradient)"
            radius={[4, 4, 0, 0]}
            barSize={20}
            isAnimationActive={true}
            animationDuration={800}
          />
          
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cravingIntensity"
            name="Craving Intensity"
            stroke="hsl(var(--alert))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--alert))", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "hsl(var(--alert))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1200}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Visual Legend for correlation */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Higher = Better Sleep</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-alert" />
          <span>Lower = Better Control</span>
        </div>
      </div>
    </motion.div>
  );
}
