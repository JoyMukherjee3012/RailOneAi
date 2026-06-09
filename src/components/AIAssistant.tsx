import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getERTrains, getERStations, getTrackDefects, getIncidents, getStationHealth } from "@/lib/railway-data";
import { askGemini } from "@/lib/gemini";
import ReactMarkdown from "react-markdown";

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user'|'ai', text: string }[]>([
    { role: 'ai', text: 'Hello, I am the ER Operations Intelligence Assistant. How can I help you analyze the Eastern Railway network today?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const [trains, stations, defects, incidents] = await Promise.all([
        getERTrains(),
        getERStations(),
        getTrackDefects(),
        getIncidents()
      ]);

      const activeAlerts = incidents.map(i => ({ type: i.incident_type, severity: i.severity, description: i.description }));
      const trackHealth = trains.map(t => {
        const h = getStationHealth(t.properties.number);
        return { routeId: t.properties.number, score: h.score, status: h.status };
      });
      const criticalRoutes = trackHealth.filter(th => th.score < 40);

      const contextData = JSON.stringify({
        networkSummary: {
          totalStations: stations.length,
          totalTrains: trains.length,
          activeDefects: defects.length,
          activeIncidents: incidents.length
        },
        criticalRoutes: criticalRoutes,
        trackHealth: trackHealth,
        activeAlerts: activeAlerts,
        activeTrains: trains.map(t => ({ trainNumber: t.properties.number, name: t.properties.name, route: `${t.properties.from_station_name} to ${t.properties.to_station_name}` })),
      }, null, 2);

      const responseText = await askGemini(userMsg, contextData);
      setMessages(prev => [...prev, { role: 'ai', text: responseText }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${e.message}` }]);
    }
    
    setLoading(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-h-[600px] z-50 flex flex-col"
          >
            <Card className="glass border-border/60 flex-1 flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl bg-background/80 h-[500px]">
              <div className="p-4 border-b border-border/60 flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 text-primary">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">RailOneAI: ER</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Operations Intelligence</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border/50 text-foreground'}`}>
                      {msg.role === 'ai' ? (
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted/50 border border-border/50 rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Analyzing network data...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-border/60 bg-background/40">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about critical tracks, risks, or predictions..."
                    className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 text-sm focus:outline-none focus:border-primary"
                  />
                  <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl z-50 p-0"
        style={{ background: "var(--gradient-primary)" }}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
      </Button>
    </>
  );
}
