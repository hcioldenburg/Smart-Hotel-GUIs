import { useEffect, useState, useRef, useCallback } from "react";
import { TOKEN } from "../config";
import { fetchAutomationsViaWS } from "./useDevices";

// API Call for all the existing automations

export const useAutomationsEXP = () => {
  const [automationsEXP, setAutomationsEXP] = useState<any[]>([]);
  const [loadingEXP, setLoadingEXP] = useState(true);
  const [errorEXP, setErrorEXP] = useState<any>(null);

  const fetchAutomations = useCallback(async () => {
    setLoadingEXP(true);
    try {
      const res = await fetch(`/api/states`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch rules");

      const data = await res.json();
      
      const automationEntities = data.filter((entity: any) => {
        const matches = /^(automation\.exp)/.test(entity.entity_id);
        return matches;
      });
      
      console.log("Filtered EXP automations:", automationEntities.map((e: any) => e.entity_id));

      setAutomationsEXP(automationEntities);
      setErrorEXP(null);
    } catch (err) {
      setErrorEXP(err);
    } finally {
      setLoadingEXP(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  return { automationsEXP, loadingEXP, errorEXP, refetchEXP: fetchAutomations };
};

export const useAutomationsPS = () => {
  const [automationsPS, setAutomationsPS] = useState<any[]>([]);
  const [loadingPS, setLoadingPS] = useState(true);
  const [errorPS, setErrorPS] = useState<any>(null);

  const fetchAutomations = useCallback(async () => {
    setLoadingPS(true);
    try {
      const res = await fetch(`/api/states`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch rules");

      const data = await res.json();
      
      const automationEntities = data.filter((entity: any) => {
        const matches = /^(automation\.ps)/.test(entity.entity_id);
        return matches;
      });
      
      console.log("Filtered PS automations:", automationEntities.map((e: any) => e.entity_id));

      setAutomationsPS(automationEntities);
      setErrorPS(null);
    } catch (err) {
      setErrorPS(err);
    } finally {
      setLoadingPS(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  return { automationsPS, loadingPS, errorPS, refetchPS: fetchAutomations };
};

// API Call for the logbook entries of the automations

export const useLogbook = (
  entityIds: string | string[],
  intervalMs = 2000 // poll every 2 seconds
) => {
  const [logbook, setLogbook] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogbook = async () => {
    try {
      const now = new Date();
      const start = new Date(now.setMonth(now.getMonth() - 6)).toISOString(); //recorded activity in the last 6 months
      const end = new Date().toISOString();

      const entityList = Array.isArray(entityIds) ? entityIds : [entityIds];
      const params = new URLSearchParams({ start_time: start, end_time: end });
      entityList.forEach(id => params.append("entity", id));

      const res = await fetch(`/api/logbook?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch logbook");
      const data = await res.json();

      // Sort by descending by time and keep only latest entry for each automation
      const latestPerEntity = entityList.map(entity => {
        return [...data]
          .filter(e => e.entity_id === entity)
          .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())[0];
      }).filter(Boolean); // remove undefined entries

      setLogbook(latestPerEntity);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogbook();
    intervalRef.current = setInterval(fetchLogbook, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [JSON.stringify(entityIds)]);

  useEffect(() => {
    setLogbook([]); // clear entry logs when fetching new entry logs
  }, [JSON.stringify(entityIds)]);


  return { logbook, loading, error };
};

// Fetches full automation configs from Home Assistant via WebSocket
export const useAutomationConfigs = () => {
  const [automationConfigs, setAutomationConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      try {
        const configs = await fetchAutomationsViaWS();
        setAutomationConfigs(configs);
        setError(null);
        console.log("Received automation configs via WebSocket:", configs);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  return { automationConfigs, loading, error };
};
