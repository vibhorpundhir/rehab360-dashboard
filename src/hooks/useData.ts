import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

function getStorageKey(userId: string | null): string {
  return userId ? `rehab360_logs_${userId}` : "rehab360_logs_guest";
}

function loadFromStorage(userId: string | null): DailyLog[] | null {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function saveToStorage(userId: string | null, logs: DailyLog[]) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(logs));
  } catch {}
}

export function clearAllData(userId?: string | null) {
  if (userId) {
    localStorage.removeItem(getStorageKey(userId));
  }
  // Also clear legacy key
  localStorage.removeItem("rehab360_logs");
}

export function useData(): UseDataReturn {
  const { user, session } = useAuth();
  const userId = user?.id ?? null;

  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When userId changes, load that user's data
  useEffect(() => {
    const stored = loadFromStorage(userId);
    setLogs(stored || []);
  }, [userId]);

  // Persist to user-scoped localStorage whenever logs change
  useEffect(() => {
    if (logs.length > 0) {
      saveToStorage(userId, logs);
    }
  }, [logs, userId]);

  const fetchLogs = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", session.user.id)
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
  }, [session]);

  const addLog = useCallback(async (log: Partial<DailyLogInsert>) => {
    const logDate = log.log_date || new Date().toISOString().split("T")[0];

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
      ...Object.fromEntries(Object.entries(log).filter(([, v]) => v !== undefined)),
      log_date: logDate,
    };

    const tempId = `temp-${Date.now()}`;
    const optimisticLog: DailyLog = {
      id: existing?.id || tempId,
      user_id: existing?.user_id || userId || "pending",
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
      if (!session?.user) return; // Demo mode - keep optimistic update

      const { data, error: upsertError } = await supabase
        .from("daily_logs")
        .upsert(
          { ...merged, user_id: session.user.id },
          { onConflict: "user_id,log_date" }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;

      setLogs((prev) => prev.map((l) => (l.log_date === logDate ? data : l)));
    } catch (err) {
      if (existing) {
        setLogs((prev) => prev.map((l) => (l.log_date === logDate ? existing : l)));
      } else {
        setLogs((prev) => prev.filter((l) => l.id !== tempId));
      }
      console.error("Error adding log:", err);
      throw err;
    }
  }, [logs, userId, session]);

  const updateLog = useCallback(async (id: string, updates: Partial<DailyLog>) => {
    const previousLogs = logs;
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));

    try {
      const { error: updateError } = await supabase
        .from("daily_logs")
        .update(updates)
        .eq("id", id);

      if (updateError) throw updateError;
    } catch (err) {
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

// Helpers
export function getLogsForDays(logs: DailyLog[], days: number): DailyLog[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return logs.filter((log) => new Date(log.log_date) >= cutoff);
}

export function calculateSleepDebt(sleepHours: number, idealHours = 8): number {
  return Math.max(0, idealHours - sleepHours);
}

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
