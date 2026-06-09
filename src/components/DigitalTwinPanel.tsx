import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getERTrains, getStationHealth, getTrackDefects, getIncidents } from "@/lib/railway-data";
import { 
  X, Activity, HeartPulse, Clock, Wrench, ShieldAlert, 
  History, Download, RefreshCcw, Bell, Zap, Bot 
} from "lucide-react";
import { toast } from "sonner";
import { askGemini } from "@/lib/gemini";
import { runMatlabForSegment } from "@/hooks/use-matlab-sync";
import ReactMarkdown from "react-markdown";

interface DigitalTwinPanelProps {
  segmentId: string | null;
  onClose: () => void;
}

export function DigitalTwinPanel({ segmentId, onClose }: DigitalTwinPanelProps) {
  const [segment, setSegment] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'alerts'>('info');
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const loadData = async () => {
    if (!segmentId) return;
    setLoading(true);
    
    try {
      const trains = await getERTrains();
      const defects = await getTrackDefects();
      const incidents = await getIncidents();

      const train = trains.find(t => t.properties.number === segmentId);
      
      if (train) {
        const { score, status } = getStationHealth(train.properties.number);
        
        setSegment({
          type: 'train',
          id: train.properties.number,
          route_name: `${train.properties.number} - ${train.properties.name}`,
          track_id: `${train.properties.from_station_name} → ${train.properties.to_station_name} (${train.properties.type})`,
          health_score: score,
          risk_score: 100 - score,
          status: status,
          latitude: train.geometry?.coordinates?.[0]?.[1],
          longitude: train.geometry?.coordinates?.[0]?.[0],
          repair_time: score < 50 ? 48 : 0,
          priority: score < 50 ? 'High' : 'Low'
        });

        const segmentIncidents = incidents.filter(i => i.id.includes(train.properties.number));

        setPredictions([{
          id: train.properties.number,
          created_at: new Date().toISOString(),
          predicted_failure: `Operating. Risk Level: ${100 - score}/100. ${score < 50 ? 'Maintenance required soon.' : 'Normal operations.'}`,
          repair_time: score < 50 ? 48 : 0
        }]);

        setAlerts(segmentIncidents.map(i => ({
          id: i.id,
          alert_type: i.incident_type,
          created_at: i.created_at,
          severity: i.severity
        })));
        
        setInspections([]);
      } else {
        const erStations = await import("@/lib/railway-data").then(m => m.getERStations());
        const st = erStations.find(s => s.properties.code === segmentId || s.properties.name === segmentId);
        const { score, status } = getStationHealth(segmentId);
        
        setSegment({
          type: 'station',
          id: segmentId,
          route_name: st ? `${st.properties.name} (${st.properties.code})` : segmentId, 
          track_id: `ER Zone`,
          health_score: score,
          risk_score: 100 - score,
          status: status,
          latitude: st?.geometry?.coordinates?.[1],
          longitude: st?.geometry?.coordinates?.[0],
          repair_time: score < 50 ? 72 : 0,
          priority: score < 50 ? 'High' : 'Low'
        });

        setPredictions(score < 60 ? [{
          id: segmentId,
          created_at: new Date().toISOString(),
          predicted_failure: `Station Infrastructure Degradation detected.`,
          repair_time: score < 50 ? 72 : 24
        }] : []);
        
        setAlerts(score < 50 ? [{
          id: `ALR-${segmentId}`,
          alert_type: 'Infrastructure Warning',
          created_at: new Date().toISOString(),
          severity: 'high'
        }] : []);
        
        setInspections([{
          id: `INSP-${segmentId}`,
          inspection_date: new Date(Date.now() - 86400000 * 5).toISOString(),
          findings: score < 50 ? 'Platform structural cracks observed.' : 'Routine check complete. No issues.',
          health_score: score + 5
        }]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [segmentId]);

  const handleAnalyze = async () => {
    if (!segment) return;
    setAnalyzing(true);
    
    try {
      const context = JSON.stringify({ segment, alerts }, null, 2);
      const insight = await askGemini(
        `Analyze this Indian Railway entity (Route or Station). Provide a concise 2-3 sentence conclusion focusing on critical risks, health scores, affected stations/trains, and immediate actions needed based on the context. Do not use markdown headers.`,
        context
      );
      
      setAiInsight(insight);
      toast.success("AI analysis complete.");
    } catch (e: any) {
      toast.error(`Analysis failed: ${e.message}`);
    }
    
    setAnalyzing(false);
  };

  const handlePredict = async () => {
    if (!segment) return;
    setPredicting(true);
    toast.info("Gathering environmental data and running AI prediction...");

    try {
      let elevation = "Unknown";
      let weatherData = "Unknown";
      
      if (segment.latitude && segment.longitude) {
        try {
          const elRes = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${segment.latitude}&longitude=${segment.longitude}`).then(r => r.json());
          if (elRes.elevation && elRes.elevation.length > 0) elevation = elRes.elevation[0];
          
          const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${segment.latitude}&longitude=${segment.longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`).then(r => r.json());
          weatherData = JSON.stringify({ current: wxRes.current, daily: wxRes.daily });
        } catch (e) {
          console.error("Failed to fetch environmental data", e);
        }
      }

      const context = JSON.stringify({ segment, weather: weatherData, elevation, alerts }, null, 2);
      const prediction = await askGemini(
        `As the RailOneAI Engine, predict future operational risks for this railway entity. Consider all factors including the weather predictions for the next days, elevation (${elevation}m), and current segment health. Provide a 3-4 sentence prediction of failure risks and operational impact. Do not use markdown headers.`,
        context
      );
      
      setPredictions([{
        id: segment.id,
        created_at: new Date().toISOString(),
        predicted_failure: prediction,
        repair_time: segment.health_score < 50 ? 48 : 0
      }]);
      toast.success("AI Prediction complete.");
      setActiveTab('info');
    } catch (e: any) {
      toast.error(`Prediction failed: ${e.message}`);
    }
    
    setPredicting(false);
  };

  const handleExport = async () => {
    if (!segment) return;
    toast("Generating AI Engineering Report...");
    
    try {
      const context = JSON.stringify({ segment, predictions, inspections, alerts }, null, 2);
      const report = await askGemini(
        `Generate a professional Engineering Report for this Eastern Railway (ER) asset.
         Include: Track/Station Summary, Health Metrics, Inspection History, Risk Analysis, Repair Recommendations, and AI Conclusions.
         Format it cleanly as markdown.`,
        context
      );

      const blob = new Blob([report], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `engineering-report-${segment.track_id}.md`;
      a.click();
      toast.success("Engineering report exported.");
    } catch (e: any) {
      toast.error(`Export failed: ${e.message}`);
    }
  };

  if (!segmentId) return null;

  const sevColor = (s: string) => s === "critical" ? "var(--critical)" : s === "warning" ? "var(--warning)" : s === "maintenance" ? "var(--warning)" : "var(--success)";

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: 300, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        exit={{ x: 300, opacity: 0 }}
        className="fixed top-20 right-6 w-96 h-[calc(100vh-100px)] z-50 flex flex-col pointer-events-none"
      >
        <Card className="glass border-border/60 flex-1 flex flex-col overflow-hidden pointer-events-auto relative shadow-2xl backdrop-blur-xl bg-background/80">
          {/* Header */}
          <div className="p-4 border-b border-border/60 flex justify-between items-center bg-muted/20">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Digital Twin <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sevColor(segment?.status) }} />
              </div>
              <h3 className="font-bold text-lg mt-0.5">{segment?.route_name || 'Loading...'}</h3>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={loadData}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 flex gap-2 border-b border-border/60 bg-background/40 overflow-x-auto scrollbar-none">
            <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={() => setActiveTab('info')}>
              <Activity className="w-3 h-3 mr-1" /> Details
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={handleAnalyze} disabled={analyzing}>
              <Zap className={`w-3 h-3 mr-1 ${analyzing ? 'animate-pulse' : ''}`} /> Analyze
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={handlePredict} disabled={predicting}>
              <Clock className={`w-3 h-3 mr-1 ${predicting ? 'animate-spin' : ''}`} /> Predict
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={() => setActiveTab('history')}>
              <History className="w-3 h-3 mr-1" /> History
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {loading && !segment ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : segment && activeTab === 'info' ? (
              <>
                <section>
                  {aiInsight && (
                    <div className="mb-4 bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                        <Bot className="w-3 h-3" /> AI Conclusion
                      </div>
                      <div className="text-sm prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{aiInsight}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <HeartPulse className="w-3 h-3 text-primary" /> Health Metrics
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
                      <div className="text-xs text-muted-foreground mb-1">Health Score</div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold">{segment.health_score}</span>
                        <span className="text-xs mb-1 text-muted-foreground">/100</span>
                      </div>
                      <Progress value={segment.health_score} className="h-1 mt-2" />
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
                      <div className="text-xs text-muted-foreground mb-1">Risk Score</div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold">{segment.risk_score}</span>
                        <span className="text-xs mb-1 text-muted-foreground">/100</span>
                      </div>
                      <Progress value={segment.risk_score} className="h-1 mt-2 [&>div]:bg-[var(--critical)]" />
                    </div>
                  </div>
                </section>

                <section>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <Wrench className="w-3 h-3 text-primary" /> Route Impact & Affected Trains
                  </div>
                  {predictions.length > 0 ? (
                    <div className="space-y-3">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-semibold text-primary">Latest Prediction</div>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">{new Date(predictions[0].created_at).toLocaleDateString()}</Badge>
                        </div>
                        <p className="text-sm">{predictions[0].predicted_failure}</p>
                        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Est. Repair Time: <span className="text-foreground font-mono">{predictions[0].repair_time} hrs</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center p-4 border border-dashed rounded-lg">
                      No predictions available. Click Predict to generate.
                    </div>
                  )}
                </section>
                
                <section>
                   <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3 text-primary" /> Segment Status
                  </div>
                  <Badge variant="outline" className="uppercase tracking-wider text-xs" style={{ borderColor: sevColor(segment.status), color: sevColor(segment.status) }}>
                    {segment.status}
                  </Badge>
                </section>
              </>
            ) : segment && activeTab === 'history' ? (
               <section>
                 <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Inspection & Repair Timeline</div>
                 <div className="space-y-4 pl-2 border-l border-border/60 ml-2">
                   {inspections.length > 0 ? inspections.map((insp: any) => (
                     <div key={insp.id} className="relative pl-4">
                       <div className="absolute w-2 h-2 rounded-full bg-primary -left-[5px] top-1.5" />
                       <div className="text-xs text-muted-foreground font-mono">{new Date(insp.inspection_date).toLocaleString()}</div>
                       <div className="text-sm mt-1">{insp.findings || "Routine inspection - No major issues."}</div>
                       <Badge variant="outline" className="mt-1 text-[9px]">Score: {insp.health_score}</Badge>
                     </div>
                   )) : (
                     <div className="text-xs text-muted-foreground pl-4">No inspection history found.</div>
                   )}
                 </div>
               </section>
            ) : segment && activeTab === 'alerts' ? (
              <section>
                 <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Active & Historical Alerts</div>
                 <div className="space-y-3">
                   {alerts.length > 0 ? alerts.map((alert: any) => (
                     <div key={alert.id} className="bg-muted/30 border border-border/40 p-3 rounded-lg flex gap-3 items-start">
                        <ShieldAlert className="w-4 h-4 text-[var(--critical)] mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium">{alert.alert_type}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{new Date(alert.created_at).toLocaleString()}</div>
                          <Badge variant="outline" className="mt-2 text-[9px] border-[var(--critical)] text-[var(--critical)]">{alert.severity}</Badge>
                        </div>
                     </div>
                   )) : (
                     <div className="text-xs text-muted-foreground text-center p-4 border border-dashed rounded-lg">
                       No alerts for this segment.
                     </div>
                   )}
                 </div>
              </section>
            ) : null}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
