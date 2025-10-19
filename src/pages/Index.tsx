import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Sparkles, BarChart3, Brain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 pt-20 pb-32"
      >
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mx-auto w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center shadow-float"
          >
            <UtensilsCrossed className="w-16 h-16 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent"
          >
            Emotion Bubble Explorer
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
          >
            Discover the flavors of customer sentiment through interactive AI-powered
            visualization 🍕
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="bg-gradient-primary hover:shadow-float transition-all text-lg px-8"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              size="lg"
              variant="outline"
              className="text-lg px-8 border-2"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Demo
            </Button>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {[
            {
              icon: BarChart3,
              title: "Interactive Bubbles",
              description:
                "Visualize emotions as colorful bubbles - size shows frequency, color shows sentiment",
            },
            {
              icon: Brain,
              title: "AI Insights",
              description:
                "Get intelligent summaries and trends from thousands of customer reviews",
            },
            {
              icon: Sparkles,
              title: "Real-time Analysis",
              description:
                "Upload CSV files and instantly see emotion patterns across your data",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.2 }}
              className="bg-card rounded-2xl p-8 shadow-card border-2 hover:shadow-float transition-all"
            >
              <div className="bg-gradient-primary w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-bubble">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
