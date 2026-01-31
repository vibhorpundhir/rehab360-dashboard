import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame, Moon, Heart, BookOpen, Droplets, Activity, Pill } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface QuickLogItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

const quickLogItems: QuickLogItem[] = [
  { id: "craving", label: "Craving", icon: Flame, color: "text-alert", bgColor: "bg-alert/20" },
  { id: "mood", label: "Mood", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-500/20" },
  { id: "sleep", label: "Sleep", icon: Moon, color: "text-calm", bgColor: "bg-calm/20" },
  { id: "journal", label: "Journal", icon: BookOpen, color: "text-primary", bgColor: "bg-primary/20" },
  { id: "water", label: "Water", icon: Droplets, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  { id: "exercise", label: "Exercise", icon: Activity, color: "text-success", bgColor: "bg-success/20" },
  { id: "meds", label: "Meds", icon: Pill, color: "text-purple-400", bgColor: "bg-purple-500/20" },
];

interface QuickLoggerProps {
  onLog?: (id: string) => void;
}

export const QuickLogger = ({ onLog }: QuickLoggerProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Quick Log</h3>
      
      <div className="grid grid-cols-4 gap-3">
        {quickLogItems.map((item, index) => {
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl",
                "transition-all duration-200",
                item.bgColor,
                "hover:scale-105 hover:shadow-lg"
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onLog?.(item.id)}
            >
              <Icon className={cn("w-6 h-6 mb-2", item.color)} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
