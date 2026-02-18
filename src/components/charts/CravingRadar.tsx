import { useMemo } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { useData, getCravingRiskByTime } from "@/hooks/useData";

export const CravingRadar = () => {
  const { logs } = useData();
  const isMobile = useIsMobile();

  // Calculate craving risk by time of day from real data
  const chartData = useMemo(() => {
    const riskByTime = getCravingRiskByTime(logs);
    
    // Map to chart format with all time periods
    const timeMapping: Record<string, string> = {
      "Morning": "Morning",
      "Afternoon": "Afternoon", 
      "Evening": "Evening",
      "Night": "Night",
    };

    return Object.entries(timeMapping).map(([key, trigger]) => {
      const found = riskByTime.find(r => r.time === key);
      return {
        trigger,
        value: found?.risk || 0,
      };
    });
  }, [logs]);

  // Find highest risk period
  const highestRisk = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, curr) => 
      curr.value > max.value ? curr : max
    , chartData[0]);
  }, [chartData]);

  // Use mock data if no real data
  const displayData = chartData.some(d => d.value > 0) ? chartData : [
    { trigger: "Morning", value: 30 },
    { trigger: "Afternoon", value: 70 },
    { trigger: "Evening", value: 85 },
    { trigger: "Night", value: 40 },
  ];

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Risk Radar</h3>
        <p className="text-sm text-muted-foreground">Craving intensity by time of day</p>
      </div>

      <ResponsiveContainer width="100%" aspect={isMobile ? 1.2 : 1.6}>
        <RadarChart data={displayData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="trigger"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: isMobile ? 9 : 11 }}
          />
          <Radar
            name="Craving"
            dataKey="value"
            stroke="hsl(var(--alert))"
            fill="hsl(var(--alert))"
            fillOpacity={0.3}
            strokeWidth={2}
            isAnimationActive={!isMobile}
            animationDuration={1000}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-2 text-center">
        {highestRisk && highestRisk.value > 0 ? (
          <p className="text-sm text-alert">
            ⚠️ Highest risk: <span className="font-semibold">{highestRisk.trigger}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Log more entries to see patterns
          </p>
        )}
      </div>
    </motion.div>
  );
};
