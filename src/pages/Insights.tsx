import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Heart, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";

interface Review {
  summary: string;
  emotion: string;
  score: number;
  keywords: string[];
  profile_name?: string;
}

interface InsightsData {
  summary: string;
  sentimentTrends: string[];
  topKeywords: { keyword: string; count: number }[];
  recommendations: string[];
  overallScore: number;
  totalReviews: number;
}

const Insights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [reviewsCount, setReviewsCount] = useState(0);

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

  const fetchReviewsData = useCallback(async () => {
    try {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("summary, emotion, score, keywords, profile_name")
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviewsCount(reviews?.length || 0);
      return reviews || [];
    } catch (error: any) {
      toast({
        title: "Error fetching reviews",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  useEffect(() => {
    const initialize = async () => {
      const isAuthenticated = await checkAuth();
      if (isAuthenticated) {
        await fetchReviewsData();
        setLoading(false);
      }
    };

    initialize();
  }, [checkAuth, fetchReviewsData]);

  const analyzeReviews = (reviews: Review[]): InsightsData => {
    if (reviews.length === 0) {
      return {
        summary: "No reviews available for analysis.",
        sentimentTrends: [],
        topKeywords: [],
        recommendations: ["Upload more reviews to generate insights."],
        overallScore: 0,
        totalReviews: 0
      };
    }

    // Calculate overall score
    const totalScore = reviews.reduce((sum, review) => sum + (review.score || 0), 0);
    const overallScore = Number((totalScore / reviews.length).toFixed(1));

    // Analyze emotions
    const emotionCount = reviews.reduce((acc, review) => {
      const emotion = review.emotion || 'neutral';
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEmotion = Object.entries(emotionCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

    // Analyze keywords
    const keywordCount = reviews.reduce((acc, review) => {
      review.keywords?.forEach(keyword => {
        acc[keyword] = (acc[keyword] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(keywordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));

    // Generate insights based on data
    const sentimentTrends = [
      `"${topEmotion}" is the most common emotion (${emotionCount[topEmotion]} reviews)`,
      `${overallScore >= 4 ? 'High' : overallScore >= 3 ? 'Moderate' : 'Low'} overall satisfaction`,
      `${reviews.filter(r => r.score >= 4).length} positive reviews (4+ stars)`
    ];

    const recommendations = [
      overallScore < 3 ? "Focus on improving product quality and customer service" : "Maintain current quality standards",
      topKeywords.length > 0 ? `Address feedback about: ${topKeywords.slice(0, 2).map(k => k.keyword).join(', ')}` : "Collect more detailed feedback",
      "Consider implementing customer suggestions from reviews"
    ];

    return {
      summary: `Based on analysis of ${reviews.length} reviews, your business shows ${overallScore >= 4 ? 'strong' : 'moderate'} performance with a dominant "${topEmotion}" sentiment.`,
      sentimentTrends,
      topKeywords,
      recommendations,
      overallScore,
      totalReviews: reviews.length
    };
  };

  const generateInsights = async () => {
    if (reviewsCount === 0) {
      toast({
        title: "No reviews available",
        description: "Please upload reviews first to generate insights",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const reviews = await fetchReviewsData();
      
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analyzedInsights = analyzeReviews(reviews);
      setInsights(analyzedInsights);

      toast({
        title: "Insights Generated! ✨",
        description: `Analyzed ${reviews.length} reviews successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchReviewsData();
    setLoading(false);
    toast({
      title: "Data refreshed",
      description: "Latest reviews data loaded",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <Skeleton className="h-12 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                AI Insights
              </h1>
              <p className="text-muted-foreground">
                Discover patterns and trends in your {reviewsCount} reviews
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={refreshData}
                disabled={generating}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                onClick={generateInsights}
                disabled={generating || reviewsCount === 0}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? "Generating..." : "Generate Insights"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">Sentiment Trends</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Analyze emotional patterns and satisfaction trends over time
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">Top Keywords</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Most mentioned topics and themes in customer feedback
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  <CardTitle className="text-lg">Smart Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  AI-powered suggestions to improve customer experience
                </p>
              </CardContent>
            </Card>
          </div>

          {insights && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Overall Summary */}
              <Card className="shadow-card border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Executive Summary
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis of {insights.totalReviews} reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-lg leading-relaxed">{insights.summary}</p>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="text-sm">
                        Overall Score: {insights.overallScore}/5
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        {insights.totalReviews} Reviews
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sentiment Trends */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Sentiment Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {insights.sentimentTrends.map((trend, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span>{trend}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Top Keywords */}
              {insights.topKeywords.length > 0 && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Top Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {insights.topKeywords.map(({ keyword, count }) => (
                        <Badge key={keyword} variant="outline" className="text-sm">
                          {keyword} ({count})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {insights.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!insights && (
            <Card className="shadow-card bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Insights Generated</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {reviewsCount === 0 
                    ? "Upload some reviews first to generate AI-powered insights"
                    : "Click 'Generate Insights' to analyze your reviews with AI"
                  }
                </p>
                {reviewsCount === 0 && (
                  <Button onClick={() => navigate("/upload")} className="gap-2">
                    Upload Reviews
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Insights;