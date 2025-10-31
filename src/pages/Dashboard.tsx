import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import BubbleChart from "@/components/BubbleChart";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Users, Star, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Review {
  id: string;
  summary: string;
  text: string;
  score: number;
  emotion: string;
  keywords: string[];
  profile_name: string;
  created_at?: string;
}

const Dashboard = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) {
        navigate("/auth");
        return false;
      }
      return true;
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/auth");
      return false;
    }
  }, [navigate, toast]);

  const fetchReviews = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Remove the limit to get all reviews, or increase it if you have large datasets
      const { data, error, count } = await supabase
        .from("reviews")
        .select("*", { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} reviews`);
      setReviews(data || []);

      if (data && data.length === 0) {
        toast({
          title: "No reviews found",
          description: "Upload a CSV file to get started",
        });
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error loading reviews",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    const initializeDashboard = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        await fetchReviews();
      }
    };

    initializeDashboard();
  }, [checkAuth, fetchReviews]);

  const generateInsights = async () => {
    if (reviews.length === 0) {
      toast({
        title: "No reviews available",
        description: "Please upload reviews first to generate insights",
        variant: "destructive",
      });
      return;
    }

    setGeneratingInsights(true);
    try {
      toast({
        title: "Generating insights... 🤖",
        description: "AI is analyzing your reviews!",
      });
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  const handleRefresh = () => {
    fetchReviews(true);
  };

  // Calculate statistics
  const stats = {
    total: reviews.length,
    avgScore: reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.score || 0), 0) / reviews.length).toFixed(1)
      : "0.0",
    topEmotion: reviews.length > 0
      ? Object.entries(
          reviews.reduce((acc, r) => {
            const emotion = r.emotion || "neutral";
            acc[emotion] = (acc[emotion] || 0) + 1;
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
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Emotion Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Visualize sentiment across {reviews.length} food reviews
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                onClick={generateInsights}
                disabled={generatingInsights || reviews.length === 0}
                className="bg-gradient-primary hover:shadow-float transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {generatingInsights ? "Generating..." : "AI Insights"}
              </Button>
            </div>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    All time reviews
                  </p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Out of 5 stars
                  </p>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Most frequent sentiment
                  </p>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Emotion Visualization</h2>
                <div className="text-sm text-muted-foreground">
                  Showing {reviews.length} reviews
                </div>
              </div>
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