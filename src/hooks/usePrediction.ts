import { useState, useCallback } from "react";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

export interface PredictionResult {
  riskLevel: "Low" | "Medium" | "High";
  trend: "Improving" | "Stable" | "Declining";
  prediction: string;
  actionableTip: string;
  confidence: number;
  error?: string;
}

const PREDICTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict`;

export function usePrediction() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async (logs: DailyLog[]) => {
    if (logs.length === 0) {
      setPrediction({
        riskLevel: "Medium",
        trend: "Stable",
        prediction: "Start logging your daily wellness to unlock AI-powered predictions.",
        actionableTip: "Add your first journal entry to get started.",
        confidence: 0,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const last7Days = logs.slice(0, 7);
      
      const response = await fetch(PREDICTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ logs: last7Days }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limited. Please wait a moment.");
        }
        if (response.status === 402) {
          throw new Error("AI credits depleted.");
        }
        throw new Error("Failed to get prediction");
      }

      const data = await response.json();
      setPrediction(data);
      return data;
    } catch (err) {
      console.error("Prediction error:", err);
      const errorMessage = err instanceof Error ? err.message : "Prediction failed";
      setError(errorMessage);
      
      // Set a fallback prediction
      const fallback: PredictionResult = {
        riskLevel: "Medium",
        trend: "Stable",
        prediction: "Continue tracking your wellness journey.",
        actionableTip: "Log your daily mood and cravings for better insights.",
        confidence: 0,
      };
      setPrediction(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    prediction,
    isLoading,
    error,
    fetchPrediction,
  };
}
