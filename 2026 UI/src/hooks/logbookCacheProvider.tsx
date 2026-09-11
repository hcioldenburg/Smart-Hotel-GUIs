import React, { createContext, useContext, useEffect, useState } from "react";
import { TOKEN } from "../config";

// List all device entity IDs you want to track
const allEntityIds = [
  "light.bedlight_r",
  "light.bedlight_l",
  "light.windowlight",
  "light.doorlight",
  "media_player.tv",
  "cover.blinds",
  "fan.smartfan",
  "light.standlight",
  // Add more as needed
];

type LogbookCache = Record<string, any[]>;

const LogbookCacheContext = createContext<LogbookCache>({});

export const LogbookCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logbookCache, setLogbookCache] = useState<LogbookCache>({});

  useEffect(() => {
    async function fetchInitialLogbooks() {
      const now = new Date();
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // last 24 hours
      const entityParams = allEntityIds.map(id => `entity=${encodeURIComponent(id)}`).join("&");
      const url = `/api/logbook?start_time=${start.toISOString()}&end_time=${now.toISOString()}&${entityParams}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Group by entity_id
        const grouped: LogbookCache = {};
        data.forEach((entry: any) => {
          if (!entry.entity_id) return;
          if (!grouped[entry.entity_id]) grouped[entry.entity_id] = [];
          grouped[entry.entity_id].push(entry);
        });
        setLogbookCache(grouped);
      }
    }
    fetchInitialLogbooks();
  }, []);

  // Optionally: Listen for real-time updates and update cache here

  return (
    <LogbookCacheContext.Provider value={logbookCache}>
      {children}
    </LogbookCacheContext.Provider>
  );
};

// Custom hook to use the logbook cache
export function useLogbookCache(entityId: string): any[] {
  const cache = useContext(LogbookCacheContext);
  return cache[entityId] || [];
}