import React from "react";

interface ForecastDay {
  datetime: string;
  temperature: number;
  condition: string;
}

interface WeatherForecastCardProps {
  forecast: ForecastDay[];
}

const WeatherForecastCard: React.FC<WeatherForecastCardProps> = ({ forecast }) => {
  return (
    <div className="bg-zinc-800 p-4 rounded-xl shadow">
      <h3 className="text-xl font-semibold mb-2">Weather Forecast</h3>
      <ul className="space-y-1">
        {forecast.slice(0, 5).map((day) => (
          <li key={day.datetime} className="flex justify-between text-sm">
            <span>{day.datetime}</span>
            <span>{day.temperature}°C - {day.condition}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WeatherForecastCard;
