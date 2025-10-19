import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, FileText, CheckCircle } from "lucide-react";

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n");
    const headers = lines[0].split(",");
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(",");
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || "";
        });
        data.push(row);
      }
    }

    return data;
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

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Sample emotions for demo purposes (in production, use AI model)
      const emotions = ["joy", "love", "surprise", "anger", "sadness", "fear", "neutral"];

      const reviewsToInsert = rows.slice(0, 50).map((row) => ({
        product_id: row.ProductId || "",
        user_id: user.id,
        profile_name: row.ProfileName || "Anonymous",
        score: parseInt(row.Score) || 3,
        summary: row.Summary || "",
        text: row.Text || "",
        clean_text: row.clean_text || "",
        tokens: row.tokens ? JSON.parse(row.tokens.replace(/'/g, '"')) : [],
        token_count: parseInt(row.token_count) || 0,
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        keywords: row.tokens ? JSON.parse(row.tokens.replace(/'/g, '"')).slice(0, 5) : [],
      }));

      const { error } = await supabase.from("reviews").insert(reviewsToInsert);

      if (error) throw error;

      toast({
        title: "Success! 🎉",
        description: `${reviewsToInsert.length} reviews uploaded successfully`,
      });

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-gradient-primary hover:shadow-float transition-all"
                size="lg"
              >
                <UploadIcon className="w-5 h-5 mr-2" />
                {uploading ? "Uploading..." : "Upload & Process"}
              </Button>

              <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">Expected CSV format:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>ProductId, ProfileName, Score, Summary, Text</li>
                  <li>clean_text, tokens, token_count (optional)</li>
                  <li>Maximum 50 reviews per upload</li>
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
