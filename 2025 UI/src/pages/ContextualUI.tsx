import { useState } from "react";
import AllDevicesCard from "../components/devices/AllDevicesCard";
import AutomationCard from "../components/devices/AutomationCard";
import NetworkGraph from "../components/NetworkGraph";
import YourRoomCards from "../components/YourRoomCards";
import FlourishConnections from "../components/FlourishConnections";
import FlourishDependencies from "../components/FlourishDependencies";
import ClockCard from "../components/devices/ClockCard";
import RecordActivity from "../components/RecordActivity";
import TipCarousel from "../components/TipCarousel";
import { RECORDER_PASSWORD } from "../config";

export type Tab = "your room" | "rules" | "all devices";

function ContextualUI() {
    const [activeTab, setActiveTab] = useState<Tab>("your room");
    const [roomTab, setRoomTab] = useState<"network" | "devices">("devices");
    const [networkTab, setNetworkTab] = useState<"Connections" | "Dependencies">("Connections");
    const [showNetworkTooltip, setShowNetworkTooltip] = useState(false);
    
    // Recorder state
    const [isAuthorized, setIsAuthorized] = useState(true);
    
    // Tip carousel states
    const [showTipCarousel, setShowTipCarousel] = useState(false);



    // Tooltip component
    const NetworkTooltip = () => (
      <span className="relative inline-block ml-1">
        <span 
          className="cursor-pointer hover:bg-gray-600 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-bold bg-gray-400 text-white shadow-md border border-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            setShowNetworkTooltip(!showNetworkTooltip);
          }}
        >
          i
        </span>
        {showNetworkTooltip && (
          <div className="absolute z-20 bg-gray-800 text-white p-2 rounded shadow-lg text-xs max-w-md w-72 top-full -left-25 mt-1">
            This graph depicts your ecosystem. The 'connections' graph shows how devices are grouped and connected to the hub. The 'dependencies' graph depicts how devices depend on each other, according to rules and automations in place.
          </div>
        )}
      </span>
    );

    return (
        <div className="w-screen min-h-screen transition-colors duration-300 bg-stone-50 text-black">
            <div className="max-w-7xl mx-auto px-4 py-10">
                <h1 className="text-4xl font-bold text-center mb-10">
                    Smart Hotel
                </h1>

                {/* Recorder Component */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <RecordActivity />
                  
                  {/* Help Button */}
                  <button
                    onClick={() => setShowTipCarousel(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    title="Click for helpful tips"
                  >
                    💡 Tips
                  </button>
                </div>

                {/* Tip Carousel */}
                <TipCarousel
                  activeTab={activeTab}
                  isVisible={showTipCarousel}
                  onClose={() => setShowTipCarousel(false)}
                />

                {/* Tabs and ClockCard Row */}
                <div className="max-w-7xl mx-auto mb-4">
                  <div className="border-2 border-gray-400 rounded-lg p-2 relative">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Tabs Container */}
                      <div className="col-span-2">
                        <div className="grid grid-cols-3 gap-6">
                          {(["all devices", "your room", "rules"] as Tab[]).map((tab, index) => (
                            <div key={tab} className="relative">
                              <button
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded capitalize w-full ${
                                  activeTab === tab
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-500 text-white"
                                }`}>
                                {tab}
                              </button>
                            </div>
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

                {activeTab === "your room" && (
          <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex space-x-2 mb-4">
            <button
                className={`px-3 py-1 rounded ${roomTab === "devices" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}
                onClick={() => setRoomTab("devices")}
              >
                Devices
              </button>

              <button
                className={`px-3 py-1 rounded ${roomTab === "network" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}
                onClick={() => setRoomTab("network")}
              >
                Network
                <NetworkTooltip />
              </button>
              
            </div>
            {/* Sub-tab content */}
            {roomTab === "network" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold mb-4">Device Network</h2>
                
                {/* Network sub-tabs */}
                <div className="flex space-x-2 mb-4">
                  <button
                    className={`px-3 py-1 rounded ${networkTab === "Connections" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}
                    onClick={() => setNetworkTab("Connections")}
                  >
                    Connections
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${networkTab === "Dependencies" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}
                    onClick={() => setNetworkTab("Dependencies")}
                  >
                    Dependencies
                  </button>
                </div>
                
                {/* Network sub-tab content */}
                {networkTab === "Connections" && (
                  <div className="space-y-4">
                    <FlourishConnections />
                  </div>
                )}
                {networkTab === "Dependencies" && (
                  <div className="space-y-4">
                    <FlourishDependencies />
                  </div>
                )}
              </div>
            )}
            {roomTab === "devices" && (
              <div className="space-y-4">
                <YourRoomCards showTooltips={true} />
              </div>
            )}
          </div>
        )}


                {/* All Devices Content */}
                {activeTab === "all devices" && (
                    <div className="grid grid-cols-1 gap-6">
                        <AllDevicesCard showTooltips={true} setActiveTab={setActiveTab} />
                    </div>
                )}

                {/* Rules Content */}
                {activeTab === "rules" && (
                    <div className="text-center mt-10 text-lg text-gray-300">
                        <AutomationCard showTooltips={true} />
                    </div>
                )}


            </div>
        </div>
    );
}

export default ContextualUI;