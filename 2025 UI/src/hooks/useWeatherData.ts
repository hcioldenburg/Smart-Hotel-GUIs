import { useEffect, useState } from "react";
import { TOKEN } from "../config";

const ENTITY_ID = "weather.forecast_home";

type WeatherData = {
  temperature: number | null;
  condition: string | null;
}

export const useWeatherData = () => {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: null,
    condition: null,
  })
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/states/${ENTITY_ID}`, {
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch weather data");
        return res.json();
      })
      .then((data) => {
        const attributes = data.attributes || {};
        setWeather({
          temperature: attributes.temperature ?? null,
          condition:data.state ?? null,
        })
        setLoading(false);
      })
      .catch((err) => {
        console.error("Weather API error:", err);
        setError(err);
        setLoading(false);
      });
  }, []);

  return { weather, loading, error };
};
