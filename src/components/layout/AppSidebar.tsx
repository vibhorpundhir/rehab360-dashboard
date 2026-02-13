import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Menu,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Mobile: floating hamburger + drawer
  if (isMobile) {
    return (
      <>
        {/* Floating hamburger button */}
        <motion.button
          className="fixed top-4 right-4 z-50 w-12 h-12 rounded-xl glass-card flex items-center justify-center border border-white/10"
          onClick={() => setMobileOpen(true)}
          whileTap={{ scale: 0.92 }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </motion.button>

        {/* Overlay + Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Dark overlay */}
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />

              {/* Slide-in sidebar */}
              <motion.aside
                className="fixed left-0 top-0 z-50 h-full w-[280px] glass-card border-r border-white/10 flex flex-col"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet">
                      <span className="text-xl font-bold text-primary-foreground">R</span>
                    </div>
                    <span className="font-display text-xl font-bold gradient-text">
                      Rehab360
                    </span>
                  </div>
                  <motion.button
                    onClick={() => setMobileOpen(false)}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary/50"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {navItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                      >
                        <NavLink
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200",
                            "hover:bg-secondary/50 active:scale-[0.98]",
                            isActive && "bg-primary/20 text-primary shadow-glow-violet"
                          )}
                        >
                          <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                            {item.name}
                          </span>
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Bottom */}
                <div className="p-4 border-t border-white/10">
                  {bottomItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200",
                          "hover:bg-secondary/50 active:scale-[0.98]",
                          isActive && "bg-primary/20 text-primary"
                        )}
                      >
                        <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                          {item.name}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop sidebar (unchanged logic, improved scroll)
  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen glass-card border-r border-white/10",
        "flex flex-col"
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: isCollapsed ? 80 : 260 }}
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
                <span className="text-xl font-bold text-primary-foreground">R</span>
              </div>
              <span className="font-display text-xl font-bold gradient-text">Rehab360</span>
            </motion.div>
          )}
        </AnimatePresence>
        {isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet mx-auto">
            <span className="text-xl font-bold text-primary-foreground">R</span>
          </motion.div>
        )}
      </div>

      {/* Toggle */}
      <motion.button
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full",
          "bg-primary/80 text-primary-foreground flex items-center justify-center",
          "hover:bg-primary transition-colors shadow-glow-violet"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </motion.button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <motion.div key={item.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
              <NavLink
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200",
                  "hover:bg-secondary/50",
                  isActive && "bg-primary/20 text-primary shadow-glow-violet"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className={cn("whitespace-nowrap font-medium", isActive ? "text-foreground" : "text-muted-foreground")}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div layoutId="activeIndicator" className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10">
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200",
                "hover:bg-secondary/50",
                isActive && "bg-primary/20 text-primary"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className={cn("whitespace-nowrap font-medium", isActive ? "text-foreground" : "text-muted-foreground")}
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
