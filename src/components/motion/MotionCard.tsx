import { motion, HTMLMotionProps, Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glow" | "bordered";
  hoverLift?: boolean;
  delay?: number;
}

export const MotionCard = ({
  children,
  className,
  variant = "default",
  hoverLift = true,
  delay = 0,
  ...props
}: MotionCardProps) => {
  const variantClasses = {
    default: "glass-card",
    glow: "glass-card animate-glow",
    bordered: "glass-card animated-border",
  };

  const springTransition: Transition = {
    type: "spring" as const,
    damping: 20,
    stiffness: 300,
    delay: delay * 0.1,
  };

  return (
    <motion.div
      className={cn(
        variantClasses[variant],
        "p-6",
        hoverLift && "cursor-pointer",
        className
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springTransition}
      whileHover={
        hoverLift
          ? {
              y: -4,
              scale: 1.01,
              transition: { type: "spring" as const, stiffness: 400, damping: 25 },
            }
          : undefined
      }
      whileTap={hoverLift ? { scale: 0.98 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};
