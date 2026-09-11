import React, { useEffect, useState } from "react";
import { mapSimpleToHAAutomation } from "./AutomationMapper";
import { sendAutomationToHA } from "../hooks/sendNewAutomationToHomeAssistant";

interface Device {
  id: string;
  name?: string;
  friendly_name?: string;
}

interface Automation {
  triggerDevice: string;
  triggerEvent: string;
  actionDevice: string;
  actionCommand: string;
}

interface Props {
  devices: Device[];
  onSave: (automation: Automation) => void;
  onCancel?: () => void;
  initialAutomation?: Automation | null;
}


const triggerEvents = ["turned on", "turned off", "temperature above 25°C", "button pressed"];
const actionCommands = ["turn on", "turn off", "set brightness to 50%", "set temperature to 22°C"];

const AutomationEditor: React.FC<Props> = ({ devices, onSave, onCancel, initialAutomation }) => {
  const [triggerDevice, setTriggerDevice] = useState(initialAutomation?.triggerDevice || "");
  const [triggerEvent, setTriggerEvent] = useState(initialAutomation?.triggerEvent || "");
  const [actionDevice, setActionDevice] = useState(initialAutomation?.actionDevice || "");
  const [actionCommand, setActionCommand] = useState(initialAutomation?.actionCommand || "");

  const mappedDevices: Device[] = devices
  .filter(Boolean)
  .map((d: any) => ({
    id: d.entity_id || d.id,
    name: d.name || d.attributes?.friendly_name || d.entity_id || d.id,
    friendly_name: d.attributes?.friendly_name,
  }));

  useEffect(() => {
  if (initialAutomation) {
    setTriggerDevice(initialAutomation.triggerDevice);
    setTriggerEvent(initialAutomation.triggerEvent);
    setActionDevice(initialAutomation.actionDevice);
    setActionCommand(initialAutomation.actionCommand);
  } else {
    setTriggerDevice("");
    setTriggerEvent("");
    setActionDevice("");
    setActionCommand("");
  }
}, [JSON.stringify(initialAutomation)]);
console.log("Loading automation into editor:", initialAutomation);
console.log("Available mapped devices:", mappedDevices);



  const handleSaveClick = async () => {
    const automation: Automation = {
      triggerDevice,
      triggerEvent,
      actionDevice,
      actionCommand,
    };

    try {
      const haAutomation = mapSimpleToHAAutomation(automation);
      await sendAutomationToHA(haAutomation);
      alert("Rule saved successfully!");
      onSave(automation);
    } catch (err: any) {
      alert(`Failed to save rule: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 bg-gray-500 p-4 rounded border border-zinc-700">
      <h4 className="text-xl font-semibold mb-2">
        {initialAutomation ? "Edit Rule" : "New Rule"}
      </h4>

      

      <label>
        When
        <select
          value={triggerDevice}
          onChange={e => setTriggerDevice(e.target.value)}
          className="ml-2 p-1 bg-zinc-800 border border-zinc-600 rounded"
        >
          <option value="">Select trigger device</option>
          {mappedDevices.map(d => (
            <option key={d.id} value={d.id}>{d.friendly_name || d.name || d.id}</option>
          ))}
        </select>
      </label>

      <label>
        Does
        <select
          value={triggerEvent}
          onChange={e => setTriggerEvent(e.target.value)}
          className="ml-2 p-1 bg-zinc-800 border border-zinc-600 rounded"
        >
          <option value="">Select event</option>
          {triggerEvents.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </label>

      <label>
        Then
        <select
          value={actionDevice}
          onChange={e => setActionDevice(e.target.value)}
          className="ml-2 p-1 bg-zinc-800 border border-zinc-600 rounded"
        >
          <option value="">Select action device</option>
          {mappedDevices.map(d => (
            <option key={d.id} value={d.id}>{d.friendly_name || d.name || d.id}</option>
          ))}
        </select>
      </label>

      <label>
        Should do
        <select
          value={actionCommand}
          onChange={e => setActionCommand(e.target.value)}
          className="ml-2 p-1 bg-zinc-800 border border-zinc-600 rounded"
        >
          <option value="">Select action</option>
          {actionCommands.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <button
        disabled={!triggerDevice || !triggerEvent || !actionDevice || !actionCommand}
        onClick={handleSaveClick}
        className="mt-2 px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded disabled:bg-zinc-600"
      >
        Save Rule
      </button>

      {onCancel && (
  <button
    onClick={onCancel}
    className="mt-2 ml-2 px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded"
  >
    Cancel
  </button>
)}

    </div>
  );
};

export default AutomationEditor;
