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
    <div className="min-h-screen flex w-full">
      <AppSidebar />

      {/* Main Content */}
      <motion.main
        className={
          isMobile
            ? "flex-1 min-h-screen overflow-y-auto overscroll-contain"
            : "flex-1 ml-20 md:ml-[260px] min-h-screen overflow-y-auto overscroll-contain"
        }
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className={isMobile ? "p-4 pt-20 pb-28" : "p-6 md:p-8"}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
