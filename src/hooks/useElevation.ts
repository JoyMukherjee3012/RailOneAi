import { useState, useEffect } from "react";

export function useElevation(lat?: number, lon?: number) {
  const [elevation, setElevation] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lon) return;
    
    let isMounted = true;
    setLoading(true);

    // Open-Meteo Elevation API endpoint
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.elevation && data.elevation.length > 0) {
          setElevation(data.elevation[0]);
        }
        if (isMounted) setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching elevation:", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [lat, lon]);

  return { elevation, loading };
}
