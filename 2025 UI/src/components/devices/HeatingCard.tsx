import React from "react";
import DeviceCard from "../DeviceCard";
import { Thermometer } from "lucide-react";
import ThermostatOutlinedIcon from '@mui/icons-material/ThermostatOutlined';

interface HeatingCardProps {
  temp: number;
  setTemp: (value: number) => void;
  label?: string;
}

const HeatingCard: React.FC<HeatingCardProps> = ({ temp, setTemp, label }) => (

    <DeviceCard
    name={label || "Heating"}
    status={`Current setting: ${temp}°C`}
    icon={<ThermostatOutlinedIcon />}
  >
     <div className="flex items-center gap-3">
      <button onClick={() => setTemp(temp - 1)} className="btn bg-gray-500 hover:bg-gray-400 text-white">-</button>
      <span>{temp}°C</span>
      <button onClick={() => setTemp(temp + 1)} className="btn bg-gray-500 hover:bg-gray-400 text-white">+</button>
    </div>
  </DeviceCard>
);

export default HeatingCard;