import React from "react";
import DeviceCard from "../DeviceCard";
import { Lightbulb, LightbulbOff } from "lucide-react";

interface LightCardProps {
  status: string;
  onToggle: () => void;
  label?: string;
  className?: string;
  brightness?: number; // 0-100
  onBrightnessChange?: (value: number) => void;
  color?: string; // hex color
  onColorChange?: (value: string) => void;
}

const LightCard: React.FC<LightCardProps> = ({ status, onToggle, label, className, brightness, onBrightnessChange, color, onColorChange }) => {
  const isOn = status === "on";

  const icon = isOn ? (
    <div className="w-8 h-8 flex-shrink-0">
      <Lightbulb className="text-yellow-400" size={32} />
    </div>
  ) : (
    <div className="w-8 h-8 flex-shrink-0">
    <LightbulbOff className="text-gray-400" size={32} />
  </div>
  );

  return (
    <div className={className}>
    <DeviceCard name={label ?? "Light"} status={status} icon={icon}>
      <button
        onClick={onToggle}
        className={`px-4 py-2 rounded font-semibold transition text-white ${
          isOn
            ? 'bg-red-600 hover:bg-red-500'
            : 'bg-green-600 hover:bg-green-500'
        }`}
      >
        Turn {isOn ? "Off" : "On"}
      </button>
      {/* Brightness slider */}
      {typeof brightness === 'number' && onBrightnessChange && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Brightness: {brightness}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={brightness}
            onChange={e => onBrightnessChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}
      {/* Color picker */}
      {typeof color === 'string' && onColorChange && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Color:</label>
          <input
            type="color"
            value={color}
            onChange={e => onColorChange(e.target.value)}
            className="w-10 h-10 p-0 border-0 bg-transparent"
            style={{ verticalAlign: 'middle' }}
          />
        </div>
      )}
    </DeviceCard>
    </div>
  );
};

export default LightCard;
