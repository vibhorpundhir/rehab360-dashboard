import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  className?: string;
  message?: string;
}

export function EmptyState({ className, message }: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center glass-card",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <BarChart3 className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No data yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {message || "Log your first entry to unlock your biological insights and track your recovery journey."}
      </p>
      <Button onClick={() => navigate("/journal")} className="btn-glow">
        Log Your First Entry
      </Button>
    </motion.div>
  );
}
