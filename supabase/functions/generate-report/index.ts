import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, roughNotes, vitals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const vitalsText = vitals
      ? `Heart Rate: ${vitals.heartRate || "N/A"} bpm, Blood Pressure: ${vitals.bloodPressure || "N/A"}, Temperature: ${vitals.temperature || "N/A"}°F`
      : "No vitals provided";

    const systemPrompt = `You are a senior clinical physician and medical scribe specializing in addiction recovery and behavioral health. Produce a COMPREHENSIVE, professional clinical progress report that is suitable both for another healthcare provider AND readable by an educated patient.

STRICT FORMATTING RULES (Markdown):
- Use "## Section Title" for each major section. Do NOT include the report title — that is rendered by the UI.
- Use short paragraphs (2–4 sentences). Use **bold** for key clinical findings.
- Use bullet lists where appropriate (recommendations, red flags, follow-up actions).
- Use precise medical terminology, then briefly clarify in plain language when helpful.
- Be empathetic, evidence-based, non-judgmental, and never alarmist.
- Do NOT invent vitals or lab values that were not provided. Reason only from supplied data.
- Length: aim for ~600–900 words total.

REQUIRED SECTIONS (in this order):
## Chief Complaint & Reason for Visit
## History of Present Illness
## Behavioral & Recovery Progress
(Discuss clean streak, craving patterns, primary trigger, mood trend.)
## Sleep & Lifestyle Assessment
(Discuss sleep duration/quality, hydration, exercise, and their interplay.)
## Mental Health & Risk Stratification
(Comment on mood, relapse risk, any red flags. Use a clear Low / Moderate / High risk label.)
## Clinical Impression
(2–3 sentence summary diagnosis-style statement.)
## Treatment Plan & Recommendations
(Bullet list: behavioral interventions, sleep hygiene, hydration, exercise targets, coping strategies for the identified trigger, medication adherence reminders if relevant.)
## Patient Education
(Plain-language guidance the patient can act on this week.)
## Follow-Up
(Recommended interval, what to monitor, when to seek urgent help.)`;

    const userPrompt = `PATIENT RECOVERY DATA & CONTEXT:
${symptoms || "None provided"}

VITAL / SUMMARY METRICS:
${vitalsText}

DOCTOR'S ROUGH NOTES:
${roughNotes || "None provided"}

Please generate the full clinical progress report now, following the section structure exactly.`;

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
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
