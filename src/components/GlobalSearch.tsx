import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Workflow, TrainFront, Loader2 } from "lucide-react";
import { getERStations, getERTrains } from "@/lib/railway-data";
import { Input } from "@/components/ui/input";

export function GlobalSearch({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const search = async () => {
      setLoading(true);
      try {
        const [stations, trains] = await Promise.all([
          getERStations(),
          getERTrains()
        ]);

        const q = query.toLowerCase();
        const matches: any[] = [];

        stations.forEach(s => {
          const name = s.properties.name?.toLowerCase() || '';
          const code = s.properties.code?.toLowerCase() || '';
          if (name.includes(q) || code.includes(q)) {
            matches.push({ id: s.properties.code, type: 'station', label: `${s.properties.name} (${s.properties.code})`, icon: MapPin });
          }
        });

        trains.forEach(t => {
          const name = t.properties.name?.toLowerCase() || '';
          const num = t.properties.number?.toLowerCase() || '';
          if (name.includes(q) || num.includes(q)) {
            matches.push({ id: t.properties.number, type: 'train', label: `${t.properties.number} - ${t.properties.name}`, icon: TrainFront });
          }
        });

        setResults(matches.slice(0, 8)); // Top 8 results
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
      setIsOpen(true);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="relative w-64 md:w-80" ref={ref}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          type="text" 
          placeholder="Search stations, routes, trains..." 
          className="pl-9 bg-background/50 border-border/60 focus-visible:ring-1"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (query) setIsOpen(true); }}
        />
        {loading && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border/60 rounded-md shadow-xl overflow-hidden z-50">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-muted/50 transition-colors"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                onSelect(r.id);
              }}
            >
              <r.icon className="w-4 h-4 text-primary" />
              <span className="truncate">{r.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {isOpen && query && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border/60 rounded-md shadow-xl p-4 text-center text-sm text-muted-foreground z-50">
          No results found.
        </div>
      )}
    </div>
  );
}
