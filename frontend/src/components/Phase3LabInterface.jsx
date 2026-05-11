/**
 * Phase 3 Lab Interface - Enhanced Interactive Lab Experience
 * 
 * This component provides:
 * - Multi-terminal support
 * - Real-time progress tracking
 * - Intelligent validation
 * - Hint system
 * - Device monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'react-query';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import SimpleTerminal from './SimpleTerminal';
import TopologyBuilder from './TopologyBuilder';

const Phase3LabInterface = ({ labId, labConfig, onBack }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  const [showHints, setShowHints] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [monitoringData, setMonitoringData] = useState(null);

  // Start lab mutation
  const startLabMutation = useMutation(
    async (labId) => {
      const response = await fetch('/api/phase3-labs/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ labId })
      });
      return response.json();
    },
    {
      onSuccess: (data) => {
        if (data.success) {
          setCurrentSession(data.data);
          setActiveTab('topology');
        }
      }
    }
  );

  // Resume lab mutation
  const resumeLabMutation = useMutation(
    async (sessionId) => {
      const response = await fetch(`/api/phase3-labs/resume/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    {
      onSuccess: (data) => {
        if (data.success) {
          setCurrentSession(data.data);
          setActiveTab('topology');
        }
      }
    }
  );

  // Pause lab mutation
  const pauseLabMutation = useMutation(
    async (sessionId) => {
      const response = await fetch(`/api/phase3-labs/pause/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    }
  );

  // Validate lab mutation
  const validateLabMutation = useMutation(
    async (sessionId) => {
      const response = await fetch(`/api/phase3-labs/validate/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    {
      onSuccess: (data) => {
        if (data.success) {
          setValidationResults(data.data);
        }
      }
    }
  );

  // Get session status
  const { data: sessionStatus, refetch: refetchSession } = useQuery(
    ['phase3-session', currentSession?.sessionId],
    async () => {
      if (!currentSession?.sessionId) return null;
      const response = await fetch(`/api/phase3-labs/session/${currentSession.sessionId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    {
      enabled: !!currentSession?.sessionId,
      refetchInterval: 5000 // Poll every 5 seconds
    }
  );

  // Get monitoring data
  const { data: monitoring, refetch: refetchMonitoring } = useQuery(
    ['phase3-monitoring', currentSession?.sessionId],
    async () => {
      if (!currentSession?.sessionId) return null;
      const response = await fetch(`/api/phase3-labs/monitor/${currentSession.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    {
      enabled: !!currentSession?.sessionId,
      refetchInterval: 3000 // Poll every 3 seconds
    }
  );

  // Get hints
  const { data: hints } = useQuery(
    ['phase3-hints', currentSession?.sessionId],
    async () => {
      if (!currentSession?.sessionId) return [];
      const response = await fetch(`/api/phase3-labs/hints/${currentSession.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return data.success ? data.data : [];
    },
    {
      enabled: !!currentSession?.sessionId && showHints
    }
  );

  // Handle device selection for multi-terminal
  const handleDeviceClick = useCallback((deviceId) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId);
      } else {
        newSet.add(deviceId);
      }
      return newSet;
    });
  }, []);

  // Handle lab start
  const handleStartLab = () => {
    startLabMutation.mutate(labId);
  };

  // Handle lab pause
  const handlePauseLab = () => {
    if (currentSession) {
      pauseLabMutation.mutate(currentSession.sessionId);
    }
  };

  // Handle validation
  const handleValidateLab = () => {
    if (currentSession) {
      validateLabMutation.mutate(currentSession.sessionId);
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!sessionStatus?.data?.progress) return 0;
    const { completedTasks, overallScore, maxScore } = sessionStatus.data.progress;
    const taskProgress = (completedTasks.length / labConfig.tasks.length) * 100;
    const scoreProgress = maxScore > 0 ? (overallScore / maxScore) * 100 : 0;
    return Math.round((taskProgress + scoreProgress) / 2);
  };

  // Render lab overview
  const renderOverview = () => (
    <div className="lab-overview">
      <div className="overview-header">
        <h2>{labConfig.title}</h2>
        <div className="overview-meta">
          <span className="difficulty">{labConfig.difficulty}</span>
          <span className="duration">{labConfig.duration} min</span>
          <span className="max-score">Max: {labConfig.maxScore} points</span>
        </div>
      </div>

      <div className="overview-content">
        <div className="description">
          <h3>Description</h3>
          <p>{labConfig.description}</p>
        </div>

        <div className="objectives">
          <h3>Learning Objectives</h3>
          <ul>
            {labConfig.objectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>

        <div className="prerequisites">
          <h3>Prerequisites</h3>
          <ul>
            {labConfig.prerequisites.map((prereq, index) => (
              <li key={index}>{prereq}</li>
            ))}
          </ul>
        </div>

        {currentSession && (
          <div className="session-progress">
            <h3>Current Progress</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <div className="progress-stats">
              <span>Score: {sessionStatus.data.progress.overallScore}/{labConfig.maxScore}</span>
              <span>Tasks: {sessionStatus.data.progress.completedTasks.length}/{labConfig.tasks.length}</span>
              <span>Time: {Math.round(sessionStatus.data.progress.timeSpent)} min</span>
            </div>
          </div>
        )}
      </div>

      <div className="overview-actions">
        {!currentSession ? (
          <button 
            onClick={handleStartLab}
            className="btn btn-primary"
            disabled={startLabMutation.isLoading}
          >
            <PlayIcon className="w-4 h-4" />
            {startLabMutation.isLoading ? 'Starting...' : 'Start Lab'}
          </button>
        ) : (
          <div className="session-controls">
            <button 
              onClick={handlePauseLab}
              className="btn btn-secondary"
              disabled={pauseLabMutation.isLoading}
            >
              <PauseIcon className="w-4 h-4" />
              Pause
            </button>
            <button 
              onClick={handleValidateLab}
              className="btn btn-primary"
              disabled={validateLabMutation.isLoading}
            >
              <CheckCircleIcon className="w-4 h-4" />
              {validateLabMutation.isLoading ? 'Validating...' : 'Validate Lab'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render topology with enhanced interactions
  const renderTopology = () => (
    <div className="topology-section">
      <div className="topology-header">
        <h3>Network Topology</h3>
        <div className="topology-controls">
          <button 
            onClick={() => setShowHints(!showHints)}
            className={`btn ${showHints ? 'btn-primary' : 'btn-secondary'}`}
          >
            <LightBulbIcon className="w-4 h-4" />
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
        </div>
      </div>

      {currentSession && (
        <div className="topology-content">
          <TopologyBuilder
            labConfig={labConfig}
            onDeviceClick={handleDeviceClick}
            selectedDevices={Array.from(selectedDevices)}
            isLabRunning={currentSession.status === 'running'}
            deviceStates={monitoring?.data?.devices || {}}
          />
        </div>
      )}

      {showHints && hints && hints.length > 0 && (
        <div className="hints-panel">
          <h4>Available Hints</h4>
          <div className="hints-list">
            {hints.map((hint, index) => (
              <div key={index} className="hint-item">
                <LightBulbIcon className="w-4 h-4" />
                <span>Task {hint.taskId}: {hint.hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render multi-terminal interface
  const renderTerminals = () => (
    <div className="terminals-section">
      <div className="terminals-header">
        <h3>Device Terminals</h3>
        <div className="device-selector">
          {labConfig.topology.devices.map(device => (
            <button
              key={device.id}
              onClick={() => handleDeviceClick(device.id)}
              className={`device-btn ${selectedDevices.has(device.id) ? 'active' : ''}`}
            >
              <ComputerDesktopIcon className="w-4 h-4" />
              {device.id}
            </button>
          ))}
        </div>
      </div>

      <div className="terminals-grid">
        {Array.from(selectedDevices).map(deviceId => {
          const device = labConfig.topology.devices.find(d => d.id === deviceId);
          return (
            <div key={deviceId} className="terminal-panel">
              <div className="terminal-header">
                <h4>{deviceId} Terminal</h4>
                <button 
                  onClick={() => handleDeviceClick(deviceId)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <SimpleTerminal
                deviceId={deviceId}
                sessionId={currentSession?.sessionId}
                isConnected={currentSession?.status === 'running'}
              />
            </div>
          );
        })}
      </div>

      {selectedDevices.size === 0 && (
        <div className="no-terminals">
          <ComputerDesktopIcon className="w-12 h-12 text-gray-400" />
          <p>Select devices above to open their terminals</p>
        </div>
      )}
    </div>
  );

  // Render monitoring dashboard
  const renderMonitoring = () => (
    <div className="monitoring-section">
      <div className="monitoring-header">
        <h3>Device Monitoring</h3>
        <div className="monitoring-time">
          <ClockIcon className="w-4 h-4" />
          Last updated: {monitoring?.data?.timestamp ? new Date(monitoring.data.timestamp).toLocaleTimeString() : 'N/A'}
        </div>
      </div>

      {monitoring?.data?.devices ? (
        <div className="devices-grid">
          {Object.entries(monitoring.data.devices).map(([deviceId, deviceData]) => (
            <div key={deviceId} className="device-card">
              <div className="device-header">
                <h4>{deviceId}</h4>
                <span className={`status ${deviceData.status || 'unknown'}`}>
                  {deviceData.status || 'Unknown'}
                </span>
              </div>

              {deviceData.routing && (
                <div className="routing-info">
                  <h5>Routing</h5>
                  <div className="routing-stats">
                    <span>Routes: {deviceData.routing.routeCount || 0}</span>
                    <span>OSPF Neighbors: {deviceData.ospfNeighbors?.split('\n').filter(line => line.includes('Full')).length || 0}</span>
                  </div>
                </div>
              )}

              {deviceData.interfaces && (
                <div className="interfaces-info">
                  <h5>Interfaces</h5>
                  <div className="interfaces-list">
                    {deviceData.interfaces.addresses?.split('\n').slice(1, 4).map((line, index) => (
                      <div key={index} className="interface-item">
                        {line.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-monitoring">
          <ChartBarIcon className="w-12 h-12 text-gray-400" />
          <p>No monitoring data available</p>
        </div>
      )}
    </div>
  );

  // Render validation results
  const renderValidation = () => (
    <div className="validation-section">
      <div className="validation-header">
        <h3>Lab Validation Results</h3>
        <button 
          onClick={handleValidateLab}
          className="btn btn-primary"
          disabled={validateLabMutation.isLoading}
        >
          <CheckCircleIcon className="w-4 h-4" />
          Re-run Validation
        </button>
      </div>

      {validationResults ? (
        <div className="validation-results">
          <div className="overall-score">
            <h4>Overall Score: {validationResults.overallScore}%</h4>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${validationResults.overallScore}%` }}
              />
            </div>
          </div>

          <div className="task-results">
            <h4>Task Results</h4>
            {validationResults.tasks.map(task => (
              <div key={task.taskId} className={`task-result ${task.completed ? 'completed' : 'incomplete'}`}>
                <div className="task-header">
                  <span className="task-title">{task.title}</span>
                  <span className="task-score">{task.score}/{task.maxScore}</span>
                  {task.completed && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                </div>
                
                {task.validations && (
                  <div className="validations-list">
                    {task.validations.map((validation, index) => (
                      <div key={index} className={`validation-item ${validation.passed ? 'passed' : 'failed'}`}>
                        <span className="validation-device">{validation.device}</span>
                        <span className="validation-rule">{validation.rule}</span>
                        <span className="validation-status">
                          {validation.passed ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-validation">
          <ExclamationCircleIcon className="w-12 h-12 text-gray-400" />
          <p>No validation results available. Click "Re-run Validation" to check your progress.</p>
        </div>
      )}
    </div>
  );

  if (!labConfig) {
    return <div className="loading">Loading lab configuration...</div>;
  }

  return (
    <div className="phase3-lab-interface">
      <div className="lab-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back to Labs
        </button>
        <h1>{labConfig.title}</h1>
        {currentSession && (
          <div className="session-info">
            <span className="session-id">Session: {currentSession.sessionId}</span>
            <span className={`session-status ${currentSession.status}`}>
              {currentSession.status}
            </span>
          </div>
        )}
      </div>

      <div className="lab-tabs">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('topology')}
          className={`tab ${activeTab === 'topology' ? 'active' : ''}`}
          disabled={!currentSession}
        >
          Topology
        </button>
        <button 
          onClick={() => setActiveTab('terminals')}
          className={`tab ${activeTab === 'terminals' ? 'active' : ''}`}
          disabled={!currentSession}
        >
          Terminals
        </button>
        <button 
          onClick={() => setActiveTab('monitoring')}
          className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          disabled={!currentSession}
        >
          Monitoring
        </button>
        <button 
          onClick={() => setActiveTab('validation')}
          className={`tab ${activeTab === 'validation' ? 'active' : ''}`}
          disabled={!currentSession}
        >
          Validation
        </button>
      </div>

      <div className="lab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'topology' && renderTopology()}
        {activeTab === 'terminals' && renderTerminals()}
        {activeTab === 'monitoring' && renderMonitoring()}
        {activeTab === 'validation' && renderValidation()}
      </div>
    </div>
  );
};

export default Phase3LabInterface;
