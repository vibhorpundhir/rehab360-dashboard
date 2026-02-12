import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;
type DailyLogInsert = TablesInsert<"daily_logs">;

interface UseDataReturn {
  logs: DailyLog[];
  isLoading: boolean;
  error: string | null;
  addLog: (log: Partial<DailyLogInsert>) => Promise<void>;
  updateLog: (id: string, updates: Partial<DailyLog>) => Promise<void>;
  refetch: () => Promise<void>;
}

const STORAGE_KEY = "rehab360_logs";

// Mock data for development/demo
const mockLogs: DailyLog[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  return {
    id: `mock-${i}`,
    user_id: "mock-user",
    log_date: date.toISOString().split("T")[0],
    sleep_hours: 5 + Math.random() * 4,
    sleep_quality: Math.floor(50 + Math.random() * 50),
    craving_intensity: Math.floor(1 + Math.random() * 9),
    craving_time: ["08:00", "14:00", "20:00", "23:00"][Math.floor(Math.random() * 4)],
    craving_trigger: ["stress", "boredom", "social", "habit"][Math.floor(Math.random() * 4)],
    mood_tag: ["happy", "calm", "anxious", "sad", "angry"][Math.floor(Math.random() * 5)],
    water_glasses: Math.floor(Math.random() * 10),
    exercise_minutes: Math.floor(Math.random() * 60),
    meditation_minutes: Math.floor(Math.random() * 30),
    took_meds: Math.random() > 0.3,
    notes: null,
    created_at: date.toISOString(),
    updated_at: date.toISOString(),
  };
});

function loadFromStorage(): DailyLog[] | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveToStorage(logs: DailyLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {}
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useData(): UseDataReturn {
  const [logs, setLogs] = useState<DailyLog[]>(() => loadFromStorage() || mockLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist to localStorage whenever logs change
  useEffect(() => {
    saveToStorage(logs);
  }, [logs]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not authenticated — keep current state (localStorage or mock)
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(30);

      if (fetchError) throw fetchError;
      
      if (data?.length) {
        setLogs(data);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLog = useCallback(async (log: Partial<DailyLogInsert>) => {
    const logDate = log.log_date || new Date().toISOString().split("T")[0];

    // Merge with existing same-day entry in local state (so vitals don't overwrite journal, etc.)
    const existing = logs.find((l) => l.log_date === logDate);
    const merged: Partial<DailyLogInsert> = {
      ...(existing ? {
        sleep_hours: existing.sleep_hours,
        sleep_quality: existing.sleep_quality,
        craving_intensity: existing.craving_intensity,
        craving_time: existing.craving_time,
        craving_trigger: existing.craving_trigger,
        mood_tag: existing.mood_tag,
        water_glasses: existing.water_glasses,
        exercise_minutes: existing.exercise_minutes,
        meditation_minutes: existing.meditation_minutes,
        took_meds: existing.took_meds,
        notes: existing.notes,
      } : {}),
      // New values override existing
      ...Object.fromEntries(Object.entries(log).filter(([, v]) => v !== undefined)),
      log_date: logDate,
    };

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticLog: DailyLog = {
      id: existing?.id || tempId,
      user_id: existing?.user_id || "pending",
      log_date: logDate,
      sleep_hours: (merged.sleep_hours as number) ?? null,
      sleep_quality: (merged.sleep_quality as number) ?? null,
      craving_intensity: (merged.craving_intensity as number) ?? null,
      craving_time: (merged.craving_time as string) ?? null,
      craving_trigger: (merged.craving_trigger as string) ?? null,
      mood_tag: (merged.mood_tag as string) ?? null,
      water_glasses: (merged.water_glasses as number) ?? 0,
      exercise_minutes: (merged.exercise_minutes as number) ?? 0,
      meditation_minutes: (merged.meditation_minutes as number) ?? 0,
      took_meds: (merged.took_meds as boolean) ?? false,
      notes: (merged.notes as string) ?? null,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLogs((prev) => {
      const without = prev.filter((l) => l.log_date !== logDate);
      return [optimisticLog, ...without];
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Keep optimistic update for demo mode
        return;
      }

      const { data, error: upsertError } = await supabase
        .from("daily_logs")
        .upsert(
          { ...merged, user_id: user.id },
          { onConflict: "user_id,log_date" }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;

      // Replace optimistic entry with real data
      setLogs((prev) => prev.map((l) => (l.log_date === logDate ? data : l)));
    } catch (err) {
      // Rollback optimistic update on error
      if (existing) {
        setLogs((prev) => prev.map((l) => (l.log_date === logDate ? existing : l)));
      } else {
        setLogs((prev) => prev.filter((l) => l.id !== tempId));
      }
      console.error("Error adding log:", err);
      throw err;
    }
  }, [logs]);

  const updateLog = useCallback(async (id: string, updates: Partial<DailyLog>) => {
    // Optimistic update
    const previousLogs = logs;
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));

    try {
      const { error: updateError } = await supabase
        .from("daily_logs")
        .update(updates)
        .eq("id", id);

      if (updateError) throw updateError;
    } catch (err) {
      // Rollback
      setLogs(previousLogs);
      console.error("Error updating log:", err);
      throw err;
    }
  }, [logs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    addLog,
    updateLog,
    refetch: fetchLogs,
  };
}

// Helper to get data for specific time ranges
export function getLogsForDays(logs: DailyLog[], days: number): DailyLog[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return logs.filter((log) => new Date(log.log_date) >= cutoff);
}

// Helper to calculate sleep debt
export function calculateSleepDebt(sleepHours: number, idealHours = 8): number {
  return Math.max(0, idealHours - sleepHours);
}

// Helper to get craving risk by time of day
export function getCravingRiskByTime(logs: DailyLog[]): { time: string; risk: number }[] {
  const timeSlots = {
    Morning: { count: 0, total: 0 },
    Afternoon: { count: 0, total: 0 },
    Evening: { count: 0, total: 0 },
    Night: { count: 0, total: 0 },
  };

  logs.forEach((log) => {
    if (!log.craving_time || !log.craving_intensity) return;
    
    const hour = parseInt(log.craving_time.split(":")[0]);
    let slot: keyof typeof timeSlots;
    
    if (hour >= 5 && hour < 12) slot = "Morning";
    else if (hour >= 12 && hour < 17) slot = "Afternoon";
    else if (hour >= 17 && hour < 21) slot = "Evening";
    else slot = "Night";

    timeSlots[slot].count++;
    timeSlots[slot].total += log.craving_intensity;
  });

  return Object.entries(timeSlots).map(([time, data]) => ({
    time,
    risk: data.count > 0 ? Math.round(data.total / data.count * 10) : 0,
  }));
}
