import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakWidgetProps {
  days: number;
}

export const StreakWidget = ({ days }: StreakWidgetProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
      >
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 to-red-500/20 rounded-full blur-2xl scale-150" />
        
        {/* Fire icon */}
        <motion.div
          className="relative fire-glow"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Flame className="w-16 h-16 text-orange-500" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <span className="text-5xl font-display font-bold text-foreground">
          {days}
        </span>
        <p className="text-muted-foreground mt-1">Day Streak</p>
      </motion.div>

      <motion.p
        className="mt-2 text-xs text-success"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        🔥 Keep it going!
      </motion.p>
    </div>
  );
};
