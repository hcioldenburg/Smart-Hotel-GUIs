import React, { useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { useDevices } from '../hooks/useDevices';

const NetworkGraph: React.FC = () => {
  const { devices, loading, error } = useDevices();
  const fgRef = useRef<ForceGraphMethods | null>(null);

  // Transform devices into nodes and links grouped by domain
  const graphData = React.useMemo(() => {
    if (!devices || devices.length === 0) return { nodes: [], links: [] };
    const domainSet = new Set<string>();
    const nodes: any[] = [];
    const links: any[] = [];

    // 1. Add domain nodes
    devices.forEach(device => {
      const domain = device.entity_id.split('.')[0];
      if (!domainSet.has(domain)) {
        nodes.push({ id: domain, label: domain, type: 'domain' });
        domainSet.add(domain);
      }
    });

    // 2. Add device nodes and links to domain
    devices.forEach(device => {
      const domain = device.entity_id.split('.')[0];
      const label = device.attributes?.friendly_name || device.entity_id;
      nodes.push({ id: device.entity_id, label, type: 'device', domain });
      links.push({ source: device.entity_id, target: domain });
    });

    return { nodes, links };
  }, [devices]);

  // Fit graph to canvas after data loads
  useEffect(() => {
    if (graphData.nodes.length > 0 && fgRef.current) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 50);
      }, 200);
    }
  }, [graphData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading devices network graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Error loading devices: {error.message || error.toString()}</div>
      </div>
    );
  }

  if (!graphData.nodes.length) {
    return (
      <div className="flex items-center justify-center h-96 border-2 border-red-500 bg-red-50">
        <div className="text-lg text-red-600">No devices found.</div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 border-4 border-blue-400 rounded-lg overflow-hidden bg-white relative">
      <ForceGraph2D
        ref={fgRef as React.RefObject<ForceGraphMethods>}
        graphData={graphData}
        nodeLabel={(node: any) => node.label}
        nodeColor={(node: any) => {
          if (node.type === 'domain') return '#3b82f6'; // blue for domain
          return '#10b981'; // green for devices
        }}
        nodeRelSize={6}
        linkWidth={1}
        linkColor="#6b7280"
        backgroundColor="#f9fafb"
        cooldownTicks={100}
        onEngineStop={() => {
          // For debugging
          // eslint-disable-next-line no-console
          console.log('Force graph simulation stopped');
        }}
      />
      {/* Fallback: show node count for debugging */}
      <div className="absolute top-2 right-4 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs shadow">
        Nodes: {graphData.nodes.length} | Links: {graphData.links.length}
      </div>
    </div>
  );
};

export default NetworkGraph;
