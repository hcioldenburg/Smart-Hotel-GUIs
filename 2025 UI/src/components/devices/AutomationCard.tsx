import React, { useState } from "react";
import { useAutomationsEXP, useAutomationsPS, useLogbook } from "../../hooks/useAutomation";
import AutomationEditor from "../AutomationEditor";
import { mapHAToSimpleAutomation, type Automation } from "../AutomationMapper";
import { useDevices } from "../../hooks/useDevices";
import arrow_down_automation from "../../images/arrow_down_automation.svg";

const AutomationLogbookEntry = ({ entityId }: { entityId: string }) => {
  const { logbook, loading, error } = useLogbook(entityId);

  if (loading) return <p className="text-zinc-400">Loading…</p>;
  if (error) return <p className="text-red-500">Error</p>;
  if (logbook.length === 0) return <p className="text-white">No recent activity</p>;

  const latest = logbook[logbook.length - 1];
  
  // Calculate relative time
  const now = new Date();
  const timeDiff = now.getTime() - new Date(latest.when).getTime();
  
  const formatRelativeTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
    }
  };
  
  return (
    <p className="text-green-400">
      Last triggered: {formatRelativeTime(timeDiff)}
    </p>
  );
};

const AutomationCard = ({ showTooltips = false }: { showTooltips?: boolean }) => {
  const { devices } = useDevices();

  // Tooltip component for headers
  const HeaderTooltip = ({ text, tooltipId }: { text: string; tooltipId: string }) => (
    <span className="relative inline-block ml-1">
      <span 
        className="cursor-pointer hover:bg-gray-600 rounded-full w-5 h-5 inline-flex items-center justify-center text-xs font-bold bg-gray-400 text-white shadow-md border border-gray-600"
        onClick={(e) => {
          e.stopPropagation();
          setActiveHeaderTooltip(activeHeaderTooltip === tooltipId ? null : tooltipId);
        }}
      >
        i
      </span>
      {showTooltips && activeHeaderTooltip === tooltipId && (
        <div className="absolute z-20 bg-gray-800 text-white p-2 rounded shadow-lg text-xs max-w-md w-72 top-full -left-25 mt-1">
          {text}
        </div>
      )}
    </span>
  );
  const { automationsEXP, loadingEXP, errorEXP, refetchEXP } = useAutomationsEXP();
  const { automationsPS, loadingPS, errorPS, refetchPS } = useAutomationsPS();
  const [showEditor, setShowEditor] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [showAutomationLabel, setShowAutomationLabel] = useState(false);
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [selectedAutomationElement, setSelectedAutomationElement] = useState<string | null>(null);
  const [activeHeaderTooltip, setActiveHeaderTooltip] = useState<string | null>(null);

  // Map entity_id to custom label text
  const automationLabels: Record<string, string> = {
    'automation.ps_toggle_bedlight_left': 'When the Bedlight Left Toggle (Button) is pressed, Bedlight L will turn on/off',
    'automation.ps_bedlight_right_toggle': 'When the Bedlight Right Toggle (Button) is pressed, Bedlight R will turn on/off',
    'automation.ps_doorlighttoggle': 'When the left side of the Wall Switch (Button) is pressed, Door Light will turn on/off',
    'automation.ps_roller_shutter_switch': 'When the Roller Shutter Control (Button) is pressed, Curtain will move open/close',
    'automation.ps_standlight_toggle': 'When Floor Lamp (Button) is pressed, Floor Lamp will turn on/off',
    'automation.ps_windowlighttoggle': 'When the right side of the Wall Switch (Button) is pressed, Window Light will turn on/off',

    'automation.exp_curtain_close_after_7pm': 'Every 30s, yet only if the window is closed and the time is between 7pm and 6am and the curtain is not closed, the curtain will be closed.',
    'automation.exp_fan_auto_on':  'When the door becomes closed, and only if the current temperature is >20°C, the Fan will be turned on.',
    'automation.exp_fan_auto_off': 'When the door becomes open, or the current temperature is <20°C, the Fan will be turned off.',
    'automation.exp_light_when_entering': 'When the Presence Sensor reports presence, and only if the door sensor is opened, the Door Light will be turned on.',
    'automation.exp_light_when_entering_night': 'Every day between 7pm and 6am, but only when the Presence Sensor reports presence and the door sensor is opened, the Floor Lamp will turn on.',
    'automation.exp_rollershutter_eveningclosing': 'Every day at 7:30pm, but only when the presence sensor reports presence, the Roller Shutter will be closed.',
    'automation.exp_shutter_when_window_is_open': 'When the Window Sensor is Open and the Presence Sensor reports presence, the Roller Shutter will be opened to 100%.',

  };

  // Map entity_id to structured automation data for the three boxes
  const automationBoxData: Record<string, { trigger: string | React.ReactNode; condition: string | React.ReactNode; action: string | React.ReactNode }> = {
    
    // PS automations
    'automation.ps_toggle_bedlight_left': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Bedlight Left Toggle (Button) </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">pressed </span>
        </>
      ),
      condition: '----',
      action: (
        <>
          <span className="font-bold text-blue-700">Toggle </span>
          <span className="font-bold text-black-900">Bedlight L </span>
        </>
      ),
    },
    'automation.ps_bedlight_right_toggle': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Bedlight Right Toggle (Button) </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">pressed </span>
        </>
      ),
      condition: '----',
      action: (
        <>
          <span className="font-bold text-blue-700">Toggle </span>
          <span className="font-bold text-black-900">Bedlight R </span>
        </>
      ),
    },
    'automation.ps_doorlighttoggle': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Left Side of Wall Switch (Button) </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">pressed </span>
        </>
      ),
      condition: '----',
      action: (
        <>
          <span className="font-bold text-blue-700">Toggle </span>
          <span className="font-bold text-black-900">Door Light </span>
        </>
      ),
    },
    'automation.ps_roller_shutter_switch': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Roller Shutter Control (Button) </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">pressed </span>
        </>
      ),
      condition: '----',
      action: (
        <>
          <span className="font-bold text-blue-700">Move </span>
          <span className="font-bold text-black-900">Curtain</span>
        </>
      ),
    },
    'automation.ps_standlight_toggle': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Floor Lamp (Button) </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">pressed </span>
        </>
      ),
      condition: '----',
      action: (
        <>
          <span className="font-bold text-blue-700">Toggle </span>
          <span className="font-bold text-black-900">Floor Lamp </span>
        </>
      ),
    },
    'automation.ps_windowlighttoggle': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Right Side of Wall Switch (Button) </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">pressed </span>
        </>
      ),
      condition: '----',
      action: (
        <>
          <span className="font-bold text-blue-700">Toggle </span>
          <span className="font-bold text-black-900">Window Light </span>
        </>
      ),
    },


     // Experimental automations
    'automation.exp_curtain_close_after_7pm': {
      trigger: (
        <>
          <span className="font-light text-black-900">Every </span>
          <span className="font-bold text-blue-700">30 seconds</span>
        </>
      ),
      condition: (
        <>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-black-900">Window </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700"> closed </span>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-red-800">Time </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">between 7pm and 6am </span>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-black-900">Curtain </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">not closed </span>
        </>
      ),
      action: (
        <>
          <span className="font-light text-black-900">Close </span>
          <span className="text-bold text-black-900">Curtain </span>
        </>
      )
    },
    'automation.exp_fan_auto_on': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Door Sensor </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">closed </span>
        </>
      ),
      condition: (
        <>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-red-800">Current Temperature </span>
          <span className="font-light text-black-900">of </span>
          <span className="font-bold text-black-900">Temp_Humid Sensor </span>
          <span className="font-light text-black-900">is </span>
           <span className="font-bold text-blue-700">&gt; 20°C</span> {/* &lt = lesser than, &gt = greater than */}
        </>
      ),
      action: (
        <>
          <span className="font-light text-black-900">Turn on the </span>
          <span className="font-bold text-black-900">Fan </span>
        </>
      )
    },
    'automation.exp_fan_auto_off': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Door Sensor </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">opened </span>
        </>
      ),
      condition: (
        <>
          <span className="font-light text-black-900">OR </span>
          <span className="font-bold text-red-800">Current Temperature </span>
          <span className="font-light text-black-900">of </span>
          <span className="font-bold text-black-900">Temp_Humid Sensor </span>
          <span className="font-light text-black-900">is </span>
           <span className="font-bold text-blue-700">&lt; 20°C</span> {/* &lt = lesser than, &gt = greater than */}
        </>
      ),
      action: (
        <>
          <span className="font-light text-black-900">Turn off the </span>
          <span className="font-bold text-black-900">Fan </span>
        </>
      )
    },
    'automation.exp_light_when_entering': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Presence Sensor </span>
          <span className="font-light text-black-900">reports "</span>
          <span className="font-bold text-blue-700">Presence</span>
          <span className="font-light text-black-900">"</span>
        </>
      ),
      condition: (
        <>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-black-900">Door Sensor </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">open </span>
        </>
      ),
      action: (
        <>
          <span className="font-light text-black-900">Turn on the </span>
          <span className="font-bold text-black-900">Door Light </span>
        </>
      )
    },
    'automation.exp_light_when_entering_night': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Door Sensor </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">opened </span>
        </>
      ),
      condition: (
        <>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-red-800">Time </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">between 7pm and 6am </span>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-black-900">Presence Sensor </span>
          <span className="font-light text-black-900">reports "</span>
          <span className="font-bold text-blue-700">Presence</span>
          <span className="font-light text-black-900">"</span>
        </>
      ),
      action: (
        <>
           <span className="font-light text-black-900">Turn on the </span>
           <span className="font-bold text-black-900">Floor Lamp</span>
        </>
      )
    },
    'automation.exp_rollershutter_eveningclosing': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-red-800">Time </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">07:30pm </span>
        </>
      ),
      condition: (
        <>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-black-900">Presence Sensor </span>
          <span className="font-light text-black-900">reports "</span>
          <span className="font-bold text-blue-700">Presence</span>
          <span className="font-light text-black-900">"</span>
        </>
      ),
      action: (
        <>
          <span className="font-bold text-blue-700">Close </span>
          <span className="font-bold text-black-900">Roller Shutter </span>
        </>
      )
    },
    'automation.exp_shutter_when_window_is_open': {
      trigger: (
        <>
          <span className="font-light text-black-900">WHEN </span>
          <span className="font-bold text-black-900">Window Sensor </span>
          <span className="font-light text-black-900">is </span>
          <span className="font-bold text-blue-700">opened </span>
        </>
      ),
      condition: (
        <>
          <span className="font-light text-black-900">AND </span>
          <span className="font-bold text-black-900">Presence Sensor </span>
          <span className="font-light text-black-900">reports "</span>
          <span className="font-bold text-blue-700">Presence</span>
          <span className="font-light text-black-900">"</span>
        </>
      ),
      action: (
        <>
          <span className="font-light text-black-900">Open </span>
          <span className="font-bold text-black-900">Roller Shutter </span>
          <span className="font-light text-black-900">to </span>
          <span className="font-bold text-blue-700">100%</span>
        </>
      )
    },
  };

  // Map entity_id to custom tooltip content for the description boxes
  const automationTooltips: Record<string, { trigger: string; condition: string; action: string }> = {
    
    // PS automations
    'automation.ps_toggle_bedlight_left': {
      trigger: 'This rule will be triggered when the button is pressed',
      condition: 'No conditions exist',
      action: 'The device will be turned on/off depending on its current state'
    },
    'automation.ps_bedlight_right_toggle': {
      trigger: 'This rule will be triggered when the button is pressed',
      condition: 'No conditions exist',
      action: 'The device will be turned on/off depending on its current state'
    },
    'automation.ps_doorlighttoggle': {
      trigger: 'This rule will be triggered when the button is pressed',
      condition: 'No conditions exist',
      action: 'The device will be turned on/off depending on its current state'
    },
    'automation.ps_roller_shutter_switch': {
      trigger: 'This rule will be triggered when the button is pressed',
      condition: 'No conditions exist',
      action: 'The device will move the shutter up/down depending on which button has been pressed'
    },
    'automation.ps_standlight_toggle': {
      trigger: 'This rule will be triggered when the button is pressed',
      condition: 'No conditions exist',
      action: 'The device will be turned on/off depending on its current state'
    },
    'automation.ps_windowlighttoggle': {
      trigger: 'This rule will be triggered when the button is pressed',
      condition: 'No conditions exist',
      action: 'The device will be turned on/off depending on its current state'
    },


    // Experimental automations
    'automation.exp_curtain_close_after_7pm': {
      trigger: 'This rule will be re-evaluated every 30 seconds.',
      condition: 'This rule will be executed only if all these conditions are true at the same time',
      action: 'These actions will be executed when the rule is triggered and the conditions are met'
    },
    'automation.exp_fan_auto_on': {
        trigger: 'This rule will be activated when the state of the device is changed as described below',
        condition: 'This rule will be executed only if all these conditions are true at the same time',
        action: 'These actions will be executed when the rule is triggered and conditions are met.'
      },
    'automation.exp_fan_auto_off': {
      trigger: 'This rule will be activated when the state of the device is changed as described below.',
      condition: 'This rule will be executed only if all these conditions are true at the same time',
      action: 'These actions will be executed when the rule is triggered and conditions are met.'
    },
    'automation.exp_light_when_entering': {
      trigger: 'This rule will be activated when the state of the device is changed as described below.',
      condition: 'This rule will be executed only if all these conditions are true at the same time',
      action: 'These actions will be executed when the rule is triggered and conditions are met'
    },
    'automation.exp_light_when_entering_night': {
      trigger: 'This rule will be activated when the state of the device is changed as described below.',
      condition: 'This rule will be executed only if all these conditions are true at the same time',
      action: 'These actions will be executed when the rule is triggered and conditions are met, in the given order.'
    },
    'automation.exp_rollershutter_eveningclosing': {
      trigger: 'This rule will be activated every day at 7.30pm.',
      condition: 'The rule will only be triggered when this condition is met.',
      action: 'These actions will be executed when the rule is triggered and conditions are met.'
    },
    'automation.exp_shutter_when_window_is_open': {
      trigger: 'This rule will be activated when the state of the device is changed as described below.',
      condition: 'This rule will be executed only if all these conditions are true at the same time',
      action: 'These actions will be executed when the rule is triggered and conditions are met.'
    },
  };

  const handleAutomationSave = () => {
    // Refresh list after creating new automation
    refetchEXP?.();
    refetchPS?.();
    setShowEditor(false);
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4 text-black">Current Rules</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Column 1: Automation list */}
       
            <div className="grid grid-cols-2 gap-4">
            <h3 className="col-span-1 font-semibold text-lg mb-2 text-black">
              Rule Name
              {showTooltips && <HeaderTooltip text="The name of the automation rule. Descriptive names help identify what each rule does at a glance." tooltipId="rule-name" />}
            </h3>
            <h3 className="col-span-1 font-semibold text-lg mb-2 text-black">
              Latest Activities
              {showTooltips && <HeaderTooltip text="The last time this rule was triggered or executed. Useful for checking if automations are running as expected." tooltipId="latest-activities" />}
            </h3>
            {loadingEXP && <p className="text-gray-400">Loading rules...</p>}
          {errorEXP && <p className="text-red-500">Error: {errorEXP.message}</p>}
          {!loadingEXP && automationsEXP.map((automationEXP) => (
            <React.Fragment key={automationEXP.entity_id}>
             <div
               onClick={() => {
                 console.log("Clicked:", automationEXP.entity_id);
                 console.log("Raw automation from HA:", automationEXP);
                 try {
                   const simpleAutomation = mapHAToSimpleAutomation(automationEXP);
                   setEditingAutomation(simpleAutomation);
                   setShowEditor(true);
                   setShowAutomationLabel(true);
                   setSelectedAutomationId(automationEXP.entity_id);
                   setSelectedAutomationElement(automationEXP.entity_id);
                 } catch (err) {
                   alert("Could not parse rule for editing.");
                 }
               }}
               className={`border-2 bg-gray-500 text-white px-4 py-3 rounded cursor-pointer font-semibold hover:bg-gray-600 transition-all duration-200 shadow-sm ${
                 selectedAutomationElement === automationEXP.entity_id 
                   ? 'border-orange-500' 
                   : 'border-zinc-600 hover:border-zinc-500'
               }`}
             >
               <div className="flex items-center justify-between">
                 <span>{automationEXP.attributes.friendly_name || automationEXP.entity_id}</span>
               </div>
             </div>

             <div className="border border-zinc-700 bg-gray-500 text-white px-4 py-3 rounded font-mono text-sm">
               <AutomationLogbookEntry entityId={automationEXP.entity_id} />
             </div>
            </React.Fragment>
          ))}

        <div className="col-span-2 my-6"></div>
      
          
          {errorPS && <p className="text-red-500">Error: {errorPS.message}</p>}
          {!loadingPS && automationsPS.map((automationPS) => (
            <React.Fragment key={automationPS.entity_id}>
             <div
               onClick={() => {
                 console.log("Clicked:", automationPS.entity_id);
                 console.log("Raw automation from HA:", automationPS);
                 try {
                   const simpleAutomation = mapHAToSimpleAutomation(automationPS);
                   setEditingAutomation(simpleAutomation);
                   setShowEditor(true);
                   setShowAutomationLabel(true);
                   setSelectedAutomationId(automationPS.entity_id);
                   setSelectedAutomationElement(automationPS.entity_id);
                 } catch (err) {
                   alert("Could not parse rule for editing.");
                 }
               }}
               className={`border-2 bg-stone-500 text-white px-4 py-3 rounded cursor-pointer font-semibold hover:bg-stone-600 transition-all duration-200 shadow-sm ${
                 selectedAutomationElement === automationPS.entity_id 
                   ? 'border-orange-500' 
                   : 'border-stone-600 hover:border-stone-500'
               }`}
             >
                                <div className="flex items-center justify-between">
                 <span>{automationPS.attributes.friendly_name || automationPS.entity_id}</span>
               </div>
             </div>

             <div className="border border-stone-700 bg-stone-500 text-white px-4 py-3 rounded font-mono text-sm">
               <AutomationLogbookEntry entityId={automationPS.entity_id} />
             </div>
            </React.Fragment>
          ))}
        </div>

        {/* Column 2: Editor */}
        <div>
          <h3 className="font-semibold text-lg mb-2 text-black">Rule Description
          {showTooltips && <HeaderTooltip text="A brief summary of what the rule does. Each rule has its triggers and actions, possibly also conditions." tooltipId="rule-description" />}
          </h3>

          

          {showAutomationLabel && editingAutomation && (
            <div className="space-y-3 sticky top-0 z-10">
              <div className="space-y-3">
                <div className="p-3 bg-orange-100 text-zinc-950 rounded font-semibold text-center border-2 border-orange-50 relative group">
                  <div className="text-sm text-black-800 mb-1">Triggers</div>
                  <div className="text-lg">
                    {selectedAutomationId && automationBoxData[selectedAutomationId] 
                      ? automationBoxData[selectedAutomationId].trigger 
                      : 'Device Name'}
                  </div>
                  {showTooltips && (
                    <>
                      <div 
                        className="absolute top-1 right-1 w-4 h-4 bg-orange-400 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-orange-500 transition-colors"
                        onClick={() => setActiveTooltip(activeTooltip === 'trigger' ? null : 'trigger')}
                      >
                        i
                      </div>
                      {activeTooltip === 'trigger' && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded z-20 max-w-md w-80">
                          {selectedAutomationId && automationTooltips[selectedAutomationId] ? 
                            automationTooltips[selectedAutomationId].trigger : 
                            'Trigger device information will appear here'}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="p-3 bg-orange-200 text-zinc-950 rounded font-semibold text-center border-2 border-orange-200 relative group">
                  <div className="text-sm text-zinc-950 mb-1">Conditions</div>
                  <div className="text-lg">
                    {selectedAutomationId && automationBoxData[selectedAutomationId] 
                      ? automationBoxData[selectedAutomationId].condition 
                      : 'condition'}
                  </div>
                  {showTooltips && (
                    <>
                      <div 
                        className="absolute top-1 right-1 w-4 h-4 bg-orange-400 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-orange-500 transition-colors"
                        onClick={() => setActiveTooltip(activeTooltip === 'condition' ? null : 'condition')}
                      >
                        i
                      </div>
                      {activeTooltip === 'condition' && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded z-20 max-w-md w-80">
                          {selectedAutomationId && automationTooltips[selectedAutomationId] ? 
                            automationTooltips[selectedAutomationId].condition : 
                            'condition information will appear here'}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-center">
                  <img src={arrow_down_automation} className="w-20 h-20" />
                </div>

                <div className="p-3 bg-orange-300 text-zinc-950 rounded font-semibold text-center border-2 border-orange-300 relative group">
                  <div className="text-sm text-zinc-950 mb-1">Actions</div>
                  <div className="text-lg">
                    {selectedAutomationId && automationBoxData[selectedAutomationId] 
                      ? automationBoxData[selectedAutomationId].action 
                      : 'action'}
                  </div>
                  {showTooltips && (
                    <>
                      <div 
                        className="absolute top-1 right-1 w-4 h-4 bg-orange-400 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-orange-500 transition-colors"
                        onClick={() => setActiveTooltip(activeTooltip === 'action' ? null : 'action')}
                      >
                        i
                      </div>
                      {activeTooltip === 'action' && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded z-20 max-w-md w-80">
                          {selectedAutomationId && automationTooltips[selectedAutomationId] ? 
                            automationTooltips[selectedAutomationId].action : 
                            'action information will appear here'}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Description box */}
              <div className="mt-4 p-2 border-2 border-orange-400 text-zinc-950 rounded font-normal text-center whitespace-pre-line">
              <div className="text-sm text-zinc-950 mb-1">Summary</div>
                {selectedAutomationId && automationLabels[selectedAutomationId]
                  ? automationLabels[selectedAutomationId]
                  : 'This automation currently does not have a description'}
              </div>
            </div>
          )}

          {/*
          {!showEditor && (
            <button
              onClick={() => setShowEditor(true)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400"
            >
              New Rule
            </button>
          )}

          {showEditor && (
            <AutomationEditor
              key={editingAutomation ? JSON.stringify(editingAutomation) : "new"}
              devices={devices}
              initialAutomation={editingAutomation}
              onSave={handleAutomationSave}
              onCancel={() => {
                setShowEditor(false);
                setEditingAutomation(null);
                setShowAutomationLabel(false);
                setSelectedAutomationId(null);
              }}
            />
          )}
          */}
          
        </div>
      </div>
    </div>
  );
};

export default AutomationCard;
