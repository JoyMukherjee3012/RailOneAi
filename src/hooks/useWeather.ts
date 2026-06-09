import { useState, useEffect } from "react";

export function useWeather(lat?: number, lon?: number) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lon) return;
    
    let isMounted = true;
    setLoading(true);

    // Open-Meteo API endpoint
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Error fetching weather:", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [lat, lon]);

  return { weather, loading };
}
