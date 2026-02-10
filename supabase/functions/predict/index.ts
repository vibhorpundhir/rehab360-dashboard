import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DailyLog {
  log_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  craving_intensity: number | null;
  craving_trigger: string | null;
  mood_tag: string | null;
  exercise_minutes: number | null;
  meditation_minutes: number | null;
  water_glasses: number | null;
}

interface PredictionResult {
  riskLevel: "Low" | "Medium" | "High";
  trend: "Improving" | "Stable" | "Declining";
  prediction: string;
  actionableTip: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { logs } = await req.json() as { logs: DailyLog[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!logs || logs.length === 0) {
      return new Response(
        JSON.stringify({
          riskLevel: "Medium",
          trend: "Stable",
          prediction: "Start logging your daily wellness to get personalized predictions.",
          actionableTip: "Log your sleep, mood, and cravings daily for accurate forecasting.",
          confidence: 0,
        } as PredictionResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare the analysis prompt
    const logsData = logs.map(log => ({
      date: log.log_date,
      sleepHours: log.sleep_hours,
      sleepQuality: log.sleep_quality,
      cravingIntensity: log.craving_intensity,
      cravingTrigger: log.craving_trigger,
      mood: log.mood_tag,
      exerciseMinutes: log.exercise_minutes,
      meditationMinutes: log.meditation_minutes,
      waterGlasses: log.water_glasses,
    }));

    const systemPrompt = `You are an AI health analyst for a recovery tracking app. Analyze the user's last 7 days of wellness data and provide a prediction.

IMPORTANT: You must respond with ONLY a valid JSON object (no markdown, no explanation). The JSON must have exactly these fields:
{
  "riskLevel": "Low" | "Medium" | "High",
  "trend": "Improving" | "Stable" | "Declining",
  "prediction": "A specific prediction about the next 2-3 days based on patterns (max 2 sentences)",
  "actionableTip": "One specific, actionable piece of advice (max 1 sentence)",
  "confidence": 0-100
}

ANALYSIS GUIDELINES:
- Low sleep quality (<60%) + high cravings (>6) = High risk
- Declining mood trend over 3+ days = Warning sign
- Exercise and meditation are protective factors
- Look for patterns: weekend cravings, late-night triggers, etc.
- Be specific about days (e.g., "Friday evening may be challenging")`;

    const userMessage = `Here is the user's wellness data for the last ${logs.length} days:

${JSON.stringify(logsData, null, 2)}

Analyze this data and provide your prediction as a JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add funds." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from AI");
    }

    // Parse the JSON response
    let prediction: PredictionResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      prediction = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback prediction based on simple analysis
      const avgCraving = logs.reduce((sum, l) => sum + (l.craving_intensity || 0), 0) / logs.length;
      const avgSleep = logs.reduce((sum, l) => sum + (l.sleep_quality || 50), 0) / logs.length;
      
      prediction = {
        riskLevel: avgCraving > 6 ? "High" : avgCraving > 3 ? "Medium" : "Low",
        trend: avgSleep > 60 ? "Improving" : avgSleep > 40 ? "Stable" : "Declining",
        prediction: `Based on your data, your average craving level is ${avgCraving.toFixed(1)}/10. Continue monitoring your triggers.`,
        actionableTip: avgSleep < 60 
          ? "Focus on improving sleep quality - aim for 7-8 hours tonight."
          : "Maintain your current wellness routine.",
        confidence: 60,
      };
    }

    return new Response(
      JSON.stringify(prediction),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Prediction function error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Prediction failed",
        riskLevel: "Medium",
        trend: "Stable",
        prediction: "Unable to generate prediction. Please try again later.",
        actionableTip: "Keep logging your daily wellness data.",
        confidence: 0,
      }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
