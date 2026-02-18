import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AIChatbot } from "@/components/features/AIChatbot";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    // Full viewport, no overflow at root level
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />

      {/* Main content — only this scrolls */}
      <motion.main
        className={cn(
          "flex-1 h-screen overflow-y-auto overscroll-contain scroll-smooth",
          isMobile ? "w-full" : "lg:ml-72"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={isMobile ? "p-4 pt-20 pb-24" : "p-6 md:p-8"}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
};

// small local helper to avoid importing clsx in layout
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
