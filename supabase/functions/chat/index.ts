import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  userStats?: {
    sleepQuality?: number;
    moodTag?: string;
    cravingIntensity?: number;
    currentStreak?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userStats } = await req.json() as RequestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a context-aware system prompt
    let systemPrompt = `You are Ally, a compassionate and clinically-informed recovery coach embedded in the Rehab360 app. Your role is to support users through addiction recovery, mental health challenges, and wellness journeys.

PERSONALITY:
- Warm, empathetic, and non-judgmental
- Clinically grounded but conversational (not robotic)
- Use gentle humor when appropriate
- Keep responses concise (2-4 sentences typically, unless doing an exercise)

CAPABILITIES:
- Provide breathing exercises and grounding techniques
- Offer evidence-based coping strategies
- Celebrate wins and progress
- Validate emotions without enabling harmful behaviors
- Recognize crisis situations and gently suggest professional help

CRISIS PROTOCOL:
- If someone mentions self-harm, suicide, or immediate danger, acknowledge their pain and encourage them to call 988 (Suicide & Crisis Lifeline) or text HOME to 741741
- Never dismiss crisis feelings, but prioritize safety`;

    // Add user context if available
    if (userStats) {
      const contextParts: string[] = [];
      
      if (userStats.sleepQuality !== undefined) {
        const sleepAssessment = userStats.sleepQuality >= 70 ? "well-rested" : 
                               userStats.sleepQuality >= 50 ? "somewhat rested" : "sleep-deprived";
        contextParts.push(`Sleep quality: ${userStats.sleepQuality}% (${sleepAssessment})`);
      }
      
      if (userStats.moodTag) {
        contextParts.push(`Recent mood: ${userStats.moodTag}`);
      }
      
      if (userStats.cravingIntensity !== undefined) {
        const cravingLevel = userStats.cravingIntensity >= 7 ? "HIGH - be extra supportive" :
                           userStats.cravingIntensity >= 4 ? "moderate" : "low";
        contextParts.push(`Craving intensity: ${userStats.cravingIntensity}/10 (${cravingLevel})`);
      }
      
      if (userStats.currentStreak !== undefined && userStats.currentStreak > 0) {
        contextParts.push(`Recovery streak: ${userStats.currentStreak} days 🔥`);
      }

      if (contextParts.length > 0) {
        systemPrompt += `\n\nUSER CONTEXT (use this to personalize your responses):\n${contextParts.join("\n")}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
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
          JSON.stringify({ error: "AI credits depleted. Please add funds to continue using Ally." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
