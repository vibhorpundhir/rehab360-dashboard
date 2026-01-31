import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AIChatbot } from "@/components/features/AIChatbot";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      
      {/* Main Content */}
      <motion.main
        className="flex-1 ml-20 md:ml-[260px] transition-all duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="min-h-screen p-6 md:p-8">
          {children}
        </div>
      </motion.main>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
};
