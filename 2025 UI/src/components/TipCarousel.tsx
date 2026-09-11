import { useState } from "react";

export type Tab = "your room" | "rules" | "all devices";

interface TipCarouselProps {
  activeTab: Tab;
  isVisible: boolean;
  onClose: () => void;
}

interface Tip {
  id: number;
  title: string;
  content: string;
}

const tipsByTab: Record<Tab, Tip[]> = {
  "all devices": [
    {
      id: 1,
      title: "H1",
      content: "Check “Latest Activity” to confirm if the device is active and responsive."
    },
    {
      id: 2,
      title: "H2",
      content: "View which automations involve this device to understand its behavior."
    },
    {
      id: 3,
      title: "H3",
      content: "Run a quick test by interacting with the device and observing its response."
    },
    {
      id: 4,
      title: "H4",
      content: "Even if devices work individually, issues may come from how they communicate with each other."
    }
  ],
  "your room": [
    {
      id: 1,
      title: "H1",
      content: "Even if devices work individually, issues may come from how they communicate with each other."
    },
    {
      id: 2,
      title: "H2",
      content: "Each device shows its current status — making it easy to spot offline or unresponsive ones without digging through menus."
    },
    {
      id: 3,
      title: "H3",
      content: "Use the “Network” view to see how the selected device connects to and depends on others."
    },
    {
      id: 4,
      title: "H4",
      content: "When devices work separately but not together, check their automation links or network communication — that’s often where issues arise."
    }
  ],
  "rules": [
    {
      id: 1,
      title: "H1",
      content: "Even if devices work individually, issues may come from how they communicate with each other."
    },
    {
      id: 2,
      title: "H2",
      content: "Conditions are only checked after the trigger occurs. The trigger starts the automation — then conditions decide whether the actions should run."
    },
    {
      id: 3,
      title: "H3",
      content: "Ensure the rule has a valid trigger, conditions, and actions."
    },
    {
      id: 4,
      title: "H4",
      content: "Triggers use OR logic — only one needs to happen to start the rule. Conditions use AND logic — all must be true for the rule to continue, unless defined otherwise."
    }
  ]
};

function TipCarousel({ activeTab, isVisible, onClose }: TipCarouselProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  const tips = tipsByTab[activeTab];
  const currentTip = tips[currentTipIndex];
  
  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };
  
  const previousTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };
  
  const handleClose = () => {
    setCurrentTipIndex(0);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Tips for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Tip Content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
            {currentTip.title}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {currentTip.content}
          </p>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentTipIndex
                    ? "bg-blue-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={previousTip}
            className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentTipIndex + 1} of {tips.length}
          </span>
          
          <button
            onClick={nextTip}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default TipCarousel; 