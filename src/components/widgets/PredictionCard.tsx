import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  Shield,
  Loader2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

type DailyLog = Tables<"daily_logs">;

interface PredictionResult {
  riskLevel: "Low" | "Medium" | "High";
  trend: "Improving" | "Stable" | "Declining";
  prediction: string;
  actionableTip: string;
  confidence: number;
  error?: string;
}

interface PredictionCardProps {
  logs: DailyLog[];
  className?: string;
}

const PREDICTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict`;

export function PredictionCard({ logs, className }: PredictionCardProps) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async () => {
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
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err instanceof Error ? err.message : "Prediction failed");
      // Set a fallback prediction
      setPrediction({
        riskLevel: "Medium",
        trend: "Stable",
        prediction: "Continue tracking your wellness journey.",
        actionableTip: "Log your daily mood and cravings for better insights.",
        confidence: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [logs.length]);

  const getRiskConfig = (level: string) => {
    switch (level) {
      case "High":
        return {
          color: "text-alert",
          bg: "bg-alert/10",
          border: "border-alert/30",
          glow: "shadow-[0_0_30px_-5px_hsl(var(--alert)/0.4)]",
          icon: AlertTriangle,
        };
      case "Low":
        return {
          color: "text-success",
          bg: "bg-success/10",
          border: "border-success/30",
          glow: "shadow-[0_0_30px_-5px_hsl(var(--success)/0.4)]",
          icon: CheckCircle2,
        };
      default:
        return {
          color: "text-warning",
          bg: "bg-warning/10",
          border: "border-warning/30",
          glow: "shadow-[0_0_30px_-5px_hsl(var(--warning)/0.4)]",
          icon: Shield,
        };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Improving":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "Declining":
        return <TrendingDown className="w-4 h-4 text-alert" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const config = prediction ? getRiskConfig(prediction.riskLevel) : getRiskConfig("Medium");
  const RiskIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-5",
        "bg-card/60 backdrop-blur-xl",
        "border",
        config.border,
        config.glow,
        "transition-shadow duration-500",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div
            className={cn("p-2 rounded-lg", config.bg)}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Brain className={cn("w-5 h-5", config.color)} />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              AI Forecast
              <Sparkles className="w-3 h-3 text-primary" />
            </h3>
            <p className="text-xs text-muted-foreground">Powered by Gemini</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchPrediction}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Analyzing your data...</p>
        </div>
      ) : prediction ? (
        <div className="space-y-4">
          {/* Risk Level Badge */}
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full",
                config.bg,
                "border",
                config.border
              )}
              animate={prediction.riskLevel === "High" ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <RiskIcon className={cn("w-4 h-4", config.color)} />
              <span className={cn("text-sm font-medium", config.color)}>
                {prediction.riskLevel} Risk
              </span>
            </motion.div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50">
              {getTrendIcon(prediction.trend)}
              <span className="text-xs text-muted-foreground">{prediction.trend}</span>
            </div>

            {prediction.confidence > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {prediction.confidence}% confidence
              </span>
            )}
          </div>

          {/* Prediction Text */}
          <div className="p-3 rounded-lg bg-secondary/30 border border-white/5">
            <p className="text-sm text-foreground leading-relaxed">
              {prediction.prediction}
            </p>
          </div>

          {/* Actionable Tip */}
          <div className={cn("p-3 rounded-lg", config.bg, "border", config.border)}>
            <p className="text-xs text-muted-foreground mb-1">💡 Recommended Action</p>
            <p className={cn("text-sm font-medium", config.color)}>
              {prediction.actionableTip}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPrediction}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      ) : null}

      {/* Decorative Background */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
    </motion.div>
  );
}
