import { useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Sparkles,
  Printer,
  Loader2,
  Activity,
  Brain,
  TrendingUp,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    clinicName: "Rehab360 Clinical Center",
    dateRange: "30",
  });

  const [reportText, setReportText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const metrics = useMemo(() => {
    const days = parseInt(form.dateRange) || 30;
    const recentLogs = getLogsForDays(logs, days);

    const sleepLogs = recentLogs.filter((l) => l.sleep_hours != null);
    const avgSleep = sleepLogs.length
      ? (
          sleepLogs.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) /
          sleepLogs.length
        ).toFixed(1)
      : "N/A";

    let cleanStreak = 0;
    const sorted = [...recentLogs].sort((a, b) =>
      b.log_date.localeCompare(a.log_date)
    );
    for (const log of sorted) {
      if (log.craving_intensity != null && log.craving_intensity >= 4) break;
      if (log.craving_intensity != null || log.mood_tag != null) cleanStreak++;
    }

    const triggerCounts: Record<string, number> = {};
    recentLogs.forEach((l) => {
      if (l.craving_trigger) {
        triggerCounts[l.craving_trigger] =
          (triggerCounts[l.craving_trigger] || 0) + 1;
      }
    });
    const primaryTrigger =
      Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "None identified";

    const moodMap: Record<string, number> = {
      great: 9, good: 7, okay: 5, low: 3, terrible: 1,
      happy: 8, calm: 7, anxious: 3, stressed: 2, sad: 2, angry: 2, neutral: 5,
    };
    const moodLogs = recentLogs.filter(
      (l) => l.mood_tag && moodMap[l.mood_tag.toLowerCase()]
    );
    const avgMood = moodLogs.length
      ? (
          moodLogs.reduce(
            (s, l) => s + (moodMap[l.mood_tag!.toLowerCase()] || 5),
            0
          ) / moodLogs.length
        ).toFixed(1)
      : "N/A";

    const avgWater = recentLogs.length
      ? (
          recentLogs.reduce((s, l) => s + (l.water_glasses ?? 0), 0) /
          recentLogs.length
        ).toFixed(1)
      : "N/A";

    const avgExercise = recentLogs.length
      ? (
          recentLogs.reduce((s, l) => s + (l.exercise_minutes ?? 0), 0) /
          recentLogs.length
        ).toFixed(0)
      : "N/A";

    return {
      avgSleep,
      cleanStreak,
      primaryTrigger,
      avgMood,
      avgWater,
      avgExercise,
      totalLogs: recentLogs.length,
    };
  }, [logs, form.dateRange]);

  const displayName = form.patientName || user?.name || "Patient";

  const set =
    (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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

    const roughNotes =
      form.roughNotes || "No additional doctor notes provided.";

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
      toast({
        title: "Generation failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = async () => {
    if (!reportText || isGenerating) return;

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.setTimeout(resolve, 120);
          });
        });
      });

      window.print();
    } catch {
      window.print();
    }
  };

  return (
    <>
      {/* Print-only styles — fully isolate the report so nothing gets clipped */}
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm 16mm; }

          html, body, #root, #root > div, #root main {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .report-print-shell,
          .report-print-stage {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            transform: none !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          [data-print-hide="true"] {
            display: none !important;
          }

          #print-report,
          #print-report * {
            visibility: visible !important;
            opacity: 1 !important;
          }

          #print-report {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            aspect-ratio: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          #print-report .a4-inner {
            padding: 0 !important;
            min-height: 0 !important;
            display: block !important;
          }

          #print-report h1, #print-report h2, #print-report h3,
          #print-report h4, #print-report p, #print-report span,
          #print-report div, #print-report li, #print-report strong,
          #print-report em, #print-report td, #print-report th {
            color: #000000 !important;
          }

          #print-report .prose * { color: #0f172a !important; }
          .print-break-avoid { break-inside: avoid; page-break-inside: avoid; }
          .print-page-break { page-break-before: always; break-before: page; }
        }
      `}</style>

      <div className="report-print-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Page Header */}
          <div
            className="flex items-center justify-between flex-wrap gap-4 print:hidden"
            data-print-hide="true"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-violet">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Clinical Report Builder
                </h1>
                <p className="text-sm text-muted-foreground">
                  Auto-populated from recovery data · AI-powered clinical
                  assessment
                </p>
              </div>
            </div>
            <Button
              onClick={handlePrint}
              variant="outline"
              disabled={!reportText || isGenerating}
              className="gap-2"
            >
              <Printer className="w-4 h-4" /> Print Report
            </Button>
          </div>

          {/* Split Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 print:block">
            {/* ─── Left: Controls (span 4) ─── */}
            <div
              className="lg:col-span-4 space-y-5 print:hidden"
              data-print-hide="true"
            >
              {/* Live Metrics */}
              <section className="glass-card rounded-2xl p-5 space-y-3 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Activity className="w-4 h-4 text-primary" /> Live Recovery
                  Metrics
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Avg Sleep", value: `${metrics.avgSleep}h`, icon: "🛏️" },
                    { label: "Clean Streak", value: `${metrics.cleanStreak}d`, icon: "🔥" },
                    { label: "Mood Score", value: `${metrics.avgMood}/10`, icon: "😊" },
                    { label: "Trigger", value: metrics.primaryTrigger, icon: "⚡" },
                    { label: "Hydration", value: `${metrics.avgWater} gl`, icon: "💧" },
                    { label: "Exercise", value: `${metrics.avgExercise} min`, icon: "🏃" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="bg-secondary/40 rounded-xl p-3 text-center border border-border/20"
                    >
                      <p className="text-base">{m.icon}</p>
                      <p className="text-sm font-bold text-foreground">
                        {m.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Based on {metrics.totalLogs} entries over {form.dateRange} days
                </p>
              </section>

              {/* Form Controls */}
              <section className="glass-card rounded-2xl p-5 space-y-4 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <User className="w-4 h-4 text-primary" /> Report Settings
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Patient Name
                    </Label>
                    <Input
                      placeholder={user?.name || "Patient"}
                      value={form.patientName}
                      onChange={set("patientName")}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Age</Label>
                    <Input
                      type="number"
                      placeholder="—"
                      value={form.age}
                      onChange={set("age")}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Gender
                    </Label>
                    <Select
                      value={form.gender}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, gender: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Date Range
                    </Label>
                    <Select
                      value={form.dateRange}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, dateRange: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="14">Last 14 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Doctor
                    </Label>
                    <Input
                      placeholder="Dr. Smith"
                      value={form.doctorName}
                      onChange={set("doctorName")}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Visit Date
                    </Label>
                    <Input
                      type="date"
                      value={form.visitDate}
                      onChange={set("visitDate")}
                    />
                  </div>
                </div>
              </section>

              {/* Doctor's Notes */}
              <section className="glass-card rounded-2xl p-5 space-y-3 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Brain className="w-4 h-4 text-accent" /> Doctor's Rough
                  Notes
                </div>
                <Textarea
                  rows={4}
                  placeholder="Patient reports improved sleep but elevated anxiety in social settings. Consider adjusting medication..."
                  value={form.roughNotes}
                  onChange={set("roughNotes")}
                  className="resize-none"
                />
              </section>

              {/* Generate Button */}
              <Button
                onClick={generateReport}
                disabled={isGenerating}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {isGenerating
                  ? "Generating…"
                  : "✨ Generate Clinical Assessment"}
              </Button>
            </div>

            {/* ─── Right: A4 Preview (span 8) ─── */}
            <div className="report-print-stage lg:col-span-8 flex flex-col items-center print:block">
              <div
                id="print-report"
                ref={printRef}
                className="w-full max-w-3xl aspect-[1/1.414] overflow-y-auto rounded-lg shadow-2xl print:w-full print:max-w-none print:h-full print:overflow-visible print:rounded-none print:shadow-none"
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  background: "#ffffff",
                  color: "#1a1a1a",
                }}
              >
                <div className="a4-inner p-8 md:p-10 flex flex-col min-h-full">
                  {/* ── Letterhead ── */}
                  <div
                    className="print-break-avoid"
                    style={{ borderBottom: "2px solid #1e293b", paddingBottom: "16px", marginBottom: "20px" }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2
                          className="text-xl font-bold tracking-wide"
                          style={{ color: "#0f172a" }}
                        >
                          Rehab360 Clinical Progress Report
                        </h2>
                        <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                          {form.clinicName} · Confidential Medical Document
                        </p>
                      </div>
                      <div className="text-right text-xs" style={{ color: "#64748b" }}>
                        <p className="font-medium" style={{ color: "#334155" }}>
                          {today}
                        </p>
                        <p>
                          Ref: R360-
                          {Date.now().toString(36).slice(0, 6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Patient Demographics ── */}
                  <div
                    className="print-break-avoid rounded-md p-4 mb-5"
                    style={{ background: "#f8fafc", color: "#0f172a" }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Patient Information
                    </p>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
                      <div>
                        <span className="font-semibold" style={{ color: "#475569" }}>
                          Patient:
                        </span>{" "}
                        {displayName}
                      </div>
                      <div>
                        <span className="font-semibold" style={{ color: "#475569" }}>
                          Age:
                        </span>{" "}
                        {form.age || "—"}
                      </div>
                      <div>
                        <span className="font-semibold" style={{ color: "#475569" }}>
                          Gender:
                        </span>{" "}
                        {form.gender
                          ? form.gender.charAt(0).toUpperCase() +
                            form.gender.slice(1)
                          : "—"}
                      </div>
                      <div>
                        <span className="font-semibold" style={{ color: "#475569" }}>
                          Visit Date:
                        </span>{" "}
                        {form.visitDate}
                      </div>
                      <div>
                        <span className="font-semibold" style={{ color: "#475569" }}>
                          Attending:
                        </span>{" "}
                        {form.doctorName || "—"}
                      </div>
                      <div>
                        <span className="font-semibold" style={{ color: "#475569" }}>
                          Report Period:
                        </span>{" "}
                        Last {form.dateRange} days
                      </div>
                    </div>
                  </div>

                  {/* ── Vital Metrics Highlights ── */}
                  <div className="print-break-avoid mb-5">
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                      style={{ color: "#94a3b8" }}
                    >
                      Recovery Metrics Summary
                    </p>
                    <div
                      className="grid grid-cols-3 gap-3 rounded-md p-4"
                      style={{
                        border: "1px solid #e2e8f0",
                        background: "#fafbfd",
                      }}
                    >
                      <MetricCell
                        label="Current Clean Streak"
                        value={String(metrics.cleanStreak)}
                        unit="days"
                        highlight
                      />
                      <MetricCell
                        label="Average Sleep"
                        value={metrics.avgSleep}
                        unit="hrs/night"
                        highlight
                      />
                      <MetricCell
                        label="Dominant Mood"
                        value={metrics.avgMood}
                        unit="/10"
                        highlight
                      />
                      <MetricCell
                        label="Primary Trigger"
                        value={metrics.primaryTrigger}
                      />
                      <MetricCell
                        label="Daily Hydration"
                        value={metrics.avgWater}
                        unit="glasses"
                      />
                      <MetricCell
                        label="Daily Exercise"
                        value={metrics.avgExercise}
                        unit="min"
                      />
                    </div>
                  </div>

                  {/* ── AI Clinical Assessment ── */}
                  <div className="flex-1">
                    {reportText ? (
                      <div className="print-break-avoid">
                        <p
                          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                          style={{ color: "#94a3b8" }}
                        >
                          Clinical Assessment
                        </p>
                        <div
                          className="prose prose-sm md:prose-base max-w-none"
                          style={{ color: "#1e293b" }}
                        >
                          <ReactMarkdown>{reportText}</ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <TrendingUp
                          className="w-10 h-10 mb-3"
                          style={{ color: "#cbd5e1" }}
                        />
                        <p
                          className="text-sm font-medium"
                          style={{ color: "#94a3b8" }}
                        >
                          Recovery metrics loaded — ready for AI assessment
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#cbd5e1" }}
                        >
                          Click "Generate Clinical Assessment" to populate this
                          section
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Footer ── */}
                  <div
                    className="print-break-avoid mt-auto pt-6 flex justify-between items-end text-xs"
                    style={{
                      borderTop: "1px solid #cbd5e1",
                      color: "#64748b",
                    }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: "#334155" }}>
                        {form.doctorName || "Attending Physician"}
                      </p>
                      <p className="mt-6">
                        Signed: ________________________
                      </p>
                    </div>
                    <div className="text-right">
                      <p>{form.clinicName}</p>
                      <p className="mt-1">Generated by Rehab360 Clinical AI</p>
                    </div>
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

/* ── Small helper for the metric cells ── */
function MetricCell({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px]" style={{ color: "#64748b" }}>
        {label}
      </p>
      <p
        className={highlight ? "text-2xl font-bold" : "text-sm font-bold"}
        style={{ color: highlight ? "#6d28d9" : "#1e293b" }}
      >
        {value}
        {unit && (
          <span className="text-xs font-normal" style={{ color: "#94a3b8" }}>
            {" "}
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}
