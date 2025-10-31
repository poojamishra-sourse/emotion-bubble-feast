import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  BarChart3,
  Upload,
  Sparkles,
  Settings,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const Sidebar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="w-70 h-screen bg-card border-r border-border flex flex-col shadow-card"
    >
      {/* Logo */}
      <div className="p-6">
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
        >
          <div className="bg-primary w-12 h-12 rounded-2xl flex items-center justify-center shadow-bubble">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-primary bg-clip-text text-transparent">
              Emotion Bubble
            </h1>
            <p className="text-xs text-muted-foreground">Explorer</p>
          </div>
        </motion.div>
      </div>

      <Separator className="mx-4" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-bubble"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <Separator className="mx-4" />

      {/* Logout */}
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
