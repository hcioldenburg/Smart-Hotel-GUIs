import React from "react";
import DeviceCard from "../DeviceCard";
import { Blinds } from "lucide-react";
import BlindsOutlinedIcon from '@mui/icons-material/BlindsOutlined';

interface CurtainCardProps {
  percentage: number;
  setPercentage: (value: number) => void;
  label?: string;
}

const CurtainCard: React.FC<CurtainCardProps> = ({ percentage, setPercentage, label }) => (
  <DeviceCard
    name={label || "Curtains"}
    status={`${percentage}% Open`}
    icon={<BlindsOutlinedIcon />}
  >
    <input
      type="range"
      min={0}
      max={100}
      value={percentage}
      onChange={(e) => setPercentage(Number(e.target.value))}
      className="w-full"
    />
  </DeviceCard>
);

export default CurtainCard;
