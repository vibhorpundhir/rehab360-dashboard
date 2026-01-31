import { motion } from "framer-motion";

interface WellnessScoreProps {
  score: number;
}

export const WellnessScore = ({ score }: WellnessScoreProps) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 80) return "hsl(var(--success))";
    if (score >= 60) return "hsl(var(--calm))";
    if (score >= 40) return "hsl(var(--warning))";
    return "hsl(var(--alert))";
  };

  const getScoreLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative">
        {/* Breathing glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-30 blur-xl"
          style={{ backgroundColor: getScoreColor() }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* SVG Circle */}
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            className="opacity-30"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 1.5,
              delay: 0.5,
              ease: "easeOut",
            }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-display font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            {score}
          </motion.span>
          <motion.span
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            / 100
          </motion.span>
        </div>
      </div>

      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <p className="text-lg font-semibold" style={{ color: getScoreColor() }}>
          {getScoreLabel()}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Wellness Score</p>
      </motion.div>
    </div>
  );
};
