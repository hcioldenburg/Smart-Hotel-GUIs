import React from "react";

type DeviceCardProps = {
  name?: string;
  status?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

const DeviceCard = ({ name, status, icon, children }: DeviceCardProps) => {
  return (
    <div className="bg-gray-500 dark:bg-gray-500 text-white dark:text-white shadow-md rounded-xl p-6 w-full max-w-sm flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-xl font-semibold">{name}</h2>
      </div>
      {status && <p>{status}</p>}
      {children}
    </div>
  );
};

export default DeviceCard;
