import React from "react";
import DeviceCard from "../DeviceCard";
import { Calendar } from "lucide-react";

const CalendarCard = () => {
  const event = { title: "Team Sync", time: "4:00 PM" };
  return (
    <DeviceCard name="Calendar" status={`Next: ${event.title} at ${event.time}`} icon={<Calendar />}>
      <button className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-400">View Calendar</button>
    </DeviceCard>
  );
};

export default CalendarCard;
