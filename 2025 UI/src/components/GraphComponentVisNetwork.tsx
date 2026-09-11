import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

const GraphComponent = () => {
  const [selectedNode, setSelectedNode] = useState(null); // Track the selected node
  const networkRef = useRef(null); // Reference for the graph container

  useEffect(() => {
    const centerX = 400, centerY = 300, radius1 = 260, radius2 = 140;
    // Define a type for nodes that includes x, y, and fixed
    type VisNode = {
      id: number;
      label: string;
      shape: string;
      image: string;
      x?: number;
      y?: number;
      fixed?: boolean;
    };
    // Define your nodes as before, but without x/y/fixed yet
    const nodeDefs: VisNode[] = [
      { id: 1, label: 'Hub', shape: 'circularImage', image:'/images/devices/hub.png' },

      { id: 2, label: 'Climate', shape: 'circularImage', image:'/images/climate.png' },
      { id: 3, label: 'Media', shape: 'circularImage', image:'/images/media.png' },
      { id: 4, label: 'Sensors', shape: 'circularImage', image:'/images/sensors.png' },
      { id: 5, label: 'Lights', shape: 'circularImage', image:'/images/lightbulb-on.png' },
      { id: 6, label: 'Switches', shape: 'circularImage', image:'/images/devices/button.png' },

      { id: 7, label: 'Heater', shape: 'circularImage', image:'/images/devices/Heater.svg' },
      { id: 8, label: 'Fan', shape: 'circularImage', image:'/images/devices/fan.png' },
      { id: 9, label: 'Rollo', shape: 'circularImage', image:'/images/devices/blinds.png' },
      { id: 10, label: 'Curtain', shape: 'circularImage', image:'/images/devices/blinds.png' },

      { id: 11, label: 'TV', shape: 'circularImage', image:'/images/devices/tv.png' },

      { id: 12, label: 'Presencesensor', shape: 'circularImage', image:'/images/devices/motionsensor.png' },
      { id: 13, label: 'Doorsensor', shape: 'circularImage', image:'/images/devices/door_sensor.svg' },
      { id: 14, label: 'Windowsensor', shape: 'circularImage', image:'/images/devices/window_sensor.svg' },
      { id: 15, label: 'Temperaturesensor', shape: 'circularImage', image:'/images/devices/temperaturesensor.png' },

      { id: 16, label: 'Windowlight', shape: 'circularImage', image:'/images/devices/walllamp.png' },
      { id: 17, label: 'Doorlight', shape: 'circularImage', image:'/images/devices/walllamp.png' },
      { id: 18, label: 'Bedlight R', shape: 'circularImage', image:'/images/devices/bedlight.png' },
      { id: 19, label: 'Bedlight L', shape: 'circularImage', image:'/images/devices/bedlight.png' },
      { id: 20, label: 'Standing lamp', shape: 'circularImage', image:'/images/devices/standinglamp.png' },

      { id: 21, label: 'Roller Shutter Control', shape: 'circularImage', image:'/images/devices/rolloswitch.png' },
      { id: 22, label: 'Wallswitch', shape: 'circularImage', image:'/images/devices/switch.svg' },
      { id: 23, label: 'SF-01', shape: 'circularImage', image:'/images/devices/switch.svg' },
      { id: 24, label: 'SF-02', shape: 'circularImage', image:'/images/devices/switch.svg' },
    ];

    // Map node id to node object for easy lookup
    const nodeMap: { [id: number]: VisNode } = Object.fromEntries(nodeDefs.map(n => [n.id, { ...n }]));

    // Place node 1 at center
    nodeMap[1].x = centerX;
    nodeMap[1].y = centerY;
    nodeMap[1].fixed = true;

    // Place nodes 2-6 in a circle around node 1
    const firstRing = [2, 3, 4, 5, 6];
    firstRing.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / firstRing.length;
      nodeMap[id].x = centerX + radius1 * Math.cos(angle);
      nodeMap[id].y = centerY + radius1 * Math.sin(angle);
      nodeMap[id].fixed = true;
    });

    // Remove code that places children nodes around their parents
    // All other nodes (7-24) will be positioned by vis-network's default behavior

    // Convert nodeMap back to array
    const nodes: VisNode[] = Object.values(nodeMap);

    const edges = [
      { from: 1, to: 2 }, 
      { from: 1, to: 3 }, 
      { from: 1, to: 4 }, 
      { from: 1, to: 5 }, 
      { from: 1, to: 6 },

      { from: 2, to: 7 }, 
      { from: 2, to: 8 }, 
      { from: 2, to: 9 }, 
      { from: 2, to: 10 },

      { from: 3, to: 11 },

      { from: 4, to: 12 }, 
      { from: 4, to: 13 }, 
      { from: 4, to: 14 }, 
      { from: 4, to: 15 },

      { from: 5, to: 16 }, 
      { from: 5, to: 17 }, 
      { from: 5, to: 18 }, 
      { from: 5, to: 19 }, 
      { from: 5, to: 20 },

      { from: 6, to: 21 }, 
      { from: 6, to: 22 }, 
      { from: 6, to: 23 }, 
      { from: 6, to: 24 },
    ];

    const data = { nodes, edges };
    const options = {
      interaction: { click: true },
      nodes: { font: { size: 24 }, shape: 'circle' },
      physics: { enabled: false },
    };

    if (networkRef.current) {
      const network = new Network(networkRef.current, data, options);
      network.on('click', function (event) {
        const nodeId = event.nodes[0];
        setSelectedNode(nodeId);
      });
      return () => { network.destroy(); };
    }
  }, []);

  return (
    <div>
      <div style={{ width: '100%', height: '600px' }} ref={networkRef}></div>
      {selectedNode && (
        <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
          Selected Node: {selectedNode}
        </div>
      )}
    </div>
  );
};

export default GraphComponent;
