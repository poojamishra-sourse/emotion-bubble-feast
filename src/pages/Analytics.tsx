import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Review {
  id: string;
  emotion: string;
  score: number;
  created_at: string;
}

const EMOTION_COLORS = {
  joy: "#fbbf24",
  love: "#ec4899",
  surprise: "#8b5cf6",
  anger: "#ef4444",
  sadness: "#3b82f6",
  fear: "#6366f1",
  neutral: "#6b7280",
};

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchReviews();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, emotion, score, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const emotionDistribution = Object.entries(
    reviews.reduce((acc, review) => {
      acc[review.emotion] = (acc[review.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([emotion, count]) => ({
    emotion,
    count,
    fill: EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS] || "#6b7280",
  }));

  const scoreDistribution = [1, 2, 3, 4, 5].map((score) => ({
    score: `${score} Star`,
    count: reviews.filter((r) => r.score === score).length,
  }));

  // Group by date for line chart
  const reviewsByDate = reviews.reduce((acc, review) => {
    const date = new Date(review.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const timelineData = Object.entries(reviewsByDate).map(([date, count]) => ({
    date,
    reviews: count,
  }));

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Charts & Analytics
          </h1>
          <p className="text-muted-foreground mb-8">Visual insights from your review data</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotion Distribution - Pie Chart */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Emotion Distribution</CardTitle>
                <CardDescription>Breakdown of emotions in reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={emotionDistribution}
                      dataKey="count"
                      nameKey="emotion"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.emotion}: ${entry.count}`}
                    >
                      {emotionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score Distribution - Bar Chart */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Customer rating breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="score" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#fbbf24" name="Number of Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Reviews Timeline - Line Chart */}
            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Reviews Timeline</CardTitle>
                <CardDescription>Review submissions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="reviews" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      name="Number of Reviews"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Analytics;
