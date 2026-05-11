import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  ServerIcon, 
  ComputerDesktopIcon, 
  WifiIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

// Custom node types
const deviceNodeTypes = {
  router: RouterNode,
  switch: SwitchNode,
  host: HostNode,
};

// Router Node Component
function RouterNode({ data }) {
  return (
    <div className="router-node">
      <div className="device-header">
        <ServerIcon className="w-6 h-6 text-blue-500" />
        <span className="device-name">{data.label}</span>
      </div>
      <div className="device-info">
        <span className="device-type">Router</span>
        <span className="device-status">{data.status}</span>
      </div>
      <div className="device-interfaces">
        {data.interfaces?.map((iface, index) => (
          <div key={index} className="interface-port">
            <span className="interface-name">{iface.name}</span>
            <span className="interface-ip">{iface.ip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Switch Node Component
function SwitchNode({ data }) {
  return (
    <div className="switch-node">
      <div className="device-header">
        <WifiIcon className="w-6 h-6 text-green-500" />
        <span className="device-name">{data.label}</span>
      </div>
      <div className="device-info">
        <span className="device-type">Switch</span>
        <span className="device-status">{data.status}</span>
      </div>
      <div className="device-interfaces">
        {data.interfaces?.map((iface, index) => (
          <div key={index} className="interface-port">
            <span className="interface-name">{iface.name}</span>
            <span className="interface-vlan">{iface.vlan}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Host Node Component
function HostNode({ data }) {
  return (
    <div className="host-node">
      <div className="device-header">
        <ComputerDesktopIcon className="w-6 h-6 text-purple-500" />
        <span className="device-name">{data.label}</span>
      </div>
      <div className="device-info">
        <span className="device-type">Host</span>
        <span className="device-status">{data.status}</span>
      </div>
      <div className="device-interfaces">
        {data.interfaces?.map((iface, index) => (
          <div key={index} className="interface-port">
            <span className="interface-name">{iface.name}</span>
            <span className="interface-ip">{iface.ip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TopologyBuilder = ({ 
  labConfig, 
  onDeviceClick, 
  onLabStart, 
  isLabRunning,
  selectedDevice 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Convert lab config to React Flow nodes and edges
  const initializeTopology = useCallback(() => {
    if (!labConfig) return;

    const { topology } = labConfig;
    const newNodes = [];
    const newEdges = [];

    // Create nodes
    topology.devices.forEach((device, index) => {
      const node = {
        id: device.id,
        type: device.type,
        position: { 
          x: 200 + (index % 3) * 250, 
          y: 100 + Math.floor(index / 3) * 200 
        },
        data: {
          label: device.name || device.id,
          deviceType: device.type,
          status: isLabRunning ? 'running' : 'stopped',
          interfaces: device.interfaces || [],
          onClick: () => onDeviceClick(device.id)
        }
      };
      newNodes.push(node);
    });

    // Create edges
    topology.links.forEach((link) => {
      const edge = {
        id: link.id,
        source: link.source,
        target: link.target,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#666',
        },
        style: { 
          stroke: isLabRunning ? '#10b981' : '#666',
          strokeWidth: 2 
        },
        data: {
          linkType: link.type,
          status: isLabRunning ? 'active' : 'inactive'
        }
      };
      newEdges.push(edge);
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [labConfig, isLabRunning, onDeviceClick, setNodes, setEdges]);

  // Initialize topology when lab config changes
  React.useEffect(() => {
    initializeTopology();
  }, [initializeTopology]);

  // Handle new connections (disabled for predefined labs)
  const onConnect = useCallback(
    (params) => {
      // For predefined labs, don't allow new connections
      if (labConfig) return;
      
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, labConfig]
  );

  // Handle node clicks
  const onNodeClick = useCallback((event, node) => {
    if (node.data.onClick) {
      node.data.onClick();
    }
  }, []);

  // Handle lab start
  const handleStartLab = useCallback(() => {
    if (onLabStart) {
      onLabStart();
    }
  }, [onLabStart]);

  // Update node styles based on selection
  const updateNodeStyles = useCallback(() => {
    return nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        border: selectedDevice === node.id ? '3px solid #3b82f6' : '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: selectedDevice === node.id ? '#eff6ff' : '#ffffff',
        minWidth: '200px',
        minHeight: '120px'
      },
      className: `device-node ${node.type} ${selectedDevice === node.id ? 'selected' : ''}`
    }));
  }, [nodes, selectedDevice]);

  React.useEffect(() => {
    const styledNodes = updateNodeStyles();
    if (JSON.stringify(styledNodes) !== JSON.stringify(nodes)) {
      setNodes(styledNodes);
    }
  }, [updateNodeStyles, nodes, setNodes]);

  if (!labConfig) {
    return (
      <div className="topology-empty">
        <div className="empty-message">
          <ArrowPathIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3>No Lab Selected</h3>
          <p>Select a lab from the list to see the topology</p>
        </div>
      </div>
    );
  }

  return (
    <div className="topology-builder">
      <div className="topology-header">
        <div className="lab-info">
          <h2>{labConfig.title}</h2>
          <p>{labConfig.description}</p>
          <div className="lab-meta">
            <span className="difficulty">{labConfig.difficulty}</span>
            <span className="duration">{labConfig.duration} min</span>
            <span className="category">{labConfig.category}</span>
          </div>
        </div>
        <div className="topology-controls">
          <button
            onClick={handleStartLab}
            disabled={isLabRunning}
            className={`btn ${isLabRunning ? 'btn-success' : 'btn-primary'}`}
          >
            {isLabRunning ? 'Lab Running' : 'Start Lab'}
          </button>
        </div>
      </div>

      <div className="topology-canvas" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={deviceNodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#f3f4f6" gap={20} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              if (selectedDevice === node.id) return '#3b82f6';
              return node.type === 'router' ? '#3b82f6' : 
                     node.type === 'switch' ? '#10b981' : '#8b5cf6';
            }}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
        </ReactFlow>
      </div>

      <div className="topology-legend">
        <div className="legend-item">
          <ServerIcon className="w-4 h-4 text-blue-500" />
          <span>Router</span>
        </div>
        <div className="legend-item">
          <WifiIcon className="w-4 h-4 text-green-500" />
          <span>Switch</span>
        </div>
        <div className="legend-item">
          <ComputerDesktopIcon className="w-4 h-4 text-purple-500" />
          <span>Host</span>
        </div>
      </div>
    </div>
  );
};

export default TopologyBuilder;
