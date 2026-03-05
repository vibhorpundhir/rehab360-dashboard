import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface SleepStagesChartProps {
  sleepHours: number;
  isMobile: boolean;
}

/**
 * Generates realistic stacked sleep-stage data.
 * Structure: { time, deep, light, rem, awake } — all values sum to 100 per row.
 */
function generateStages(totalHours: number) {
  const points: { time: string; deep: number; light: number; rem: number; awake: number }[] = [];
  const intervals = Math.max(8, Math.round(totalHours * 6)); // ~10 min intervals

  for (let i = 0; i <= intervals; i++) {
    const progress = i / intervals; // 0..1
    const hourOffset = progress * totalHours;
    const displayH = Math.floor(23 + hourOffset) % 24;
    const displayM = Math.round((hourOffset % 1) * 60);
    const time = `${String(displayH).padStart(2, "0")}:${String(displayM).padStart(2, "0")}`;

    // Realistic sleep architecture curves
    const deepBase = progress < 0.5
      ? 30 + 25 * Math.sin(progress * Math.PI * 2)
      : Math.max(5, 15 - progress * 20);
    const remBase = progress > 0.3
      ? 20 + 20 * Math.sin((progress - 0.3) * Math.PI * 2.5)
      : 5;
    const awakeBase = progress < 0.05 || progress > 0.95 ? 15 : Math.random() * 3;

    const deep = Math.max(0, Math.round(deepBase + (Math.random() - 0.5) * 8));
    const rem = Math.max(0, Math.round(remBase + (Math.random() - 0.5) * 6));
    const awake = Math.max(0, Math.round(awakeBase));
    const light = Math.max(0, 100 - deep - rem - awake);

    points.push({ time, deep, light, rem, awake });
  }
  return points;
}

const StageTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 border border-white/10 text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

export function SleepStagesChart({ sleepHours, isMobile }: SleepStagesChartProps) {
  const data = useMemo(() => generateStages(sleepHours), [sleepHours]);

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11 }}
          interval={Math.floor(data.length / (isMobile ? 4 : 6))}
        />
        <YAxis hide domain={[0, 100]} />
        <Tooltip content={<StageTooltip />} />

        {/* Order matters for stacking: bottom → top */}
        <Area
          type="monotone"
          dataKey="deep"
          stackId="sleep"
          stroke="#4c1d95"
          fill="#4c1d95"
          fillOpacity={0.85}
          name="Deep Sleep"
          isAnimationActive={!isMobile}
          animationDuration={1200}
        />
        <Area
          type="monotone"
          dataKey="rem"
          stackId="sleep"
          stroke="#2dd4bf"
          fill="#2dd4bf"
          fillOpacity={0.7}
          name="REM"
          isAnimationActive={!isMobile}
          animationDuration={1200}
        />
        <Area
          type="monotone"
          dataKey="light"
          stackId="sleep"
          stroke="#c4b5fd"
          fill="#c4b5fd"
          fillOpacity={0.5}
          name="Light Sleep"
          isAnimationActive={!isMobile}
          animationDuration={1200}
        />
        <Area
          type="monotone"
          dataKey="awake"
          stackId="sleep"
          stroke="#f43f5e"
          fill="#f43f5e"
          fillOpacity={0.6}
          name="Awake"
          isAnimationActive={!isMobile}
          animationDuration={1200}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
