import { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, Printer, Loader2, Stethoscope, User, Calendar, Thermometer, Activity, Brain, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useData, getLogsForDays } from "@/hooks/useData";
import ReactMarkdown from "react-markdown";

interface FormData {
  patientName: string;
  age: string;
  gender: string;
  visitDate: string;
  roughNotes: string;
  doctorName: string;
  clinicName: string;
  dateRange: string;
}

const REPORT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`;

export default function ReportBuilderPage() {
  const { user } = useAuth();
  const { logs } = useData();
  const { toast } = useToast();

  const [form, setForm] = useState<FormData>({
    patientName: "",
    age: "",
    gender: "",
    visitDate: new Date().toISOString().split("T")[0],
    roughNotes: "",
    doctorName: "",
    clinicName: "Rehab360 Medical Center",
    dateRange: "30",
  });

  const [reportText, setReportText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Phase 1: Real calculated metrics
  const metrics = useMemo(() => {
    const days = parseInt(form.dateRange) || 30;
    const recentLogs = getLogsForDays(logs, days);

    const sleepLogs = recentLogs.filter((l) => l.sleep_hours != null);
    const avgSleep = sleepLogs.length
      ? (sleepLogs.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / sleepLogs.length).toFixed(1)
      : "N/A";

    // Clean streak: consecutive days with craving_intensity < 4 (from most recent)
    let cleanStreak = 0;
    const sorted = [...recentLogs].sort((a, b) => b.log_date.localeCompare(a.log_date));
    for (const log of sorted) {
      if (log.craving_intensity != null && log.craving_intensity >= 4) break;
      if (log.craving_intensity != null || log.mood_tag != null) cleanStreak++;
    }

    // Primary trigger
    const triggerCounts: Record<string, number> = {};
    recentLogs.forEach((l) => {
      if (l.craving_trigger) {
        triggerCounts[l.craving_trigger] = (triggerCounts[l.craving_trigger] || 0) + 1;
      }
    });
    const primaryTrigger =
      Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None identified";

    // Average mood (map mood_tag to numeric if possible)
    const moodMap: Record<string, number> = {
      great: 9, good: 7, okay: 5, low: 3, terrible: 1,
      happy: 8, calm: 7, anxious: 3, stressed: 2, sad: 2, angry: 2, neutral: 5,
    };
    const moodLogs = recentLogs.filter((l) => l.mood_tag && moodMap[l.mood_tag.toLowerCase()]);
    const avgMood = moodLogs.length
      ? (moodLogs.reduce((s, l) => s + (moodMap[l.mood_tag!.toLowerCase()] || 5), 0) / moodLogs.length).toFixed(1)
      : "N/A";

    const avgWater = recentLogs.length
      ? (recentLogs.reduce((s, l) => s + (l.water_glasses ?? 0), 0) / recentLogs.length).toFixed(1)
      : "N/A";

    const avgExercise = recentLogs.length
      ? (recentLogs.reduce((s, l) => s + (l.exercise_minutes ?? 0), 0) / recentLogs.length).toFixed(0)
      : "N/A";

    return { avgSleep, cleanStreak, primaryTrigger, avgMood, avgWater, avgExercise, totalLogs: recentLogs.length };
  }, [logs, form.dateRange]);

  const displayName = form.patientName || user?.name || "Patient";

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const generateReport = async () => {
    setIsGenerating(true);
    setReportText("");

    const dataContext = `Patient "${displayName}" recovery data over the last ${form.dateRange} days:
