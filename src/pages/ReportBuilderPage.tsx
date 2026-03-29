import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, Printer, Loader2, Stethoscope, User, Calendar, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface FormData {
  patientName: string;
  age: string;
  gender: string;
  visitDate: string;
  symptoms: string;
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  roughNotes: string;
  doctorName: string;
  clinicName: string;
}

const initialForm: FormData = {
  patientName: "",
  age: "",
  gender: "",
  visitDate: new Date().toISOString().split("T")[0],
  symptoms: "",
  heartRate: "",
  bloodPressure: "",
  temperature: "",
  roughNotes: "",
  doctorName: "",
  clinicName: "Rehab360 Medical Center",
};

const REPORT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`;

export default function ReportBuilderPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [reportText, setReportText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const generateReport = async () => {
    if (!form.symptoms && !form.roughNotes) {
      toast({ title: "Missing input", description: "Please enter symptoms or notes before generating.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setReportText("");

    try {
      const resp = await fetch(REPORT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          symptoms: form.symptoms,
          roughNotes: form.roughNotes,
          vitals: {
            heartRate: form.heartRate,
            bloodPressure: form.bloodPressure,
            temperature: form.temperature,
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

  const handlePrint = () => window.print();

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      {/* Print-only global styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body * { visibility: hidden !important; }
          #print-report, #print-report * { visibility: visible !important; }
          #print-report {
            position: absolute; left: 0; top: 0;
            width: 100%; height: auto;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <div className="print:hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Clinical Report Builder</h1>
              <p className="text-sm text-muted-foreground">AI-powered medical report generation & printing</p>
            </div>
          </div>

          {/* Split layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* ── Left: Input Panel ── */}
            <div className="space-y-5">
              {/* Patient Demographics */}
              <section className="glass-card rounded-2xl p-5 space-y-4 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <User className="w-4 h-4 text-primary" /> Patient Demographics
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="pname" className="text-xs text-muted-foreground">Full Name</Label>
                    <Input id="pname" placeholder="Jane Doe" value={form.patientName} onChange={set("patientName")} />
                  </div>
                  <div>
                    <Label htmlFor="age" className="text-xs text-muted-foreground">Age</Label>
                    <Input id="age" type="number" placeholder="32" value={form.age} onChange={set("age")} />
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
                  <div className="col-span-2">
                    <Label htmlFor="visit" className="text-xs text-muted-foreground">Date of Visit</Label>
                    <Input id="visit" type="date" value={form.visitDate} onChange={set("visitDate")} />
                  </div>
                </div>
              </section>

              {/* Clinical Inputs */}
              <section className="glass-card rounded-2xl p-5 space-y-4 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Stethoscope className="w-4 h-4 text-accent" /> Clinical Inputs
                </div>
                <div>
                  <Label htmlFor="symptoms" className="text-xs text-muted-foreground">Symptoms & Complaints</Label>
                  <Textarea id="symptoms" rows={3} placeholder="Persistent headache, nausea, fatigue for 3 days..." value={form.symptoms} onChange={set("symptoms")} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="hr" className="text-xs text-muted-foreground">Heart Rate (bpm)</Label>
                    <Input id="hr" type="number" placeholder="72" value={form.heartRate} onChange={set("heartRate")} />
                  </div>
                  <div>
                    <Label htmlFor="bp" className="text-xs text-muted-foreground">Blood Pressure</Label>
                    <Input id="bp" placeholder="120/80" value={form.bloodPressure} onChange={set("bloodPressure")} />
                  </div>
                  <div>
                    <Label htmlFor="temp" className="text-xs text-muted-foreground">Temp (°F)</Label>
                    <Input id="temp" type="number" step="0.1" placeholder="98.6" value={form.temperature} onChange={set("temperature")} />
                  </div>
                </div>
              </section>

              {/* Doctor's Notes */}
              <section className="glass-card rounded-2xl p-5 space-y-4 border border-border/40">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Calendar className="w-4 h-4 text-warning" /> Doctor's Notes
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dname" className="text-xs text-muted-foreground">Doctor's Name</Label>
                    <Input id="dname" placeholder="Dr. Smith" value={form.doctorName} onChange={set("doctorName")} />
                  </div>
                  <div>
                    <Label htmlFor="cname" className="text-xs text-muted-foreground">Clinic / Hospital</Label>
                    <Input id="cname" value={form.clinicName} onChange={set("clinicName")} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes" className="text-xs text-muted-foreground">Rough Notes</Label>
                  <Textarea id="notes" rows={4} placeholder="Patient hasn't slept well, feeling anxious, needs to drink more water..." value={form.roughNotes} onChange={set("roughNotes")} />
                </div>
              </section>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isGenerating ? "Generating…" : "✨ Generate Detailed Clinical Report"}
                </Button>
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  disabled={!reportText}
                  className="h-12 px-6"
                >
                  <Printer className="w-5 h-5" /> Print
                </Button>
              </div>
            </div>

            {/* ── Right: A4 Preview ── */}
            <div className="flex justify-center">
              <div
                id="print-report"
                ref={printRef}
                className="bg-white text-black w-full max-w-[210mm] aspect-[1/1.414] shadow-2xl rounded-lg overflow-y-auto p-8 md:p-12 text-sm leading-relaxed"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
              >
                {/* Document Header */}
                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-wide">{form.clinicName || "Medical Center"}</h2>
                      <p className="text-xs text-gray-500 mt-1">Clinical Assessment Report</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{today}</p>
                      <p>Report #R360-{Date.now().toString(36).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-xs">
                  <div><span className="font-semibold text-gray-700">Patient:</span> {form.patientName || "—"}</div>
                  <div><span className="font-semibold text-gray-700">Age:</span> {form.age || "—"}</div>
                  <div><span className="font-semibold text-gray-700">Gender:</span> {form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : "—"}</div>
                  <div><span className="font-semibold text-gray-700">Visit Date:</span> {form.visitDate || "—"}</div>
                </div>

                {/* Vitals Box */}
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6 grid grid-cols-3 gap-4 text-xs">
                  <div className="text-center">
                    <p className="text-gray-500">Heart Rate</p>
                    <p className="font-bold text-gray-800 text-base">{form.heartRate || "—"} <span className="text-xs font-normal">bpm</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Blood Pressure</p>
                    <p className="font-bold text-gray-800 text-base">{form.bloodPressure || "—"} <span className="text-xs font-normal">mmHg</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Temperature</p>
                    <p className="font-bold text-gray-800 text-base">{form.temperature || "—"} <span className="text-xs font-normal">°F</span></p>
                  </div>
                </div>

                {/* AI Report Body */}
                {reportText ? (
                  <div className="prose prose-sm prose-gray max-w-none">
                    <ReactMarkdown>{reportText}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Thermometer className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Fill in the form & click "Generate" to create a report</p>
                    <p className="text-xs mt-1">The AI-generated clinical assessment will appear here</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto pt-8 border-t border-gray-300 flex justify-between items-end text-xs text-gray-500">
                  <div>
                    <p className="font-semibold text-gray-700">{form.doctorName || "Attending Physician"}</p>
                    <p>Signature: ________________________</p>
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
