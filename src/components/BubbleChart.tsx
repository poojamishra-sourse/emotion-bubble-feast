import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as d3 from "d3";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface Review {
  id: string;
  summary: string;
  text: string;
  score: number;
  emotion: string;
  keywords: string[];
  profile_name: string;
}

interface BubbleChartProps {
  reviews: Review[];
}

const emotionColors = {
  joy: "hsl(var(--emotion-joy))",
  love: "hsl(var(--emotion-love))",
  surprise: "hsl(var(--emotion-surprise))",
  anger: "hsl(var(--emotion-anger))",
  sadness: "hsl(var(--emotion-sadness))",
  fear: "hsl(var(--emotion-fear))",
  neutral: "hsl(var(--emotion-neutral))",
};

const BubbleChart = ({ reviews }: BubbleChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      const container = svgRef.current?.parentElement;
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.min(600, window.innerHeight - 200),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || reviews.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Prepare data - group by emotion
    const emotionGroups = d3.rollup(
      reviews,
      (v) => v.length,
      (d) => d.emotion || "neutral"
    );

    const bubbleData = Array.from(emotionGroups, ([emotion, count]) => ({
      emotion,
      count,
      reviews: reviews.filter((r) => (r.emotion || "neutral") === emotion),
    }));

    // Create bubble pack
    const pack = d3
      .pack<{ emotion: string; count: number; reviews: Review[] }>()
      .size([width - 40, height - 40])
      .padding(10);

    const root = d3
      .hierarchy({ children: bubbleData } as any)
      .sum((d: any) => d.count || 0);

    const nodes = pack(root).leaves();

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "bubble-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw bubbles
    const bubbles = g
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x - width / 2}, ${d.y - height / 2})`)
      .style("cursor", "pointer");

    bubbles
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d: any) => {
        const emotion = d.data.emotion.toLowerCase();
        return emotionColors[emotion as keyof typeof emotionColors] || emotionColors.neutral;
      })
      .attr("fill-opacity", 0.7)
      .attr("stroke", (d: any) => {
        const emotion = d.data.emotion.toLowerCase();
        return emotionColors[emotion as keyof typeof emotionColors] || emotionColors.neutral;
      })
      .attr("stroke-width", 2)
      .on("mouseover", function (event, d: any) {
        d3.select(this).attr("fill-opacity", 0.9).attr("stroke-width", 3);
        tooltip
          .style("visibility", "visible")
          .html(
            `<strong>${d.data.emotion}</strong><br/>Reviews: ${d.data.count}<br/>Click to explore`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill-opacity", 0.7).attr("stroke-width", 2);
        tooltip.style("visibility", "hidden");
      })
      .on("click", function (event, d: any) {
        if (d.data.reviews && d.data.reviews.length > 0) {
          setSelectedReview(d.data.reviews[0]);
        }
      });

    // Add labels
    bubbles
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("font-size", (d) => Math.min(d.r / 3, 24) + "px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("pointer-events", "none")
      .text((d: any) => d.data.emotion);

    bubbles
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1em")
      .style("font-size", (d) => Math.min(d.r / 4, 16) + "px")
      .style("fill", "white")
      .style("pointer-events", "none")
      .text((d: any) => `${d.data.count} reviews`);

    return () => {
      tooltip.remove();
    };
  }, [reviews, dimensions]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex items-center justify-center bg-gradient-card rounded-2xl shadow-card p-4"
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible"
        />
      </motion.div>

      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-primary bg-clip-text text-transparent">
              {selectedReview?.summary}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Reviewer</p>
              <p className="font-medium">{selectedReview?.profile_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Review</p>
              <p className="text-foreground leading-relaxed">{selectedReview?.text}</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Score</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < (selectedReview?.score || 0)
                          ? "text-accent"
                          : "text-muted-foreground"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Emotion</p>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{
                    background:
                      emotionColors[
                        (selectedReview?.emotion?.toLowerCase() || "neutral") as keyof typeof emotionColors
                      ],
                  }}
                >
                  {selectedReview?.emotion}
                </span>
              </div>
            </div>
            {selectedReview?.keywords && selectedReview.keywords.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {selectedReview.keywords.slice(0, 8).map((keyword, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-muted rounded-lg text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BubbleChart;
