import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const cravingData = [
  { trigger: "Morning", value: 30 },
  { trigger: "Midday", value: 45 },
  { trigger: "Afternoon", value: 70 },
  { trigger: "Evening", value: 85 },
  { trigger: "Night", value: 60 },
  { trigger: "Late Night", value: 40 },
];

export const CravingRadar = () => {
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

      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={cravingData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="hsl(217, 33%, 25%)" />
          <PolarAngleAxis
            dataKey="trigger"
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
          />
          <Radar
            name="Craving"
            dataKey="value"
            stroke="hsl(350, 89%, 60%)"
            fill="hsl(350, 89%, 60%)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-2 text-center">
        <p className="text-sm text-alert">
          ⚠️ Highest risk: <span className="font-semibold">Evening (5-8 PM)</span>
        </p>
      </div>
    </motion.div>
  );
};
