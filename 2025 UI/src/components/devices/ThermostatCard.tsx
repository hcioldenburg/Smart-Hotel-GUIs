import React from "react";
import DeviceCard from "../DeviceCard";
import { Thermometer } from "lucide-react";

interface ThermostatCardProps {
  temp: number;
  setTemp?: (value: number) => void;
  label?: string;
  condition?: string; // weather condition, e.g. "sunny", "cloudy"
  weatherMode?: boolean; // toggle weather display mode
}

const ThermostatCard: React.FC<ThermostatCardProps> = ({
  temp,
  setTemp,
  label,
  condition,
  weatherMode = false,
}) => (
  <DeviceCard
    name={label || (weatherMode ? "Weather" : "Thermostat")}
    status={
      weatherMode
        ? `${temp}°C – ${condition || "Unknown"}`
        : `${temp}°C`
    }
    icon={<Thermometer />}
  >
    {!weatherMode && setTemp && (
      <div className="flex items-center gap-3">
        <button onClick={() => setTemp(temp - 1)} className="btn bg-green-600 hover:bg-green-500 text-white">-</button>
        <span>{temp}°C</span>
        <button onClick={() => setTemp(temp + 1)} className="btn bg-green-600 hover:bg-green-500 text-white">+</button>
      </div>
    )}
  </DeviceCard>
);

export default ThermostatCard;
