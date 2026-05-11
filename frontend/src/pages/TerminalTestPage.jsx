import React, { useState } from 'react';
import SimpleTerminal from '../components/SimpleTerminal';
import { useAuth } from '../contexts/AuthContext';

const TerminalTestPage = () => {
  const { getToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [deviceId] = useState('router1');
  const [output, setOutput] = useState([]);

  const handleCommand = async (command) => {
    try {
      const response = await fetch('/api/simulation/test-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ 
          deviceId,
          command 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setOutput(prev => [...prev, { type: 'success', text: result.output }]);
      } else {
        setOutput(prev => [...prev, { type: 'error', text: result.output }]);
      }
    } catch (error) {
      setOutput(prev => [...prev, { type: 'error', text: `Error: ${error.message}` }]);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/simulation/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        }
      });

      const result = await response.json();
      setIsConnected(result.success);
      
      if (result.success) {
        setOutput(prev => [...prev, { type: 'success', text: 'Connected to simulation engine' }]);
      } else {
        setOutput(prev => [...prev, { type: 'error', text: 'Failed to connect' }]);
      }
    } catch (error) {
      setIsConnected(false);
      setOutput(prev => [...prev, { type: 'error', text: `Connection error: ${error.message}` }]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terminal Test - Phase 1</h1>
        
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={testConnection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Test Connection
            </button>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            Testing basic terminal functionality with real FRRouting containers
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Terminal</h2>
            <SimpleTerminal 
              deviceId={deviceId}
              onCommand={handleCommand}
              isConnected={isConnected}
            />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Command Output</h2>
            <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto">
              {output.length === 0 ? (
                <div className="text-gray-500 text-sm">No commands executed yet</div>
              ) : (
                output.map((item, index) => (
                  <div key={index} className="mb-2">
                    <div className={`text-sm font-mono ${
                      item.type === 'error' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {item.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Test Commands</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Basic:</strong>
              <ul className="text-gray-400 mt-1">
                <li>ls</li>
                <li>pwd</li>
                <li>whoami</li>
              </ul>
            </div>
            <div>
              <strong>Network:</strong>
              <ul className="text-gray-400 mt-1">
                <li>ip addr</li>
                <li>ping 8.8.8.8</li>
                <li>ip route</li>
              </ul>
            </div>
            <div>
              <strong>FRR:</strong>
              <ul className="text-gray-400 mt-1">
                <li>vtysh -c "show ip route"</li>
                <li>vtysh -c "show interface"</li>
                <li>vtysh -c "show running-config"</li>
              </ul>
            </div>
            <div>
              <strong>System:</strong>
              <ul className="text-gray-400 mt-1">
                <li>ps aux</li>
                <li>netstat -tlnp</li>
                <li>cat /etc/frr/frr.conf</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalTestPage;
