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

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shadow-glow-violet flex-shrink-0">
      <span className="text-xl font-bold text-primary-foreground">R</span>
    </div>
    <span className="font-display text-xl font-bold gradient-text">Rehab360</span>
  </div>
);

const NavItem = ({ item, isActive }: { item: typeof navItems[0]; isActive: boolean }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200",
        "hover:bg-secondary/50 active:scale-[0.97]",
        isActive && "bg-primary/20 text-primary shadow-glow-violet"
      )}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      <span className={cn("font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
        {item.name}
      </span>
    </NavLink>
  );
};

// ─── Mobile: Fixed Header + Slide-in Drawer ───────────────────────────────────
const MobileSidebar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Auto-close on navigation
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Fixed top header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 glass-card border-b border-white/10 backdrop-blur-md flex items-center justify-between px-4">
        <motion.button
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary/50 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </motion.button>

        <Logo />

        {/* spacer to center logo */}
        <div className="w-10" />
      </header>

      {/* Drawer overlay + panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              className="fixed left-0 top-0 z-50 h-full w-[280px] glass-card border-r border-white/10 flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <Logo />
                <motion.button
                  onClick={() => setOpen(false)}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Nav */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <NavItem item={item} isActive={location.pathname === item.path} />
                  </motion.div>
                ))}
              </nav>

              {/* Bottom */}
              <div className="p-4 border-t border-white/10">
                {bottomItems.map((item) => (
                  <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Desktop: Fixed wide sidebar ─────────────────────────────────────────────
const DesktopSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen fixed left-0 top-0 z-40 glass-card border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center p-6 border-b border-white/10">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <NavLink
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200",
                "hover:bg-secondary/50",
                location.pathname === item.path && "bg-primary/20 text-primary shadow-glow-violet"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeBar"
                      className="absolute left-0 w-1 h-7 bg-primary rounded-r-full"
                    />
                  )}
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 ml-1",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <AnimatePresence mode="wait">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn("font-medium whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}
                    >
                      {item.name}
                    </motion.span>
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10">
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 min-h-[48px] rounded-xl transition-all duration-200",
              "hover:bg-secondary/50",
              location.pathname === item.path && "bg-primary/20 text-primary"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("font-medium whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

// ─── Exported Component ───────────────────────────────────────────────────────
export const AppSidebar = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileSidebar /> : <DesktopSidebar />;
};
