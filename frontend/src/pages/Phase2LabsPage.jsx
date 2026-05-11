import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  PlayIcon,
  StopIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import TopologyBuilder from '../components/TopologyBuilder';
import SimpleTerminal from '../components/SimpleTerminal';
import '../styles/Phase2Labs.css';

const Phase2LabsPage = () => {
  const [selectedLab, setSelectedLab] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Fetch predefined labs
  const { data: labs, isLoading, error } = useQuery(
    ['phase2-labs', searchTerm, selectedCategory, selectedDifficulty],
    async () => {
      const response = await fetch('/api/phase2-labs/predefined', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch labs');
      }
      return response.json();
    }
  );

  // Start lab mutation
  const startLabMutation = useMutation(
    async (labId) => {
      const response = await fetch('/api/phase2-labs/start', {
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
          setSelectedLab(data.data.labConfig);
        }
      }
    }
  );

  // Stop lab mutation
  const stopLabMutation = useMutation(
    async (sessionId) => {
      const response = await fetch(`/api/phase2-labs/stop/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    {
      onSuccess: () => {
        setCurrentSession(null);
        setSelectedDevice(null);
      }
    }
  );

  // Handle device selection
  const handleDeviceClick = (deviceId) => {
    setSelectedDevice(deviceId);
  };

  // Handle lab start
  const handleStartLab = () => {
    if (selectedLab) {
      startLabMutation.mutate(selectedLab.id);
    }
  };

  // Handle lab stop
  const handleStopLab = () => {
    if (currentSession) {
      stopLabMutation.mutate(currentSession.sessionId);
    }
  };

  // Filter labs
  const filteredLabs = labs?.data?.filter(lab => {
    const matchesSearch = lab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lab.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || lab.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || lab.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  }) || [];

  const categories = ['all', 'routing', 'switching', 'security', 'troubleshooting'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'routing': return 'text-blue-600 bg-blue-100';
      case 'switching': return 'text-purple-600 bg-purple-100';
      case 'security': return 'text-red-600 bg-red-100';
      case 'troubleshooting': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (selectedLab && currentSession) {
    return (
      <div className="phase2-lab-session">
        <div className="lab-session-header">
          <div className="lab-info">
            <h1>{selectedLab.title}</h1>
            <p>{selectedLab.description}</p>
            <div className="lab-status">
              <span className={`status ${currentSession.status}`}>
                {currentSession.status === 'running' ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Lab Running
                  </>
                ) : (
                  <>
                    <ExclamationCircleIcon className="w-5 h-5" />
                    {currentSession.status}
                  </>
                )}
              </span>
              <span className="session-id">Session: {currentSession.sessionId}</span>
            </div>
          </div>
          <div className="lab-controls">
            <button
              onClick={handleStopLab}
              disabled={stopLabMutation.isLoading}
              className="btn btn-danger"
            >
              <StopIcon className="w-4 h-4" />
              Stop Lab
            </button>
          </div>
        </div>

        <div className="lab-content">
          <div className="lab-topology">
            <TopologyBuilder
              labConfig={selectedLab}
              onDeviceClick={handleDeviceClick}
              onLabStart={handleStartLab}
              isLabRunning={currentSession.status === 'running'}
              selectedDevice={selectedDevice}
            />
          </div>

          <div className="lab-terminal">
            <div className="terminal-header">
              <h3>
                <ComputerDesktopIcon className="w-5 h-5" />
                Terminal - {selectedDevice || 'No device selected'}
              </h3>
              {selectedDevice && (
                <div className="device-status">
                  <span className="status-indicator running"></span>
                  Connected to {selectedDevice}
                </div>
              )}
            </div>
            
            {selectedDevice ? (
              <SimpleTerminal
                deviceId={selectedDevice}
                sessionId={currentSession.sessionId}
                isConnected={currentSession.status === 'running'}
              />
            ) : (
              <div className="terminal-placeholder">
                <div className="placeholder-content">
                  <ComputerDesktopIcon className="w-12 h-12 text-gray-400" />
                  <p>Select a device in the topology to open its terminal</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lab-objectives">
          <h3>Lab Objectives</h3>
          <ul>
            {selectedLab.objectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="phase2-labs">
      {/* Hero Section */}
      <div className="labs-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Phase 2 - Multi-Device Network Labs</h1>
            <p>Advanced labs with real network topologies and multiple devices</p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{labs?.data?.length || 0}</span>
                <span className="stat-label">Available Labs</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">3</span>
                <span className="stat-label">Lab Types</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">∞</span>
                <span className="stat-label">Scalable</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <ComputerDesktopIcon className="w-16 h-16 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="labs-filters">
        <div className="search-bar">
          <MagnifyingGlassIcon className="w-5 h-5" />
          <input
            type="text"
            placeholder="Search labs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Labs Grid */}
      <div className="labs-grid">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading labs...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <ExclamationCircleIcon className="w-12 h-12 text-red-400" />
            <h3>Error loading labs</h3>
            <p>Please try refreshing the page</p>
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="no-results">
            <BookOpenIcon className="w-12 h-12 text-gray-400" />
            <h3>No labs found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="labs-container">
            {filteredLabs.map((lab) => (
              <div key={lab.id} className="lab-card">
                <div className="lab-header">
                  <div className="lab-title">
                    <h3>{lab.title}</h3>
                    <div className="lab-meta">
                      <span className={`difficulty ${getDifficultyColor(lab.difficulty)}`}>
                        {lab.difficulty}
                      </span>
                      <span className={`category ${getCategoryColor(lab.category)}`}>
                        {lab.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lab-content">
                  <p className="lab-description">{lab.description}</p>
                  
                  <div className="lab-details">
                    <div className="detail-item">
                      <ClockIcon className="w-4 h-4" />
                      <span>{lab.duration} minutes</span>
                    </div>
                    <div className="detail-item">
                      <StarIcon className="w-4 h-4" />
                      <span>{lab.tasks?.length || 0} tasks</span>
                    </div>
                    <div className="detail-item">
                      <ComputerDesktopIcon className="w-4 h-4" />
                      <span>{lab.topology?.devices?.length || 0} devices</span>
                    </div>
                  </div>

                  <div className="lab-objectives-preview">
                    <h4>Learning Objectives:</h4>
                    <ul>
                      {lab.objectives.slice(0, 2).map((objective, index) => (
                        <li key={index}>{objective}</li>
                      ))}
                      {lab.objectives.length > 2 && (
                        <li className="more">+{lab.objectives.length - 2} more...</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="lab-actions">
                  <button
                    onClick={() => setSelectedLab(lab)}
                    className="btn btn-primary"
                  >
                    <PlayIcon className="w-4 h-4" />
                    Start Lab
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLab && !currentSession && (
        <div className="lab-preview-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedLab.title}</h2>
              <button
                onClick={() => setSelectedLab(null)}
                className="btn-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="lab-overview">
                <p>{selectedLab.description}</p>
                
                <div className="lab-meta">
                  <span className={`difficulty ${getDifficultyColor(selectedLab.difficulty)}`}>
                    {selectedLab.difficulty}
                  </span>
                  <span className={`category ${getCategoryColor(selectedLab.category)}`}>
                    {selectedLab.category}
                  </span>
                  <span className="duration">
                    <ClockIcon className="w-4 h-4" />
                    {selectedLab.duration} minutes
                  </span>
                </div>
              </div>

              <div className="lab-topology-preview">
                <h3>Network Topology</h3>
                <div className="topology-info">
                  <div className="device-count">
                    <span>{selectedLab.topology?.devices?.length || 0} Devices</span>
                  </div>
                  <div className="link-count">
                    <span>{selectedLab.topology?.links?.length || 0} Connections</span>
                  </div>
                </div>
              </div>

              <div className="lab-objectives">
                <h3>Learning Objectives</h3>
                <ul>
                  {selectedLab.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>

              <div className="lab-tasks">
                <h3>Lab Tasks</h3>
                <div className="tasks-list">
                  {selectedLab.tasks?.map((task, index) => (
                    <div key={task.id} className="task-item">
                      <div className="task-info">
                        <span className="task-number">{index + 1}</span>
                        <div className="task-content">
                          <h4>{task.title}</h4>
                          <p>{task.description}</p>
                        </div>
                      </div>
                      <div className="task-points">
                        {task.points} points
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setSelectedLab(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleStartLab}
                disabled={startLabMutation.isLoading}
                className="btn btn-primary"
              >
                <PlayIcon className="w-4 h-4" />
                {startLabMutation.isLoading ? 'Starting...' : 'Start Lab'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase2LabsPage;
