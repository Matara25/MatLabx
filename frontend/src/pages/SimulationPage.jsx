import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { 
  Cog6ToothIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ComputerDesktopIcon,
  ServerIcon,
  GlobeAltIcon,
  ArrowsRightLeftIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const SimulationPage = ({ socket }) => {
  const { labId } = useParams()
  const { user, getToken } = useAuth()
  const [activeDevice, setActiveDevice] = useState(null)
  const [terminalOutput, setTerminalOutput] = useState([])
  const [currentCommand, setCurrentCommand] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [hints, setHints] = useState([])
  const [currentHint, setCurrentHint] = useState(0)
  const [tasks, setTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState([])
  const [showTopology, setShowTopology] = useState(true)

  const terminalRef = useRef(null)
  const fitAddon = useRef(null)

  // Initialize terminal
  useEffect(() => {
    if (terminalRef.current) {
      const terminal = new Terminal()
      const fit = new FitAddon()
      
      terminal.loadAddon(fit)
      terminal.open(terminalRef.current)
      
      // Set terminal theme
      terminal.options.theme = {
        background: '#000000',
        foreground: '#00ff00',
        cursor: '#00ff00',
        selection: '#ffffff',
      }

      // Handle terminal data
      terminal.onData((data) => {
        // Handle terminal input/output
      })

      fitAddon.current = fit
      terminalRef.current = terminal
    }
  }, [])

  // Fetch lab data
  const { data: lab, isLoading } = useQuery(
    ['lab', labId],
    async () => {
      const response = await fetch(`/api/labs/${labId}`)
      return response.json()
    }
  )

  // Fetch simulation session
  const { data: session } = useQuery(
    ['simulation-session', labId],
    async () => {
      const response = await fetch(`/api/simulation/session/${labId}`)
      return response.json()
    }
  )

  // Execute command mutation
  const executeCommandMutation = useMutation(
    async ({ deviceId, command }) => {
      const response = await fetch('/api/simulation/execute/' + session?.id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ deviceId, command })
      })
      return response.json()
    },
    {
      onSuccess: (data) => {
        setTerminalOutput(prev => [...prev, {
          type: 'command',
          deviceId,
          command,
          output: data.data.result.output,
          timestamp: new Date(),
          success: data.data.result.success
        }])
        setCurrentCommand('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Command execution failed')
        setTerminalOutput(prev => [...prev, {
          type: 'error',
          deviceId,
          command,
          output: error.response?.data?.message || 'Command failed',
          timestamp: new Date(),
          success: false
        }])
      }
    }
  )

  // Start simulation mutation
  const startSimulationMutation = useMutation(
    async () => {
      const response = await fetch(`/api/simulation/start/${labId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        }
      })
      return response.json()
    },
    {
      onSuccess: () => {
        setIsRunning(true)
        toast.success('Simulation started successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to start simulation')
      }
    }
  )

  // Stop simulation mutation
  const stopSimulationMutation = useMutation(
    async () => {
      const response = await fetch(`/api/simulation/stop/${session?.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })
      return response.json()
    },
    {
      onSuccess: () => {
        setIsRunning(false)
        toast.success('Simulation stopped')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to stop simulation')
      }
    }
  )

  // Request hint mutation
  const requestHintMutation = useMutation(
    async ({ taskId, level }) => {
      const response = await fetch(`/api/simulation/hint/${session?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ taskId, level })
      })
      return response.json()
    },
    {
      onSuccess: (data) => {
        setHints(prev => [...prev, data.data.hint])
        setCurrentHint(prev => prev + 1)
        toast.success('Hint provided')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to get hint')
      }
    }
  )

  // Handle command submission
  const handleCommandSubmit = (e) => {
    e.preventDefault()
    if (!currentCommand.trim() || !activeDevice) return

    const command = currentCommand.trim()
    
    // Add to terminal output
    setTerminalOutput(prev => [...prev, {
      type: 'input',
      deviceId: activeDevice,
      command,
      timestamp: new Date(),
      success: true
    }])

    // Execute command
    executeCommandMutation.mutate({ deviceId: activeDevice, command })
  }

  // Get device icon
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'router': return GlobeAltIcon
      case 'switch': return ArrowsRightLeftIcon
      case 'server': return ServerIcon
      default: return ComputerDesktopIcon
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-dark-text">{lab?.title}</h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                isRunning ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'
              }`}>
                {isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTopology(!showTopology)}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  showTopology ? 'bg-primary-500 text-white' : 'bg-dark-card text-dark-text hover:bg-dark-hover'
                }`}
              >
                <ComputerDesktopIcon className="w-4 h-4" />
              </button>
              
              {isRunning ? (
                <button
                  onClick={() => stopSimulationMutation.mutate()}
                  disabled={stopSimulationMutation.isLoading}
                  className="p-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors duration-200 disabled:opacity-50"
                >
                  <StopIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => startSimulationMutation.mutate()}
                  disabled={startSimulationMutation.isLoading}
                  className="p-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors duration-200 disabled:opacity-50"
                >
                  <PlayIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-80 bg-dark-surface border-r border-dark-border overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-dark-text mb-4">Network Devices</h2>
            
            <div className="space-y-2">
              {lab?.topology?.devices?.map((device) => {
                const Icon = getDeviceIcon(device.type)
                return (
                  <button
                    key={device.id}
                    onClick={() => setActiveDevice(device.id)}
                    className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
                      activeDevice === device.id
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-dark-card border-dark-border text-dark-text hover:bg-dark-hover'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium">{device.name}</div>
                        <div className="text-xs text-dark-muted">{device.type}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Tasks Panel */}
            {tasks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-dark-text mb-3">Tasks</h3>
                <div className="space-y-2">
                  {tasks.map((task, index) => (
                    <div 
                      key={task.id}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        completedTasks.includes(task.id)
                          ? 'bg-success-100 border-success-200'
                          : 'bg-dark-card border-dark-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{task.title}</span>
                          {completedTasks.includes(task.id) && (
                            <CheckCircleIcon className="w-4 h-4 text-success-400" />
                          )}
                        </div>
                        <span className="text-xs text-dark-muted">{task.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Topology View */}
          {showTopology ? (
            <div className="flex-1 p-6 bg-dark-surface">
              <h2 className="text-xl font-semibold text-dark-text mb-4">Network Topology</h2>
              <div className="bg-dark-card rounded-xl border border-dark-border p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-dark-muted mb-4">Interactive topology visualization</div>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    {lab?.topology?.devices?.map((device) => {
                      const Icon = getDeviceIcon(device.type)
                      return (
                        <div key={device.id} className="bg-dark-surface p-4 rounded-lg border border-dark-border">
                          <Icon className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                          <div className="text-sm font-medium text-dark-text">{device.name}</div>
                          <div className="text-xs text-dark-muted">{device.type}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-xs text-dark-muted mt-4">
                    Connections and data flows would be visualized here
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Terminal View */
            <div className="flex-1 flex flex-col">
              {/* Device Header */}
              <div className="bg-dark-surface border-b border-dark-border px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {activeDevice && (
                      <>
                        {(() => {
                          const Icon = getDeviceIcon(
                            lab?.topology?.devices?.find(d => d.id === activeDevice)?.type
                          )
                          return <Icon className="w-5 h-5 text-primary-400" />
                        })()}
                        <span className="font-medium text-dark-text">
                          {lab?.topology?.devices?.find(d => d.id === activeDevice)?.name || 'Select Device'}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Hint Button */}
                  <button
                    onClick={() => {
                      if (activeDevice && tasks.length > 0) {
                        const firstIncompleteTask = tasks.find(t => !completedTasks.includes(t.id))
                        if (firstIncompleteTask) {
                          requestHintMutation.mutate({
                            taskId: firstIncompleteTask.id,
                            level: currentHint + 1
                          })
                        }
                      }
                    }}
                    disabled={!activeDevice || tasks.length === 0 || requestHintMutation.isLoading}
                    className="flex items-center space-x-2 px-3 py-2 bg-warning-500 text-white rounded-lg hover:bg-warning-600 transition-colors duration-200 disabled:opacity-50"
                  >
                    <LightBulbIcon className="w-4 h-4" />
                    <span>Get Hint</span>
                  </button>
                </div>
              </div>

              {/* Terminal */}
              <div className="flex-1 bg-black p-4">
                <div className="h-full flex flex-col">
                  {/* Terminal Output */}
                  <div className="flex-1 mb-2 overflow-y-auto bg-gray-900 rounded p-3 font-mono text-xs">
                    {terminalOutput.map((output, index) => (
                      <div key={index} className="mb-1">
                        <span className="text-gray-400">
                          [{output.timestamp.toLocaleTimeString()}] {output.deviceId}:
                        </span>
                        {output.type === 'input' ? (
                          <span className="text-green-400">{output.command}</span>
                        ) : output.type === 'error' ? (
                          <span className="text-red-400">{output.output}</span>
                        ) : (
                          <span className="text-white">{output.output}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Terminal Input */}
                  <div className="border-t border-gray-700">
                    <form onSubmit={handleCommandSubmit}>
                      <div className="flex items-center bg-gray-800">
                        <span className="text-green-400 px-3 py-2 font-mono text-sm">
                          {activeDevice ? `${activeDevice}> ` : 'device> '}
                        </span>
                        <input
                          type="text"
                          value={currentCommand}
                          onChange={(e) => setCurrentCommand(e.target.value)}
                          placeholder="Enter command..."
                          className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-sm placeholder-gray-500"
                          autoFocus
                        />
                      </div>
                    </form>
                  </div>

                  {/* xterm.js terminal */}
                  <div 
                    ref={terminalRef}
                    className="h-96 bg-black"
                    style={{ fontFamily: 'Consolas, Monaco, monospace' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimulationPage
