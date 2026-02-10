import { useState } from "react";
import { motion } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Target, Trash2, Check } from "lucide-react";
import { clearAllData } from "@/hooks/useData";
import { toast } from "@/hooks/use-toast";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const SettingsPage = () => {
  const [name, setName] = useState(() => localStorage.getItem("rehab360_name") || "");
  const [goal, setGoal] = useState(() => localStorage.getItem("rehab360_goal") || "");
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = () => {
    localStorage.setItem("rehab360_name", name);
    localStorage.setItem("rehab360_goal", goal);
    setSaved(true);
    toast({ title: "Profile saved", description: "Your settings have been updated." });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    clearAllData();
    localStorage.removeItem("rehab360_name");
    localStorage.removeItem("rehab360_goal");
    toast({ title: "Data cleared", description: "All app data has been reset. Refresh to see changes.", variant: "destructive" });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="space-y-8 max-w-2xl"
    >
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-muted-foreground mt-2">Manage your profile and app preferences</p>
      </div>

      {/* Profile */}
      <MotionCard className="p-6" delay={0} hoverLift={false}>
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Profile
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Primary Goal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger className="bg-secondary/50 border-border">
                <SelectValue placeholder="Select your goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addiction-recovery">Addiction Recovery</SelectItem>
                <SelectItem value="better-sleep">Better Sleep</SelectItem>
                <SelectItem value="mental-clarity">Mental Clarity</SelectItem>
                <SelectItem value="stress-management">Stress Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveProfile} className="w-full mt-2">
            {saved ? <><Check className="w-4 h-4 mr-2" /> Saved</> : <><Target className="w-4 h-4 mr-2" /> Save Profile</>}
          </Button>
        </div>
      </MotionCard>

      {/* Danger Zone */}
      <MotionCard className="p-6 border-destructive/30" delay={1} hoverLift={false}>
        <h3 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete all your local data including logs, profile, and preferences. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">Clear All Data</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your local data including journal entries, vitals, and profile settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearData}>Yes, delete everything</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MotionCard>
    </motion.div>
  );
};

export default SettingsPage;
