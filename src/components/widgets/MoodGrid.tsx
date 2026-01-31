import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MoodGridProps {
  onMoodSelect?: (mood: string) => void;
  selectedMood?: string;
}

const moods = [
  { id: "happy", emoji: "😊", label: "Happy", color: "from-yellow-500/30 to-amber-500/20" },
  { id: "calm", emoji: "😌", label: "Calm", color: "from-teal-500/30 to-cyan-500/20" },
  { id: "anxious", emoji: "😰", label: "Anxious", color: "from-orange-500/30 to-amber-500/20" },
  { id: "sad", emoji: "😢", label: "Sad", color: "from-blue-500/30 to-indigo-500/20" },
  { id: "angry", emoji: "😤", label: "Angry", color: "from-red-500/30 to-rose-500/20" },
  { id: "hopeful", emoji: "🌟", label: "Hopeful", color: "from-purple-500/30 to-violet-500/20" },
  { id: "tired", emoji: "😴", label: "Tired", color: "from-slate-500/30 to-gray-500/20" },
  { id: "grateful", emoji: "🙏", label: "Grateful", color: "from-emerald-500/30 to-green-500/20" },
];

export const MoodGrid = ({ onMoodSelect, selectedMood }: MoodGridProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">How are you feeling?</h3>
      
      <div className="grid grid-cols-4 gap-3">
        {moods.map((mood, index) => (
          <motion.button
            key={mood.id}
            className={cn(
              "relative flex flex-col items-center justify-center p-4 rounded-xl",
              "bg-gradient-to-br transition-all duration-300",
              mood.color,
              "border border-white/10",
              selectedMood === mood.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMoodSelect?.(mood.id)}
          >
            <motion.span
              className="text-3xl mb-1"
              animate={selectedMood === mood.id ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {mood.emoji}
            </motion.span>
            <span className="text-xs text-muted-foreground">{mood.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
