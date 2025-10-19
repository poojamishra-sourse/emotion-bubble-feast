import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import BubbleChart from "@/components/BubbleChart";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Users, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Review {
  id: string;
  summary: string;
  text: string;
  score: number;
  emotion: string;
  keywords: string[];
  profile_name: string;
}

const Dashboard = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchReviews();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase.from("reviews").select("*").limit(100);

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading reviews",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setGeneratingInsights(true);
    try {
      // This will be connected to AI insights functionality
      toast({
        title: "Generating insights... 🤖",
        description: "AI is analyzing your reviews!",
      });
      // TODO: Connect to AI insights edge function
      navigate("/insights");
    } catch (error: any) {
      toast({
        title: "Error generating insights",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  const stats = {
    total: reviews.length,
    avgScore: reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.score, 0) / reviews.length).toFixed(1)
      : "0",
    topEmotion: reviews.length > 0
      ? Object.entries(
          reviews.reduce((acc, r) => {
            acc[r.emotion || "neutral"] = (acc[r.emotion || "neutral"] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"
      : "N/A",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Emotion Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Visualize sentiment across food reviews
              </p>
            </div>
            <Button
              onClick={generateInsights}
              disabled={generatingInsights || reviews.length === 0}
              className="bg-gradient-primary hover:shadow-float transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingInsights ? "Generating..." : "AI Insights"}
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-2 hover:shadow-card transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                  <Users className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.total}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-2 hover:shadow-card transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Star className="w-5 h-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">{stats.avgScore}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-2 hover:shadow-card transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Top Emotion</CardTitle>
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary capitalize">
                    {stats.topEmotion}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bubble Chart */}
          {reviews.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="min-h-[600px]"
            >
              <BubbleChart reviews={reviews} />
            </motion.div>
          ) : (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="text-6xl">🍽️</div>
                <h3 className="text-2xl font-bold">No reviews yet</h3>
                <p className="text-muted-foreground">
                  Upload your CSV file to start exploring emotions!
                </p>
                <Button onClick={() => navigate("/upload")} className="mt-4">
                  Upload Reviews
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
