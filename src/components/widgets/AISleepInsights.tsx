import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import ReactMarkdown from "react-markdown";

type DailyLog = Tables<"daily_logs">;

interface AISleepInsightsProps {
  logs: DailyLog[];
  currentSleepHours: number;
  currentQuality: number;
}

export const AISleepInsights = ({
  logs,
  currentSleepHours,
  currentQuality,
}: AISleepInsightsProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    // Build recent sleep summary from last 3 days
    const recent = logs
      .filter((l) => l.sleep_hours != null)
      .slice(0, 3)
      .map(
        (l) =>
          `${l.log_date}: ${l.sleep_hours}h sleep, quality ${l.sleep_quality ?? "unknown"}%`
      );

    const sleepSummary =
      recent.length > 0
        ? recent.join("; ")
        : `Today: ${currentSleepHours.toFixed(1)}h, quality ${currentQuality}%`;

    const prompt = `You are an expert sleep clinician analyzing a patient in recovery. The patient's recent sleep data is: ${sleepSummary}. Current session: ${currentSleepHours.toFixed(1)} hours, quality ${currentQuality}%.

Respond in exactly two short paragraphs.
Paragraph 1: State their current neurological and physical condition based on this sleep.
Paragraph 2: Give one highly specific, actionable suggestion to improve their sleep hygiene tonight.
Keep it empathetic but scientific. Use bold for key terms.`;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "chat",
        {
          body: {
            messages: [{ role: "user", content: prompt }],
            userStats: {
              sleepQuality: currentQuality,
            },
          },
        }
      );

      if (fnError) throw fnError;

      // Handle streaming response
      if (data instanceof ReadableStream) {
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ") || line.trim() === "") continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setAnalysis(fullText);
              }
            } catch {
              // partial JSON, skip
            }
          }
        }

        if (!fullText) throw new Error("Empty response");
      } else if (typeof data === "string") {
        setAnalysis(data);
      } else if (data?.choices?.[0]?.message?.content) {
        setAnalysis(data.choices[0].message.content);
      }
    } catch (err) {
      console.error("AI Sleep analysis error:", err);
      setError("Unable to generate analysis right now.");
      // Fallback
      const fallback =
        currentSleepHours < 6
          ? `**Condition:** With only ${currentSleepHours.toFixed(1)} hours of sleep, your prefrontal cortex function is impaired, reducing impulse control and emotional regulation. Expect heightened craving sensitivity and slower cognitive processing today.\n\n**Recommendation:** Tonight, set a hard "screens off" alarm 90 minutes before your target bedtime. Replace screen time with a warm shower (raises then drops core temperature, triggering melatonin release) and 10 minutes of diaphragmatic breathing.`
          : `**Condition:** At ${currentSleepHours.toFixed(1)} hours with ${currentQuality}% quality, your sleep architecture is supporting adequate memory consolidation and emotional processing. Your recovery resilience should be at baseline levels.\n\n**Recommendation:** To optimize further, maintain a consistent wake time (±15 minutes) including weekends. This anchors your circadian rhythm and improves sleep efficiency over the coming weeks.`;
      setAnalysis(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className={cn(
        "glass-card p-6 rounded-2xl",
        "border border-primary/30",
        "shadow-glow-violet"
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            AI Sleep Analysis
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </h3>
          <p className="text-xs text-muted-foreground">
            Powered by clinical sleep science
          </p>
        </div>
      </div>

      {isLoading && !analysis ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <div className="mt-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : error && !analysis ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertTriangle className="w-5 h-5 text-alert" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="prose prose-invert prose-sm max-w-none text-foreground/90 leading-relaxed">
          <ReactMarkdown>{analysis || ""}</ReactMarkdown>
        </div>
      )}
    </motion.div>
  );
};