- Average sleep: ${metrics.avgSleep} hours/night
- Clean streak (days with cravings < 4): ${metrics.cleanStreak} days
- Primary craving trigger: ${metrics.primaryTrigger}
- Average mood score: ${metrics.avgMood}/10
- Average daily water intake: ${metrics.avgWater} glasses
- Average daily exercise: ${metrics.avgExercise} minutes
- Total log entries: ${metrics.totalLogs}`;

    const roughNotes = form.roughNotes || "No additional doctor notes provided.";

    try {
      const resp = await fetch(REPORT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          symptoms: dataContext,
          roughNotes,
          vitals: {
            heartRate: `Avg mood ${metrics.avgMood}/10`,
            bloodPressure: `Clean streak ${metrics.cleanStreak}d`,
            temperature: `Sleep ${metrics.avgSleep}h`,
          },
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "AI service error");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              full += c;
              setReportText(full);
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden !important; }
          #print-report, #print-report * { visibility: visible !important; }
          #print-report {
            position: absolute; left: 0; top: 0;
            width: 100%; height: auto;
            box-shadow: none !important; border: none !important;
            background: white !important; padding: 10mm !important; margin: 0 !important;
            color: black !important;
          }
          #print-report h2, #print-report h3, #print-report p, #print-report span, #print-report div {
            color: black !important;
          }
        }
      `}</style>

      <div className="print:hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Clinical Report Builder</h1>
              <p className="text-sm text-muted-foreground">Auto-populated from your recovery data • AI-powered assessment</p>
            </div>
          </div>

          {/* Split layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Controls (span 4) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Live Metrics Card */}
              <section className="glass-card rounded-2xl p-5 space-y-3 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Activity className="w-4 h-4 text-primary" /> Live Patient Metrics
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Avg Sleep", value: `${metrics.avgSleep}h`, icon: "🛏️" },
                    { label: "Clean Streak", value: `${metrics.cleanStreak}d`, icon: "🔥" },
                    { label: "Mood Score", value: `${metrics.avgMood}/10`, icon: "😊" },
                    { label: "Primary Trigger", value: metrics.primaryTrigger, icon: "⚡" },
                    { label: "Avg Water", value: `${metrics.avgWater} gl`, icon: "💧" },
                    { label: "Avg Exercise", value: `${metrics.avgExercise} min`, icon: "🏃" },
                  ].map((m) => (
                    <div key={m.label} className="bg-background/60 rounded-xl p-3 text-center border border-border/30">
                      <p className="text-lg">{m.icon}</p>
                      <p className="text-sm font-bold text-foreground">{m.value}</p>
                      <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Based on {metrics.totalLogs} log entries over {form.dateRange} days
                </p>
              </section>

              {/* Controls */}
              <section className="glass-card rounded-2xl p-5 space-y-4 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <User className="w-4 h-4 text-primary" /> Report Settings
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Patient Name</Label>
                    <Input placeholder={user?.name || "Patient"} value={form.patientName} onChange={set("patientName")} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Age</Label>
                    <Input type="number" placeholder="—" value={form.age} onChange={set("age")} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date Range</Label>
                    <Select value={form.dateRange} onValueChange={(v) => setForm((p) => ({ ...p, dateRange: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="14">Last 14 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Doctor</Label>
                    <Input placeholder="Dr. Smith" value={form.doctorName} onChange={set("doctorName")} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Visit Date</Label>
                    <Input type="date" value={form.visitDate} onChange={set("visitDate")} />
                  </div>
                </div>
              </section>

              {/* Doctor's Notes */}
              <section className="glass-card rounded-2xl p-5 space-y-3 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Brain className="w-4 h-4 text-accent" /> Doctor's Rough Notes
                </div>
                <Textarea
                  rows={4}
                  placeholder="Patient reports improved sleep but elevated anxiety in social settings. Consider adjusting medication..."
                  value={form.roughNotes}
                  onChange={set("roughNotes")}
                />
              </section>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isGenerating ? "Generating…" : "✨ Generate Clinical Assessment"}
                </Button>
              </div>
            </div>

            {/* Right Column - A4 Preview (span 8) */}
            <div className="lg:col-span-8 flex flex-col items-center gap-3">
              <Button onClick={() => window.print()} variant="outline" disabled={!reportText} className="self-end print:hidden">
                <Printer className="w-4 h-4 mr-2" /> 🖨️ Print Report
              </Button>

              <div
                id="print-report"
                ref={printRef}
                className="bg-white text-black w-full max-w-3xl aspect-[1/1.414] shadow-2xl rounded-lg overflow-y-auto p-8 md:p-10 text-sm leading-relaxed"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                {/* Document Header */}
                <div className="border-b-2 border-gray-800 pb-4 mb-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-wide">{form.clinicName}</h2>
                      <p className="text-xs text-gray-500 mt-1">Clinical Assessment & Recovery Report</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{today}</p>
                      <p>Report #R360-{Date.now().toString(36).slice(0, 6).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {/* Patient Demographics */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mb-5 text-xs">
                  <div><span className="font-semibold text-gray-700">Patient:</span> {displayName}</div>
                  <div><span className="font-semibold text-gray-700">Age:</span> {form.age || "—"}</div>
                  <div><span className="font-semibold text-gray-700">Gender:</span> {form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : "—"}</div>
                  <div><span className="font-semibold text-gray-700">Visit Date:</span> {form.visitDate}</div>
                  <div><span className="font-semibold text-gray-700">Attending:</span> {form.doctorName || "—"}</div>
                  <div><span className="font-semibold text-gray-700">Period:</span> Last {form.dateRange} days</div>
                </div>

                {/* Recovery Metrics Box */}
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Recovery Metrics Summary</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <p className="text-gray-500">Avg Sleep</p>
                      <p className="font-bold text-gray-800 text-base">{metrics.avgSleep}<span className="text-xs font-normal"> hrs</span></p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Clean Streak</p>
                      <p className="font-bold text-gray-800 text-base">{metrics.cleanStreak}<span className="text-xs font-normal"> days</span></p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Mood Score</p>
                      <p className="font-bold text-gray-800 text-base">{metrics.avgMood}<span className="text-xs font-normal"> /10</span></p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Primary Trigger</p>
                      <p className="font-bold text-gray-800 text-sm">{metrics.primaryTrigger}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Hydration</p>
                      <p className="font-bold text-gray-800 text-base">{metrics.avgWater}<span className="text-xs font-normal"> gl/day</span></p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Exercise</p>
                      <p className="font-bold text-gray-800 text-base">{metrics.avgExercise}<span className="text-xs font-normal"> min/day</span></p>
                    </div>
                  </div>
                </div>

                {/* AI Clinical Assessment */}
                {reportText ? (
                  <div className="prose prose-sm prose-gray max-w-none" style={{ whiteSpace: "pre-wrap" }}>
                    <ReactMarkdown>{reportText}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <TrendingUp className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">Recovery metrics loaded — ready for AI assessment</p>
                    <p className="text-xs mt-1">Click "Generate Clinical Assessment" to create the report</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto pt-8 border-t border-gray-300 flex justify-between items-end text-xs text-gray-500">
                  <div>
                    <p className="font-semibold text-gray-700">{form.doctorName || "Attending Physician"}</p>
                    <p className="mt-4">Signature: ________________________</p>
                  </div>
                  <div className="text-right">
                    <p>{form.clinicName}</p>
                    <p>Generated by Rehab360 Clinical AI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
