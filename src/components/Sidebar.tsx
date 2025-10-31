import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BarChart3,
  Upload,
  Sparkles,
  Settings,
  LogOut,
  UtensilsCrossed,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";
// import { useMediaQuery } from "@/hooks/use-media-query";


const Sidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
    { icon: Upload, label: "Upload Reviews", path: "/upload" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Sparkles, label: "Insights", path: "/insights" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
      description: "Come back soon! 👋",
    });
    navigate("/auth");
  };

  const handleNavClick = () => {
    if (!isDesktop) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 md:p-6">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="bg-primary w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-bubble">
            <UtensilsCrossed className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base md:text-lg bg-primary bg-clip-text text-transparent truncate">
              Emotion Bubble
            </h1>
            <p className="text-xs text-muted-foreground hidden md:block">Explorer</p>
          </div>
        </motion.div>
      </div>

      <Separator className="mx-4" />

      {/* Navigation */}
      <nav className="flex-1 px-2 md:px-4 py-4 md:py-6 space-y-1 md:space-y-2">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all text-sm md:text-base ${
                  isActive
                    ? "bg-primary text-white shadow-bubble"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <Separator className="mx-4" />

      {/* Logout */}
      <div className="p-3 md:p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-sm md:text-base"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="truncate">Logout</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {!isDesktop && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg md:hidden"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      )}

      {/* Desktop Sidebar */}
      {isDesktop && (
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          className="w-64 md:w-70 h-screen bg-card border-r border-border flex flex-col shadow-card fixed left-0 top-0 z-40"
        >
          {sidebarContent}
        </motion.aside>
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {!isDesktop && isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-70 h-screen bg-card border-r border-border flex flex-col shadow-card fixed left-0 top-0 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for desktop sidebar */}
      {isDesktop && <div className="w-64 md:w-70 flex-shrink-0" />}
    </>
  );
};

export default Sidebar;