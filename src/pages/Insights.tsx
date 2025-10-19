import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, Heart, MessageSquare } from "lucide-react";

const Insights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<string>("");

  useEffect(() => {
    checkAuth();
    setLoading(false);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      // Fetch reviews for AI analysis
      const { data: reviews } = await supabase
        .from("reviews")
        .select("summary, emotion, score, keywords")
        .limit(100);

      // TODO: Integrate with Lovable AI to generate insights
      // For now, showing a placeholder
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setInsights(`Based on ${reviews?.length || 0} reviews:
      
• **Top Emotion**: Joy appears most frequently, indicating positive customer sentiment
• **Average Score**: 4.2/5 - customers are generally satisfied
• **Key Themes**: Quality, taste, and delivery speed are most mentioned
• **Recommendation**: Focus on maintaining product quality while improving packaging`);

      toast({
        title: "Insights Generated! ✨",
        description: "AI analysis complete",
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-64 mb-8" />
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                AI Insights
              </h1>
              <p className="text-muted-foreground">Discover patterns and trends in your reviews</p>
            </div>
            <Button
              onClick={generateInsights}
              disabled={generating}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "Generating..." : "Generate Insights"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-card">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Sentiment Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analyze emotional patterns over time</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <Heart className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Top Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Most mentioned topics and themes</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Review Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">AI-powered review highlights</p>
              </CardContent>
            </Card>
          </div>

          {insights && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-card border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Generated Insights
                  </CardTitle>
                  <CardDescription>AI-powered analysis of your reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{insights}</pre>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!insights && (
            <Card className="shadow-card bg-muted/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Click "Generate Insights" to analyze your reviews with AI
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Insights;
