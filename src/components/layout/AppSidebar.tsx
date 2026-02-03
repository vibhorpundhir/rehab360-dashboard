import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Moon,
  Heart,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Vitals", path: "/vitals", icon: Activity },
  { name: "Sleep", path: "/sleep", icon: Moon },
  { name: "Journal", path: "/journal", icon: Heart },
  { name: "Insights", path: "/insights", icon: TrendingUp },
  { name: "Mind", path: "/mind", icon: Brain },
];

const bottomItems = [
  { name: "Settings", path: "/settings", icon: Settings },
];

export const AppSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen glass-card border-r border-white/10",
        "flex flex-col transition-all duration-300"
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        width: isCollapsed ? 80 : 260,
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet">
                <span className="text-xl font-bold text-white">R</span>
              </div>
              <span className="font-display text-xl font-bold gradient-text">
                Rehab360
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet mx-auto"
          >
            <span className="text-xl font-bold text-white">R</span>
          </motion.div>
        )}
      </div>

      {/* Toggle Button */}
      <motion.button
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full",
          "bg-primary/80 text-primary-foreground",
          "flex items-center justify-center",
          "hover:bg-primary transition-colors shadow-glow-violet"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </motion.button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  "hover:bg-white/5",
                  isActive && "bg-primary/20 text-primary shadow-glow-violet"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn(
                        "whitespace-nowrap font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-white/10">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                "hover:bg-white/5",
                isActive && "bg-primary/20 text-primary"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className={cn(
                      "whitespace-nowrap font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </div>
    </motion.aside>
  );
};
