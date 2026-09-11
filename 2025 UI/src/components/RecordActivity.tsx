import React, { useState, useEffect, useRef } from "react";
import { RECORDER_PASSWORD } from "../config";

interface ActivityLog {
  timestamp: string;
  eventType: string;
  target: string;
  details: any;
}

const RecordActivity: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const logRef = useRef<ActivityLog[]>([]);
  
  // Password for access

  // Handle password submission
  const handlePasswordSubmit = () => {
    if (password === RECORDER_PASSWORD) {
      setShowPasswordModal(false);
      setPassword('');
      
      // Execute the pending action
      if (pendingAction === 'start') {
        executeStartRecording();
      } else if (pendingAction === 'stop') {
        executeStopRecording();
      }
      
      setPendingAction(null);
    } else {
      alert('Incorrect password!');
      setPassword('');
    }
  };

  // Request password for action
  const requestPassword = (action: string) => {
    setPendingAction(action);
    setShowPasswordModal(true);
    setPassword('');
  };

  // Update ref when activityLog changes
  useEffect(() => {
    logRef.current = activityLog;
  }, [activityLog]);



  // Shape data from the floorplan JSON
  const shapeData = [
    { id: "smartfan", type: "rect", x: 110, y: 120, width: 30, height: 30, fill: "orange", label: "Fan" },
    { id: "standinglamp", type: "rect", x: 100, y: 500, width: 30, height: 30, fill: "orange", label: "Standing Lamp" },
    { id: "tv", type: "rect", x: 280, y: 480, width: 30, height: 30, fill: "orange", label: "TV" },
    { id: "ipad", type: "rect", x: 380, y: 500, width: 30, height: 30, fill: "orange", label: "IPad" },
    { id: "hub", type: "rect", x: 490, y: 120, width: 60, height: 60, fill: "orange", label: "Hub" },
    { id: "curtain", type: "rect", x: 30, y: 100, width: 30, height: 30, fill: "orange", label: "Blinds" },
    { id: "rollo", type: "rect", x: 30, y: 460, width: 30, height: 30, fill: "orange", label: "Blinds" },
    { id: "heater", type: "rect", x: 30, y: 400, width: 30, height: 30, fill: "orange", label: "Heater" },
    { id: "presencesensor", type: "rect", x: 280, y: 350, width: 30, height: 30, fill: "orange", label: "Presencesensor" },
    { id: "doorsensor", type: "rect", x: 540, y: 430, width: 30, height: 30, fill: "orange", label: "Doorsensor" },
    { id: "windowsensor", type: "rect", x: 30, y: 340, width: 30, height: 30, fill: "orange", label: "Windowsensor" },
    { id: "windowlight", type: "rect", x: 30, y: 160, width: 30, height: 30, fill: "orange", label: "Walllight" },
    { id: "temperaturesensor", type: "rect", x: 30, y: 200, width: 30, height: 30, fill: "orange", label: "Temperaturesensor" },
    { id: "rolloswitch", type: "rect", x: 30, y: 280, width: 30, height: 30, fill: "orange", label: "Roller Shutter Control" },
    { id: "doorlight", type: "rect", x: 440, y: 500, width: 30, height: 30, fill: "orange", label: "Walllight" },
    { id: "doorswitch", type: "rect", x: 500, y: 500, width: 30, height: 30, fill: "orange", label: "Wallswitch" },
    { id: "bedlight_left", type: "rect", x: 190, y: 100, width: 30, height: 30, fill: "orange", label: "Bedlight" },
    { id: "sf02", type: "rect", x: 190, y: 160, width: 30, height: 30, fill: "orange", label: "Button" },
    { id: "bedlight_right", type: "rect", x: 400, y: 100, width: 30, height: 30, fill: "orange", label: "Bedlight" },
    { id: "sf01", type: "rect", x: 400, y: 160, width: 30, height: 30, fill: "orange", label: "Button" }
  ];

  // Helper function to match clicked coordinates with shape data
  const matchShapeData = (event: MouseEvent, canvasElement: HTMLCanvasElement) => {
    try {
      const rect = canvasElement.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      
      // Debug logging for canvas interactions
      console.log('Canvas click detected:', {
        canvasId: canvasElement.id,
        clientX: event.clientX,
        clientY: event.clientY,
        canvasX: Math.round(canvasX),
        canvasY: Math.round(canvasY),
        canvasWidth: canvasElement.width,
        canvasHeight: canvasElement.height
      });
      
      // Find which shape was clicked by checking if coordinates fall within any shape bounds
      const clickedShape = shapeData.find(shape => {
        if (shape.type === 'rect') {
          const isClicked = canvasX >= shape.x && 
                           canvasX <= shape.x + shape.width && 
                           canvasY >= shape.y && 
                           canvasY <= shape.y + shape.height;
          
          // Debug logging for shape matching
          if (Math.abs(canvasX - (shape.x + shape.width/2)) < 50 && Math.abs(canvasY - (shape.y + shape.height/2)) < 50) {
            console.log('Shape proximity check:', {
              shapeId: shape.id,
              shapeLabel: shape.label,
              shapeBounds: { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
              clickPoint: { x: canvasX, y: canvasY },
              isClicked
            });
          }
          
          return isClicked;
        }
        
        return false;
      });
      
      if (clickedShape) {
        console.log('Shape clicked:', clickedShape);
        return {
          canvasX: Math.round(canvasX),
          canvasY: Math.round(canvasY),
          clickedDevice: {
            id: clickedShape.id,
            label: clickedShape.label,
            type: clickedShape.type,
            x: clickedShape.x,
            y: clickedShape.y,
            width: clickedShape.width,
            height: clickedShape.height
          }
        };
      } else {
        console.log('No shape found at coordinates:', { x: canvasX, y: canvasY });
        return {
          canvasX: Math.round(canvasX),
          canvasY: Math.round(canvasY),
          clickedDevice: null,
          note: "Click was outside of any known device area"
        };
      }
    } catch (error) {
      console.warn('Error matching shape data:', error);
      return null;
    }
  };

  const executeStartRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(new Date());
    setActivityLog([]);
    
    // Add initial log entry
    const initialLog: ActivityLog = {
      timestamp: new Date().toISOString(),
      eventType: "RECORDING_STARTED",
      target: "RecordActivity Component",
      details: { message: "User activity recording started" }
    };
    
    setActivityLog([initialLog]);
    
    // Add global event listeners
    document.addEventListener('mousedown', handleGlobalClick, true); // Use mousedown to capture text before it changes, capture phase
    document.addEventListener('keydown', handleGlobalKeydown, true);
    document.addEventListener('scroll', handleGlobalScroll, true);
    document.addEventListener('input', handleGlobalInput, true);
    document.addEventListener('change', handleGlobalChange, true);
    document.addEventListener('submit', handleGlobalSubmit, true);
  };

  const startRecording = () => {
    requestPassword('start');
  };

  const executeStopRecording = () => {
    setIsRecording(false);
    
    // Remove global event listeners
    document.removeEventListener('mousedown', handleGlobalClick, true);
    document.removeEventListener('keydown', handleGlobalKeydown, true);
    document.removeEventListener('scroll', handleGlobalScroll, true);
    document.removeEventListener('input', handleGlobalInput, true);
    document.removeEventListener('change', handleGlobalChange, true);
    document.removeEventListener('submit', handleGlobalSubmit, true);
    
    // Add final log entry
    const finalLog: ActivityLog = {
      timestamp: new Date().toISOString(),
      eventType: "RECORDING_STOPPED",
      target: "RecordActivity Component",
      details: { 
        message: "User activity recording stopped",
        totalEvents: logRef.current.length,
        duration: recordingStartTime ? 
          `${Math.round((new Date().getTime() - recordingStartTime.getTime()) / 1000)}s` : 
          "Unknown"
      }
    };
    
    setActivityLog(prev => [...prev, finalLog]);
  };

  const stopRecording = () => {
    requestPassword('stop');
  };

  const handleGlobalClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Skip recording interactions with the recorder component itself
    // Note: Removed the overly broad '.bg-gray-500.dark\\:bg-gray-500' filter that was preventing
    // recording of clicks on DeviceCard components which use these classes
    if (target.closest('[data-recorder-component]') ||
        target.textContent?.includes('Recorder') ||
        target.textContent?.includes('Start') ||
        target.textContent?.includes('Stop') ||
        target.textContent?.includes('Export') ||
        target.textContent?.includes('Clear')) {
      return;
    }
    
    // Enhanced element labeling - capture comprehensive labels for clicked elements
    const getElementLabel = (element: HTMLElement): string => {
      // Check for various label attributes and text content
      const ariaLabel = element.getAttribute('aria-label');
      const title = element.getAttribute('title');
      const placeholder = element.getAttribute('placeholder');
      const name = element.getAttribute('name');
      const id = element.id;
      const textContent = element.textContent?.trim();
      const value = element instanceof HTMLInputElement ? element.value : '';
      
      // For buttons, prioritize button-specific attributes
      if (element.tagName === 'BUTTON' || element.closest('button')) {
        const button = element.tagName === 'BUTTON' ? element : element.closest('button') as HTMLButtonElement;
        if (button) {
          return button.getAttribute('aria-label') || 
                 button.textContent?.trim() || 
                 (button as HTMLButtonElement).value || 
                 button.getAttribute('title') || 
                 'Button';
        }
      }
      
      // For inputs, include type and placeholder
      if (element.tagName === 'INPUT') {
        const input = element as HTMLInputElement;
        const type = input.type;
        const label = ariaLabel || title || placeholder || name || id || textContent || value || `Input (${type})`;
        return label;
      }
      
      // For other elements, try to find the most descriptive label
      return ariaLabel || title || placeholder || name || id || textContent || value || element.tagName.toLowerCase();
    };
    
    // Get the clicked element's label
    const elementLabel = getElementLabel(target);
    
    // Enhanced labeling for canvas elements
    let enhancedElementLabel = elementLabel;
    if (target.tagName === 'CANVAS' || target.closest('canvas')) {
      const canvasElement = target.tagName === 'CANVAS' ? target : target.closest('canvas');
      if (canvasElement && canvasElement instanceof HTMLCanvasElement) {
        const canvas = canvasElement as HTMLCanvasElement;
        const shapeData = matchShapeData(event, canvas);
        
        if (shapeData?.clickedDevice) {
          enhancedElementLabel = `Canvas Device: ${shapeData.clickedDevice.label}`;
        } else if (canvas.width === 600 && canvas.height === 600) {
          enhancedElementLabel = 'Floormap Canvas';
        } else {
          enhancedElementLabel = 'Canvas Element';
        }
      }
    }
    
    // Get parent context (e.g., card title, section heading)
    const getParentContext = (element: HTMLElement): string => {
      // Look for nearby headings or card titles
      const parent = element.closest('div, section, article');
      if (parent) {
        // Check for headings within the parent
        const heading = parent.querySelector('h1, h2, h3, h4, h5, h6');
        if (heading) {
          return heading.textContent?.trim() || '';
        }
        
        // Check for card titles or labels
        const cardTitle = parent.querySelector('[class*="title"], [class*="label"], [class*="name"]');
        if (cardTitle) {
          return cardTitle.textContent?.trim() || '';
        }
        
        // Check for aria-label on parent
        const parentAriaLabel = parent.getAttribute('aria-label');
        if (parentAriaLabel) {
          return parentAriaLabel;
        }
        
        // Special case for FloormapKonva - look for "Smart Hotel" heading
        if (element.tagName === 'CANVAS' || element.closest('canvas')) {
          const smartHotelHeading = document.querySelector('h1');
          if (smartHotelHeading && smartHotelHeading.textContent?.includes('Smart Hotel')) {
            return 'FloormapKonva Component';
          }
        }
      }
      
      return '';
    };
    
    const parentContext = getParentContext(target);
    
    // Get the full context path (breadcrumb-style)
    const getContextPath = (element: HTMLElement): string[] => {
      const path: string[] = [];
      let current = element;
      
      // Go up the DOM tree to build context path
      while (current && current !== document.body) {
        const label = getElementLabel(current);
        if (label && label !== current.tagName.toLowerCase()) {
          path.unshift(label);
        }
        current = current.parentElement as HTMLElement;
      }
      
      return path.slice(0, 3); // Limit to 3 levels to avoid too much noise
    };
    
    const contextPath = getContextPath(target);
    
    // Enhanced canvas detection and information extraction
    let canvasInfo: any = null;
    
    // Check if this is a Konva canvas element
    if (target.tagName === 'CANVAS' || target.closest('canvas')) {
      const canvasElement = target.tagName === 'CANVAS' ? target : target.closest('canvas');
      if (canvasElement && canvasElement instanceof HTMLCanvasElement) {
        const canvas = canvasElement as HTMLCanvasElement;
        const shapeData = matchShapeData(event, canvas);
        
        // Enhanced Konva canvas detection
        const isKonvaCanvas = canvas.id?.includes('konva') || 
                             canvas.className?.includes('konva') ||
                             canvas.closest('[data-konva]') ||
                             canvas.closest('.konva-container') ||
                             canvas.closest('[class*="konva"]');
        
        // Special detection for FloormapKonva component
        const isFloormapCanvas = canvas.closest('div')?.querySelector('h1')?.textContent?.includes('Smart Hotel') ||
                                canvas.closest('div')?.querySelector('[style*="border"]') ||
                                canvas.width === 600 && canvas.height === 600; // FloormapKonva uses 600x600
        
        canvasInfo = {
          canvasId: canvas.id || 'unnamed-canvas',
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          isKonvaCanvas: !!isKonvaCanvas,
          isFloormapCanvas: !!isFloormapCanvas,
          clickedCoordinates: {
            x: shapeData?.canvasX || 0,
            y: shapeData?.canvasY || 0
          },
          clickedDevice: shapeData?.clickedDevice || null,
          note: shapeData?.note || null,
          // Additional Konva-specific information
          konvaContext: isKonvaCanvas ? {
            stageId: canvas.closest('[data-konva-stage]')?.getAttribute('data-konva-stage'),
            layerId: canvas.closest('[data-konva-layer]')?.getAttribute('data-konva-layer'),
            // Try to get Konva stage information if available
            stageInfo: (window as any).Konva?.stages?.find((stage: any) => 
              stage.container()?.querySelector('canvas') === canvas
            ) ? 'Konva stage detected' : null
          } : null
        };
        
        // If it's a Konva canvas, try to get more specific information
        if (isKonvaCanvas) {
          // Look for nearby text or labels that might indicate what was clicked
          const canvasContainer = canvas.closest('div');
          if (canvasContainer) {
            const nearbyText = Array.from(canvasContainer.querySelectorAll('*'))
              .filter(el => el.textContent && el.textContent.trim().length > 0)
              .map(el => el.textContent?.trim())
              .filter(text => text && text.length < 50)
              .slice(0, 3);
            
            if (nearbyText.length > 0) {
              canvasInfo.nearbyText = nearbyText;
            }
          }
        }
      }
    }
    
    // Check for SVG elements (for FloormapSVG component)
    let svgInfo: any = null;
    if (target.tagName === 'svg' || target.closest('svg')) {
      const svg = target.tagName === 'svg' ? target : target.closest('svg') as SVGSVGElement;
      if (svg) {
        svgInfo = {
          svgId: svg.id || 'unnamed-svg',
          svgWidth: (svg as any).width?.baseVal?.value || svg.getAttribute('width'),
          svgHeight: (svg as any).height?.baseVal?.value || svg.getAttribute('height'),
          viewBox: svg.getAttribute('viewBox')
        };
        
        // Check if clicked element has specific SVG attributes
        const clickedElement = event.target as SVGElement;
        if (clickedElement) {
          svgInfo.clickedElement = {
            tagName: clickedElement.tagName,
            id: clickedElement.id || null,
            className: (clickedElement as any).className?.baseVal || clickedElement.getAttribute('class') || null,
            dataAttributes: {}
          };
          
          // Extract data attributes
          Array.from(clickedElement.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
              svgInfo.clickedElement.dataAttributes[attr.name] = attr.value;
            }
          });
        }
      }
    }
    
    // What element have been clicked
    const log: ActivityLog = {
      timestamp: new Date().toISOString(),
      eventType: "CLICK",
      target: target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ')[0]}` : ''),
      details: {
        x: event.clientX,
        y: event.clientY,
        elementLabel: enhancedElementLabel,
        parentContext: parentContext,
        contextPath: contextPath,
        tagName: target.tagName,
        id: target.id || null,
        className: target.className || null,
        isButton: target.tagName === 'BUTTON' || !!target.closest('button'),
        canvasInfo: canvasInfo,
        svgInfo: svgInfo,
        // Additional element information
        attributes: Array.from(target.attributes).reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {} as Record<string, string>)
      }
    };
    
    setActivityLog(prev => [...prev, log]);
  };

  const handleGlobalKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    
    // Skip recording keydown events for privacy and security reasons
    // This includes recorder component, password fields, and any input fields
    if (target.closest('[data-recorder-component]') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true' ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[contenteditable="true"]')) {
      return;
    }
    
    const log: ActivityLog = {
      timestamp: new Date().toISOString(),
      eventType: "KEYDOWN",
      target: target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ')[0]}` : ''),
      details: {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      }
    };
    setActivityLog(prev => [...prev, log]);
  };

  const handleGlobalScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    
    // Skip recording interactions with the recorder component itself
    if (target.closest('[data-recorder-component]')) {
      return;
    }
    
    const log: ActivityLog = {
      timestamp: new Date().toISOString(),
      eventType: "SCROLL",
      target: target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ')[0]}` : ''),
      details: {
        scrollTop: target.scrollTop,
        scrollLeft: target.scrollLeft,
        scrollHeight: target.scrollHeight,
        scrollWidth: target.scrollWidth,
        scrollPercentage: {
          vertical: target.scrollHeight > target.clientHeight ? 
            Math.round((target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100) : 0,
          horizontal: target.scrollWidth > target.clientWidth ? 
            Math.round((target.scrollLeft / (target.scrollWidth - target.clientWidth)) * 100) : 0
        }
      }
    };
    setActivityLog(prev => [...prev, log]);
  };

  const handleGlobalInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    
    // Skip recording input events for privacy and security reasons
    // This includes recorder component, password fields, and any input fields
    if (target.closest('[data-recorder-component]') ||
        target.type === 'password' ||
        target.type === 'email' ||
        target.type === 'tel' ||
        target.type === 'search' ||
        target.getAttribute('autocomplete') === 'off' ||
        target.getAttribute('data-private') === 'true') {
      return;
    }
    
    const log: ActivityLog = {
      timestamp: new Date().toISOString(),
      eventType: "INPUT",
      target: target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ')[0]}` : ''),
      details: {
        value: target.value.slice(0, 100), // Limit value length
        type: target.type,
        name: target.name || null
      }
    };
    setActivityLog(prev => [...prev, log]);
  };

  const handleGlobalChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    
    // Skip recording change events for privacy and security reasons
    // This includes recorder component, password fields, and sensitive input fields
    if (target.closest('[data-recorder-component]') ||
        target.type === 'password' ||
        target.type === 'email' ||
        target.type === 'tel' ||
        target.type === 'search' ||
        target.getAttribute('autocomplete') === 'off' ||
        target.getAttribute('data-private') === 'true') {
      return;
    }
    
    const log: ActivityLog = {
      timestamp: new Date().toISOString(),
      eventType: "CHANGE",
      target: target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ')[0]}` : ''),
      details: {
        value: target.value.slice(0, 100), // Limit value length
        type: target.type,
        name: target.name || null,
        checked: target.checked || null
      }
    };
    setActivityLog(prev => [...prev, log]);
  };

  const handleGlobalSubmit = (event: Event) => {
    const target = event.target as HTMLFormElement;
    
    // Skip recording interactions with the recorder component itself
    if (target.closest('[data-recorder-component]')) {
      return;
    }
    
    const log: ActivityLog = {
      timestamp: new Date().toISOString(),
      eventType: "SUBMIT",
      target: target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ')[0]}` : ''),
      details: {
        action: target.action || null,
        method: target.method || null
      }
    };
    setActivityLog(prev => [...prev, log]);
  };

  const executeExportLog = () => {
    const logData = {
      recordingInfo: {
        startTime: recordingStartTime?.toISOString(),
        endTime: new Date().toISOString(),
        totalEvents: activityLog.length
      },
      activities: activityLog
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-activity-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportLog = () => {
    executeExportLog();
  };

  const executeClearLog = () => {
    setActivityLog([]);
    setRecordingStartTime(null);
  };

  const clearLog = () => {
    executeClearLog();
  };

  return (
    <div className="bg-gray-500 dark:bg-gray-500 text-black dark:text-white shadow-md rounded-lg p-3 w-full max-w-xs flex flex-col gap-2" data-recorder-component>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-400'}`}></div>
        </div>
        <h2 className="text-sm font-semibold">Recorder</h2>
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-1">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              isRecording 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            Start
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              !isRecording 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            Stop
          </button>
        </div>

        {activityLog.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">
                {activityLog.length} events
              </span>
              {recordingStartTime && (
                <span className="text-xs text-gray-400">
                  {Math.round((new Date().getTime() - recordingStartTime.getTime()) / 1000)}s
                </span>
              )}
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={exportLog}
                className="flex-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
              >
                Export
              </button>
              <button
                onClick={clearLog}
                className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {isRecording && (
          <div className="text-center">
            <div className="text-xs text-red-500 font-medium animate-pulse">
              Recording...
            </div>
          </div>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-recorder-component>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4 text-center">Password Required</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                Enter password to {pendingAction} recording
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-black dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                    setPendingAction(null);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordActivity; 