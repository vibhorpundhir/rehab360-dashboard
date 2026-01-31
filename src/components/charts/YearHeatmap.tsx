import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Generate sample heatmap data for the year
const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random value weighted towards better days
    const value = Math.random() > 0.2 
      ? Math.floor(Math.random() * 4) + 1  // 1-4 (good to great)
      : 0; // 0 (no log or bad day)
    
    data.push({
      date,
      value,
    });
  }
  
  return data;
};

const heatmapData = generateHeatmapData();

const getColor = (value: number) => {
  switch (value) {
    case 0: return "bg-muted/30";
    case 1: return "bg-success/20";
    case 2: return "bg-success/40";
    case 3: return "bg-success/60";
    case 4: return "bg-success/90";
    default: return "bg-muted/30";
  }
};

export const YearHeatmap = () => {
  // Group data by week
  const weeks: typeof heatmapData[] = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const goodDays = heatmapData.filter(d => d.value > 0).length;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Year in Review</h3>
          <p className="text-sm text-muted-foreground">Good mental health days</p>
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
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <motion.div
                key={`${weekIndex}-${dayIndex}`}
                className={cn(
                  "w-3 h-3 rounded-sm",
                  getColor(day.value)
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (weekIndex * 7 + dayIndex) * 0.001 }}
                title={`${day.date.toLocaleDateString()}: ${day.value > 0 ? 'Good day' : 'No log'}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((value) => (
            <div
              key={value}
              className={cn("w-3 h-3 rounded-sm", getColor(value))}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </motion.div>
  );
};
