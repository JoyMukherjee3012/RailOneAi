import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { getTrackDefects } from "@/lib/railway-data";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Camera, Loader2, Bot } from "lucide-react";
import { askGeminiVision } from "@/lib/gemini";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { RailwayMap } from "@/components/RailwayMap";

export const Route = createFileRoute("/_authenticated/inspection")({ component: Inspection });

function Inspection() {
  const [defects, setDefects] = useState<any[]>([]);
  const [activeDefect, setActiveDefect] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTrackDefects().then(setDefects);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setAnalysis(null);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      setImagePreview(reader.result as string);
      
      try {
        const result = await askGeminiVision(
          "Analyze this railway track image. Identify any visible defects (cracks, missing fasteners, rust, alignment issues). Provide a severity rating (Safe, Warning, High, Critical), an estimated repair cost (in INR), and a short summary of the required actions.",
          base64String,
          file.type
        );
        setAnalysis(result);
      } catch (err: any) {
        toast.error(`Analysis failed: ${err.message}`);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const sevColor = (s: string) => s === "critical" ? "text-[var(--critical)] border-[var(--critical)]/50" :
    s === "high" ? "text-orange-400 border-orange-400/50" :
    s === "medium" ? "text-[var(--warning)] border-[var(--warning)]/50" :
    "text-[var(--success)] border-[var(--success)]/50";

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Track Inspection" title="AI Defect Analysis" description="Drone-captured imagery with AI severity classification and repair predictions." />
      
      <div className="mb-6">
        <Card className="glass border-border/60 p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-1/3 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl p-8 bg-background/40 hover:bg-background/60 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              {imagePreview ? (
                <img src={imagePreview} alt="Upload preview" className="w-full aspect-video object-cover rounded-lg shadow-lg mb-4" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="text-center">
                <p className="font-semibold">{imagePreview ? "Change Image" : "Upload Track Image"}</p>
                <p className="text-xs text-muted-foreground mt-1">AI will analyze the image for defects</p>
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">AI Analysis Results</h3>
              </div>
              
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm">Gemini Vision is analyzing the track geometry...</p>
                </div>
              ) : analysis ? (
                <div className="prose prose-sm prose-invert max-w-none bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground border border-dashed border-border/40 rounded-lg bg-background/20">
                  <p className="text-sm">Upload an image to see the AI analysis here.</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px] overflow-y-auto pr-2">
          {defects.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card 
                className={`glass border-border/60 overflow-hidden cursor-pointer transition-colors ${activeDefect === d.id ? 'bg-primary/5 border-primary/50' : ''}`}
                onClick={() => setActiveDefect(d.id)}
              >
                <div className="grid grid-cols-2 gap-px bg-border/60">
                  <div className="aspect-video bg-background/60 grid place-items-center relative">
                    <div className="absolute top-2 left-2 text-[9px] uppercase tracking-widest text-muted-foreground">Before</div>
                    <div className="text-3xl">🛤️</div>
                    <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                  </div>
                  <div className="aspect-video bg-background/60 grid place-items-center relative">
                    <div className="absolute top-2 left-2 text-[9px] uppercase tracking-widest text-[var(--critical)]">Detected</div>
                    <div className="text-3xl">⚠️</div>
                    <div className="absolute inset-2 border-2 border-dashed border-[var(--critical)]/60 rounded animate-pulse" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{d.defect_type}</div>
                    <Badge variant="outline" className={`text-[10px] uppercase ${sevColor(d.severity)}`}>{d.severity}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{d.section_name ?? "Unknown section"}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Repair time</div>
                      <div className="font-mono font-bold">{d.repair_time_prediction ?? "—"} min</div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Est. cost</div>
                      <div className="font-mono font-bold">₹{Number(d.repair_cost_prediction ?? 0).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                  <div className="text-[10px] mt-2 font-mono text-muted-foreground">{d.latitude.toFixed(3)}, {d.longitude.toFixed(3)} · {d.status}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <Card className="glass border-border/60 overflow-hidden h-[600px]">
          <RailwayMap height="100%" showAll focusId={activeDefect} />
        </Card>
      </div>
    </div>
  );
}