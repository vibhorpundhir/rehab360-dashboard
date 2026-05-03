import { useMemo, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface YearHeatmapProps {
  logs: DailyLog[];
}

const moodScoreMap: Record<string, number> = {
  happy: 3, calm: 2.5, neutral: 1.5, anxious: 0.5, sad: 0.5, angry: 0,
};

type HeatmapDay = {
  date: Date;
  dateStr: string;
  score: number;
  log: DailyLog | null;
  inYear: boolean;
  isFuture: boolean;
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
const dayMs = 24 * 60 * 60 * 1000;

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysBetween(start: Date, end: Date): number {
  return Math.round(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      dayMs
  );
}

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

function getHeatColor(day: HeatmapDay): string {
  if (!day.inYear) return "bg-transparent border-transparent";
  if (day.isFuture) return "bg-muted/10 border-border/30 opacity-50";
  if (!day.log || day.score === 0) return "bg-muted/20 border-border/40";
  if (day.score <= 2) return "bg-destructive/55 border-destructive/50";
  if (day.score <= 4) return "bg-warning/55 border-warning/45";
  if (day.score <= 6) return "bg-primary/50 border-primary/45";
  if (day.score <= 8) return "bg-success/65 border-success/50";
  return "bg-success/90 border-success/70";
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
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);

  const logMap = useMemo(() => {
    const map = new Map<string, DailyLog>();
    logs.forEach((log) => map.set(log.log_date, log));
    return map;
  }, [logs]);

  const { days, weeks, loggedDays, elapsedDays, totalYearDays, currentYear, monthLabels } = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const todayStart = new Date(year, today.getMonth(), today.getDate());
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const firstWeekdayOffset = yearStart.getDay();
    const yearDayCount = getDaysBetween(yearStart, yearEnd) + 1;
    const cellCount = Math.ceil((firstWeekdayOffset + yearDayCount) / 7) * 7;
    const allDays: HeatmapDay[] = [];

    for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
      const dateOffset = cellIndex - firstWeekdayOffset;
      const date = new Date(year, 0, 1 + dateOffset);
      const inYear = dateOffset >= 0 && dateOffset < yearDayCount;
      const isFuture = inYear && date.getTime() > todayStart.getTime();
      const dateStr = getLocalDateKey(date);
      const log = inYear && !isFuture ? logMap.get(dateStr) || null : null;
      allDays.push({
        date,
        dateStr,
        score: log ? calculateWellnessScore(log) : 0,
        log,
        inYear,
        isFuture,
      });
    }

    const weekGroups: HeatmapDay[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekGroups.push(allDays.slice(i, i + 7));
    }

    const monthColumns = monthNames.map((label, monthIndex) => {
      const monthStart = new Date(year, monthIndex, 1);
      const column = Math.floor((firstWeekdayOffset + getDaysBetween(yearStart, monthStart)) / 7);
      return { label, column };
    });

    return {
      days: allDays,
      weeks: weekGroups,
      loggedDays: allDays.filter((d) => d.inYear && !d.isFuture && d.log).length,
      elapsedDays: getDaysBetween(yearStart, todayStart) + 1,
      totalYearDays: yearDayCount,
      currentYear: year,
      monthLabels: monthColumns,
    };
  }, [logMap]);

  const handleClick = (day: HeatmapDay) => {
    if (!day.inYear) return;
    setSelectedDay((prev) => (prev?.dateStr === day.dateStr ? null : day));
  };

  const handleHover = (e: MouseEvent<HTMLElement>, day: typeof days[0]) => {
    if (!day.inYear) {
      setTooltip(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const dateLabel = day.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const content = day.isFuture
      ? `${dateLabel}: Future date`
      : day.log
      ? `${dateLabel}: Score ${day.score}/10, ${day.log.sleep_hours ? `${day.log.sleep_hours.toFixed(1)}h Sleep` : "No sleep data"}, Mood: ${getMoodLabel(day.log.mood_tag)}, Cravings: ${getCravingLabel(day.log.craving_intensity)}`
      : `${dateLabel}: No wellness log`;
    setTooltip({
      x: Math.min(Math.max(rect.left + rect.width / 2, 150), window.innerWidth - 150),
      y: rect.top - 8,
      content,
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
          <h3 className="text-lg font-semibold text-foreground">Consistency Tracker {currentYear}</h3>
          <p className="text-sm text-muted-foreground">Current year wellness activity</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-success">{loggedDays}</span>
          <span className="text-muted-foreground"> / {elapsedDays} days</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-max">
          <div
            className="ml-8 grid gap-[3px] text-xs text-muted-foreground"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, 0.75rem)` }}
          >
            {monthLabels.map((month) => (
              <span key={month.label} className="whitespace-nowrap" style={{ gridColumnStart: month.column + 1 }}>
                {month.label}
              </span>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <div className="grid grid-rows-7 gap-[3px] text-[10px] leading-3 text-muted-foreground w-6 shrink-0">
              {weekdayLabels.map((label, index) => (
                <span key={`${label}-${index}`} className="h-3 flex items-center justify-end pr-1">
                  {label}
                </span>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => (
                    <motion.div
                      key={`${day.dateStr}-${weekIndex}-${dayIndex}`}
                      className={cn(
                        "w-3 h-3 rounded-[3px] border transition-colors",
                        day.inYear ? "cursor-pointer" : "cursor-default",
                      getHeatColor(day),
                      selectedDay?.dateStr === day.dateStr && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      )}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: (weekIndex * 7 + dayIndex) * 0.0008 }}
                      onMouseEnter={(e) => handleHover(e, day)}
                      onMouseLeave={() => setTooltip(null)}
                     onClick={() => handleClick(day)}
                      aria-label={day.inYear ? `${day.dateStr} wellness score ${day.score}` : "Outside current year"}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 max-w-80 px-3 py-2 text-xs rounded-lg bg-card border border-border shadow-lg text-foreground pointer-events-none"
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
        <span>No data</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-[3px] border bg-muted/20 border-border/40" />
          {[2, 4, 6, 8, 10].map((value) => {
            const sampleDay: HeatmapDay = { date: new Date(), dateStr: "", score: value, log: {} as DailyLog, inYear: true, isFuture: false };
            return <div key={value} className={cn("w-3 h-3 rounded-[3px] border", getHeatColor(sampleDay))} />;
          })}
        </div>
        <span>High</span>
        <span className="ml-3">{totalYearDays}-day year</span>
      </div>

      {/* Selected Day Detail Panel */}
      <AnimatePresence>
        {selectedDay && selectedDay.inYear && (
          <motion.div
            key={selectedDay.dateStr}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">
                  {selectedDay.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h4>
                {selectedDay.isFuture ? (
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted/20">Future</span>
                ) : selectedDay.log ? (
                  <span className="text-xs font-bold text-success px-2 py-1 rounded-full bg-success/15">Score: {selectedDay.score}/10</span>
                ) : (
                  <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted/20">No data</span>
                )}
              </div>
              {selectedDay.log && !selectedDay.isFuture ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-0.5">Sleep</p>
                    <p className="font-medium text-foreground">{selectedDay.log.sleep_hours ? `${selectedDay.log.sleep_hours}h` : "—"} {selectedDay.log.sleep_quality ? `(${selectedDay.log.sleep_quality}%)` : ""}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-0.5">Mood</p>
                    <p className="font-medium text-foreground">{getMoodLabel(selectedDay.log.mood_tag)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-0.5">Cravings</p>
                    <p className="font-medium text-foreground">{getCravingLabel(selectedDay.log.craving_intensity)}{selectedDay.log.craving_trigger ? ` — ${selectedDay.log.craving_trigger}` : ""}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-0.5">Water</p>
                    <p className="font-medium text-foreground">{selectedDay.log.water_glasses ?? 0} glasses</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-0.5">Exercise</p>
                    <p className="font-medium text-foreground">{selectedDay.log.exercise_minutes ?? 0} min</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-0.5">Meditation</p>
                    <p className="font-medium text-foreground">{selectedDay.log.meditation_minutes ?? 0} min</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-0.5">Meds</p>
                    <p className="font-medium text-foreground">{selectedDay.log.took_meds ? "✅ Taken" : "❌ Not taken"}</p>
                  </div>
                  {selectedDay.log.notes && (
                    <div className="p-2 rounded-lg bg-muted/10 col-span-2 sm:col-span-1">
                      <p className="text-muted-foreground mb-0.5">Notes</p>
                      <p className="font-medium text-foreground truncate">{selectedDay.log.notes}</p>
                    </div>
                  )}
                </div>
              ) : !selectedDay.isFuture ? (
                <p className="text-sm text-muted-foreground">No wellness data logged for this day.</p>
              ) : (
                <p className="text-sm text-muted-foreground">This date hasn't arrived yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
