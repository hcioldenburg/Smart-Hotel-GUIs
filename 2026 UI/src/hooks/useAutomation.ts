import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { TOKEN } from "../config";
import { fetchAutomationsViaWS } from "./useDevices";

// API Call for all the existing automations

export const useAutomationsEXP = () => {
  const [automationsEXP, setAutomationsEXP] = useState<any[]>([]);
  const [loadingEXP, setLoadingEXP] = useState(true);
  const [errorEXP, setErrorEXP] = useState<any>(null);

  const fetchAutomations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingEXP(true);
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

      setAutomationsEXP(automationEntities);
      setErrorEXP(null);
    } catch (err) {
      setErrorEXP(err);
    } finally {
      setLoadingEXP(false);
    }
  }, []);

  // Poll so enabled/disabled status and last_triggered stay current during a
  // session (without re-showing the loading state on each refresh).
  useEffect(() => {
    fetchAutomations(true);
    const id = setInterval(() => fetchAutomations(false), 5000);
    return () => clearInterval(id);
  }, [fetchAutomations]);

  return { automationsEXP, loadingEXP, errorEXP, refetchEXP: fetchAutomations };
};

export const useAutomationsPS = () => {
  const [automationsPS, setAutomationsPS] = useState<any[]>([]);
  const [loadingPS, setLoadingPS] = useState(true);
  const [errorPS, setErrorPS] = useState<any>(null);

  const fetchAutomations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingPS(true);
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

      setAutomationsPS(automationEntities);
      setErrorPS(null);
    } catch (err) {
      setErrorPS(err);
    } finally {
      setLoadingPS(false);
    }
  }, []);

  // Poll so a physical press shows up as a fresh last_triggered during a session.
  useEffect(() => {
    fetchAutomations(true);
    const id = setInterval(() => fetchAutomations(false), 5000);
    return () => clearInterval(id);
  }, [fetchAutomations]);

  return { automationsPS, loadingPS, errorPS, refetchPS: fetchAutomations };
};

/**
 * last_triggered per ps_* automation, keyed by entity_id.
 *
 * The device feed (useDevices) drops every `automation.*` entity, so a physical
 * switch's last press is NOT reachable through useDeviceState — it can only be
 * read here.
 */
export const usePsTriggers = (): Record<string, string | undefined> => {
  const { automationsPS } = useAutomationsPS();
  return useMemo(
    () => Object.fromEntries(
      automationsPS.map((a: any) => [a.entity_id, a.attributes?.last_triggered as string | undefined]),
    ),
    [automationsPS],
  );
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
