import React, { useEffect, useState } from "react";
import DeviceCard from "../DeviceCard";
import { Clock } from "lucide-react";
import { TOKEN } from "../../config";

const ClockCard = () => {
  const [time, setTime] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const response = await fetch(
          `/api/states/input_datetime.experiment_clock`,
          {
            headers: {
              "Authorization": `Bearer ${TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch from Home Assistant");
        const data = await response.json();
        setTime(data.attributes.has_time ? data.state : "No time set");
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchTime();
    // Polls the time in the set interval. 1000 = every second, 60000 = every minute
    const interval = setInterval(fetchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="bg-red-500 text-white rounded-lg px-4 py-2">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-500 text-white rounded-lg px-4 py-2 flex items-center justify-center">
      <Clock className="mr-2" size={20} />
      <span className="font-medium">{time || "Loading..."}</span>
    </div>
  );
};

export default ClockCard;
