import { useState } from "react";
import AllDevicesCard from "../components/devices/AllDevicesCard";
import AutomationCard from "../components/devices/AutomationCard";
import ClockCard from "../components/devices/ClockCard";
import { FloorMap } from "../components/FloormapKonva";
import ControlStructureStructural from "../components/ControlStructureStructual";
import RecordActivity from "../components/RecordActivity";
import { RECORDER_PASSWORD } from "../config";

type Tab = "your room" | "rules" | "all devices";
type Category = "lighting" | "climate" | "media" | "sensors" | null;

function StructualUI() {
  const [activeTab, setActiveTab] = useState<Tab>("your room");
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [displayConnections, setDisplayConnections] = useState(false);
  const [displayDependencies, setDisplayDependencies] = useState(false);
  
  // Recorder state
  const [isAuthorized, setIsAuthorized] = useState(true);





  return (
    <div className="w-screen min-h-screen transition-colors duration-300 bg-stone-50 text-black">
      <div className="max-w-7xl mx-auto px-4 py-10 relative">
        {/* Activity Recorder - Upper Right Corner */}
        <div className="absolute top-4 right-4 z-10">
          <RecordActivity />
        </div>

        <h1 className="text-4xl font-bold text-center mb-10">
          Smart Hotel
        </h1>

        {/* Tabs and ClockCard Row */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="border-2 border-gray-400 rounded-lg p-2 relative">
            <div className="grid grid-cols-3 gap-6">
              {/* Tabs Container */}
              <div className="col-span-2">
                <div className="grid grid-cols-3 gap-6">
                  {(["all devices", "your room", "rules"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded capitalize w-full ${
                        activeTab === tab ? "bg-blue-500 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {/* ClockCard */}
              <div className="col-span-1">
                <ClockCard />
              </div>
            </div>
          </div>
        </div>

        {/* Your Room Content */}
        {activeTab === "your room" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 pt-16">
              <ControlStructureStructural
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                displayConnections={displayConnections}
                setDisplayConnections={setDisplayConnections}
                displayDependencies={displayDependencies}
                setDisplayDependencies={setDisplayDependencies}
              />
            </div>
            <div className="space-y-4">
              <FloorMap 
                selectedCategory={selectedCategory}
                displayConnections={displayConnections} 
                displayDependencies={displayDependencies} 
              />
            </div>
          </div>
        )}

        {/* All Devices Content */}
        {activeTab === "all devices" && (
          <div className="grid grid-cols-1 gap-6">
            <AllDevicesCard />
          </div>
        )}

        {/* Rules Content */}
        {activeTab === "rules" && (
          <div className="text-center mt-10 text-lg text-gray-300">
            <AutomationCard />
          </div>
        )}
      </div>
    </div>
  );
}

export default StructualUI;
