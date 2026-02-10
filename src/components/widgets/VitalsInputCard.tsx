import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Droplets, Activity, Heart, Footprints, Check, Loader2 } from "lucide-react";
import { useData } from "@/hooks/useData";
import { toast } from "@/hooks/use-toast";

export const VitalsInputCard = () => {
  const { addLog } = useData();
  const [water, setWater] = useState("");
  const [exercise, setExercise] = useState("");
  const [meditation, setMeditation] = useState("");
  const [tookMeds, setTookMeds] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "done">("idle");

  const handleSave = async () => {
    setSaving("saving");
    try {
      await addLog({
        log_date: new Date().toISOString().split("T")[0],
        water_glasses: water ? parseInt(water) : 0,
        exercise_minutes: exercise ? parseInt(exercise) : 0,
        meditation_minutes: meditation ? parseInt(meditation) : 0,
        took_meds: tookMeds,
      });
      setSaving("done");
      toast({ title: "Vitals logged!", description: "Your data has been saved and charts updated." });
      setTimeout(() => {
        setSaving("idle");
        setWater("");
        setExercise("");
        setMeditation("");
        setTookMeds(false);
      }, 1500);
    } catch {
      setSaving("idle");
      toast({ title: "Error", description: "Failed to save vitals.", variant: "destructive" });
    }
  };

  return (
    <MotionCard className="p-6" delay={7} hoverLift={false}>
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Log Today's Vitals
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="w-4 h-4 text-calm" /> Water (glasses)
          </Label>
          <Input
            type="number"
            min={0}
            max={20}
            placeholder="0"
            value={water}
            onChange={(e) => setWater(e.target.value)}
            className="bg-secondary/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4 text-success" /> Exercise (min)
          </Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="bg-secondary/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground">
            <Heart className="w-4 h-4 text-primary" /> Meditation (min)
          </Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={meditation}
            onChange={(e) => setMeditation(e.target.value)}
            className="bg-secondary/50 border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-muted-foreground">
            <Footprints className="w-4 h-4 text-warning" /> Medication
          </Label>
          <button
            type="button"
            onClick={() => setTookMeds(!tookMeds)}
            className={`w-full h-10 rounded-md border text-sm transition-colors ${
              tookMeds
                ? "bg-success/20 border-success text-success"
                : "bg-secondary/50 border-border text-muted-foreground"
            }`}
          >
            {tookMeds ? "✓ Taken" : "Not taken"}
          </button>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full mt-6" disabled={saving !== "idle"}>
        <AnimatePresence mode="wait">
          {saving === "saving" && (
            <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </motion.span>
          )}
          {saving === "done" && (
            <motion.span key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Saved!
            </motion.span>
          )}
          {saving === "idle" && (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Save Vitals
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </MotionCard>
  );
};
