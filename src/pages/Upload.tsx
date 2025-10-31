import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload as UploadIcon, FileText, CheckCircle, Loader2, Database, FileCheck, Users, BarChart3 } from "lucide-react";

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Reset progress when new file is selected
      setProgress(0);
      setProcessedCount(0);
      setTotalCount(0);
      setCurrentStep("");
      setCurrentActivity("");
    }
  };

  const parseTokensArray = (tokensStr: string): string[] => {
    try {
      // Remove outer quotes if present
      const cleaned = tokensStr.trim().replace(/^["']|["']$/g, '');
      
      // Parse Python-style list: ['word1', 'word2', ...]
      if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        const content = cleaned.slice(1, -1);
        // Split by ', ' and remove quotes from each token
        return content
          .split("', '")
          .map(token => token.replace(/^['"]|['"]$/g, '').trim())
          .filter(token => token.length > 0);
      }
      
      return [];
    } catch (error) {
      console.error("Error parsing tokens:", error);
      return [];
    }
  };

  const updateProgress = (current: number, total: number, activity: string) => {
    setProcessedCount(current);
    setTotalCount(total);
    setProgress(Math.round((current / total) * 100));
    setCurrentActivity(activity);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setProcessedCount(0);
    setCurrentStep("initializing");

    try {
      setCurrentActivity("Reading file...");
      const text = await file.text();
      console.log("CSV file content:", text);
      
      setCurrentStep("parsing");
      setCurrentActivity("Parsing CSV data...");
      
      // Parse CSV with PapaParse - handles quoted fields correctly
      const parseResult = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
      });

      if (parseResult.errors.length > 0) {
        console.error("CSV parsing errors:", parseResult.errors);
        throw new Error("Invalid CSV format");
      }

      const rows = parseResult.data;
      setTotalCount(rows.length);

      setCurrentStep("authentication");
      setCurrentActivity("Authenticating user...");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Sample emotions for demo purposes (in production, use AI model)
      const emotions = ["joy", "love", "surprise", "anger", "sadness", "fear", "neutral"];

      setCurrentStep("processing");
      setCurrentActivity("Processing reviews data...");

      const reviewsToInsert = rows.slice(0, 50).map((row: any, index: number) => {
        updateProgress(index + 1, rows.length, "Processing reviews...");
        
        const parsedTokens = parseTokensArray(row.tokens || "");
        
        return {
          product_id: row.ProductId || "",
          user_id: user.id,
          profile_name: row.ProfileName || "Anonymous",
          score: parseInt(row.Score) || 3,
          summary: row.Summary || "",
          text: row.Text || "",
          clean_text: row.clean_text || "",
          tokens: parsedTokens,
          token_count: parseInt(row.token_count) || parsedTokens.length,
          emotion: emotions[Math.floor(Math.random() * emotions.length)],
          keywords: parsedTokens.slice(0, 5),
        };
      });

      setCurrentStep("uploading");
      setCurrentActivity("Uploading to database...");
      updateProgress(0, reviewsToInsert.length, "Uploading reviews...");

      // Simulate progress during upload
      for (let i = 0; i < reviewsToInsert.length; i += 10) {
        const batch = reviewsToInsert.slice(i, i + 10);
        updateProgress(i + batch.length, reviewsToInsert.length, "Uploading to database...");
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { error } = await supabase.from("reviews").insert(reviewsToInsert);

      if (error) throw error;

      setCurrentStep("completed");
      setCurrentActivity("Upload completed!");
      setProgress(100);

      toast({
        title: "Success! 🎉",
        description: `${reviewsToInsert.length} reviews uploaded successfully`,
      });

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      console.error("Upload error:", error);
      setCurrentStep("error");
      setCurrentActivity(`Error: ${error.message}`);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "initializing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "parsing":
        return <FileCheck className="w-4 h-4" />;
      case "authentication":
        return <Users className="w-4 h-4" />;
      case "processing":
        return <BarChart3 className="w-4 h-4" />;
      case "uploading":
        return <Database className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "error":
        return <Loader2 className="w-4 h-4 text-destructive" />;
      default:
        return <Loader2 className="w-4 h-4" />;
    }
  };

  const getStepColor = (step: string) => {
    if (step === "error") return "text-destructive";
    if (step === "completed") return "text-green-600";
    return "text-primary";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-primary bg-clip-text text-transparent">
              Upload Reviews
            </h1>
            <p className="text-muted-foreground mt-2">
              Import your CSV file to start analyzing emotions
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>CSV File Upload</CardTitle>
              <CardDescription>
                Upload a preprocessed CSV file with review data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex flex-col items-center gap-4"
                  >
                    {file ? (
                      <>
                        <CheckCircle className="w-16 h-16 text-primary" />
                        <div>
                          <p className="font-medium text-lg">{file.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Click to change file
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FileText className="w-16 h-16 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-lg">Choose CSV file</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            or drag and drop here
                          </p>
                        </div>
                      </>
                    )}
                  </motion.div>
                </label>
              </div>

              {/* Progress and Activity Indicator */}
              {(uploading || currentStep) && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStepIcon(currentStep)}
                        <span className={`font-medium ${getStepColor(currentStep)}`}>
                          {currentActivity || "Preparing..."}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {processedCount}/{totalCount}
                      </Badge>
                    </div>
                    
                    <Progress value={progress} className="h-2" />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Step: {currentStep || "Waiting..."}</span>
                      <span>{progress}%</span>
                    </div>

                    {/* Detailed Progress Steps */}
                    {uploading && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className={`text-center p-2 rounded ${currentStep === "parsing" ? "bg-primary/20" : ""}`}>
                          Parsing
                        </div>
                        <div className={`text-center p-2 rounded ${currentStep === "processing" ? "bg-primary/20" : ""}`}>
                          Processing
                        </div>
                        <div className={`text-center p-2 rounded ${currentStep === "uploading" ? "bg-primary/20" : ""}`}>
                          Uploading
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-primary hover:shadow-float transition-all"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>

              <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">Expected CSV format:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>ProductId, ProfileName, Score, Summary, Text</li>
                  <li>clean_text, tokens, token_count (optional)</li>
                  <li>Maximum 50 reviews per upload</li>
                  <a href="/sample_file.csv" className="text-primary hover:underline">
                    <li>Sample file Download</li>
                  </a>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Upload;