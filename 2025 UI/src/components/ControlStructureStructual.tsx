import React, { useState } from "react";
import DeviceCard from "./DeviceCard";
import { Lightbulb, LightbulbOff } from "lucide-react";

interface ControlStructureStructuralProps {
  status?: string;
  selectedCategory: string [];
  setSelectedCategory: (category: string []) => void;
  displayConnections: boolean;
  setDisplayConnections: (val: boolean) => void;
  displayDependencies: boolean;
  setDisplayDependencies: (val: boolean) => void;
  onToggle?: () => void;
  label?: string;
  className?: string;
}

const ControlStructureStructural: React.FC<ControlStructureStructuralProps> = ({ status, onToggle, selectedCategory, setSelectedCategory, displayConnections, setDisplayConnections, displayDependencies, setDisplayDependencies, label, className }) => {
  const isOn = status === "on";

  const icon = isOn ? (
    <Lightbulb className="text-yellow-400" size={32} />
  ) : (
    <LightbulbOff className="text-gray-400" size={32} />
  );

  const toggleCategory = (category: string) => {
  if (selectedCategory.includes(category)) {
    setSelectedCategory(selectedCategory.filter(c => c !== category));
  } else {
    setSelectedCategory([...selectedCategory, category]);
  }
};
  
  // Remove local state, use props instead

  return (
    <div className={className}>

      <div className="mt-4 space-y-2">
        <button 
          className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-400 font-semibold" 
          onClick={() => {
            setSelectedCategory([]);
            setDisplayConnections(false);
            setDisplayDependencies(false);
          }}
        >
          Reset All
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <button 
          className={`w-full py-2 rounded ${selectedCategory.includes("lighting") ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}
          onClick={() => toggleCategory("lighting")}
        >
          Lighting
        </button>
        <button 
          className={`w-full py-2 rounded ${selectedCategory.includes("climate") ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}
          onClick={() => toggleCategory("climate")}
        >
          Appliances
        </button>
        <button 
          className={`w-full py-2 rounded ${selectedCategory.includes("media") ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}
          onClick={() => toggleCategory("media")}
        >
          Media
        </button>
        <button 
          className={`w-full py-2 rounded ${selectedCategory.includes("sensors") ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}
          onClick={() => toggleCategory("sensors")}
        >
          Sensors
        </button>
      </div>

      
      <div className="mt-4 space-y-2">
        <button 
          className={`w-full py-2 rounded ${displayDependencies ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}
          onClick={() => setDisplayDependencies(!displayDependencies)}
        >
          Display Dependencies
        </button>
        <button 
          className={`w-full py-2 rounded ${displayConnections ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white hover:bg-gray-400'}`}
          onClick={() => setDisplayConnections(!displayConnections)}
        >
          Display Connections
        </button>
      </div>
    </div>
  );
};

export default ControlStructureStructural;
