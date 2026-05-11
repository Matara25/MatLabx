/**
 * ValidationEngine - Core system for automatic lab grading and validation
 * 
 * This engine:
 * - Runs validation commands on containers
 * - Inspects configurations
 * - Checks connectivity
 * - Verifies routing tables
 * - Assigns scores
 * - Provides intelligent hints
 */

const Docker = require('dockerode');
const docker = new Docker();

class ValidationEngine {
  constructor() {
    this.validationRules = {
      // OSPF validation rules
      ospf: {
        adjacency: {
          command: 'vtysh -c "show ip ospf neighbor"',
          expectedPattern: /Full|2Way/,
          checkFunction: this.checkOSPFAdjacency.bind(this)
        },
        routes: {
          command: 'vtysh -c "show ip route ospf"',
          expectedPattern: /O/,
          checkFunction: this.checkOSPFRoutes.bind(this)
        },
        routerId: {
          command: 'vtysh -c "show running-config | include router-id"',
          expectedPattern: /router-id\s+\d+\.\d+\.\d+\.\d+/,
          checkFunction: this.checkRouterId.bind(this)
        }
      },
      // Static routing validation rules
      static: {
        routes: {
          command: 'vtysh -c "show ip route static"',
          expectedPattern: /S/,
          checkFunction: this.checkStaticRoutes.bind(this)
        },
        connectivity: {
          command: 'ping -c 3 {target}',
          expectedPattern: /64 bytes/,
          checkFunction: this.checkConnectivity.bind(this)
        }
      },
      // Interface validation rules
      interfaces: {
        ipConfig: {
          command: 'ip addr show {interface}',
          expectedPattern: /inet\s+\d+\.\d+\.\d+\.\d+\/\d+/,
          checkFunction: this.checkInterfaceIP.bind(this)
        },
        status: {
          command: 'ip link show {interface}',
          expectedPattern: /UP/,
          checkFunction: this.checkInterfaceStatus.bind(this)
        }
      },
      // VLAN validation rules
      vlan: {
        config: {
          command: 'vtysh -c "show running-config | include vlan"',
          expectedPattern: /vlan\s+\d+/,
          checkFunction: this.checkVLANConfig.bind(this)
        },
        interfaces: {
          command: 'vtysh -c "show vlan brief"',
          expectedPattern: /{vlanId}/,
          checkFunction: this.checkVLANInterfaces.bind(this)
        }
      }
    };
  }

  /**
   * Main validation method - validates a complete lab
   */
  async validateLab(labSession, labDefinition) {
    const results = {
      sessionId: labSession.sessionId,
      labId: labDefinition.id,
      timestamp: new Date(),
      overallScore: 0,
      tasks: [],
      hints: [],
      deviceStates: {}
    };

    try {
      // Get current device states
      results.deviceStates = await this.getDeviceStates(labSession.devices);

      // Validate each task in the lab
      for (const task of labDefinition.tasks) {
        const taskResult = await this.validateTask(task, labSession);
        results.tasks.push(taskResult);
      }

      // Calculate overall score
      results.overallScore = this.calculateScore(results.tasks);

      // Generate hints for incomplete tasks
      results.hints = this.generateHints(results.tasks, labDefinition);

      return {
        success: true,
        data: results
      };

    } catch (error) {
      console.error('Validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate a specific task
   */
  async validateTask(task, labSession) {
    const taskResult = {
      taskId: task.id,
      title: task.title,
      completed: false,
      score: 0,
      maxScore: task.maxScore || 100,
      validations: [],
      hints: []
    };

    try {
      // Run each validation rule for this task
      for (const validation of task.validations) {
        const validationResult = await this.runValidation(validation, labSession);
        taskResult.validations.push(validationResult);
      }

      // Calculate task completion and score
      const completedValidations = taskResult.validations.filter(v => v.passed).length;
      const totalValidations = taskResult.validations.length;
      
      taskResult.completed = completedValidations === totalValidations;
      taskResult.score = totalValidations > 0 ? Math.round((completedValidations / totalValidations) * taskResult.maxScore) : 0;

    } catch (error) {
      taskResult.error = error.message;
    }

    return taskResult;
  }

  /**
   * Run a single validation rule
   */
  async runValidation(validation, labSession) {
    const result = {
      rule: validation.rule,
      device: validation.device,
      command: validation.command,
      passed: false,
      expected: validation.expected,
      actual: null,
      error: null
    };

    try {
      // Get the validation rule
      const rule = this.getValidationRule(validation.rule);
      if (!rule) {
        throw new Error(`Unknown validation rule: ${validation.rule}`);
      }

      // Execute the command on the specified device
      const containerName = this.getContainerName(validation.device, labSession.sessionId);
      const output = await this.executeCommand(containerName, validation.command);
      result.actual = output;

      // Check if the validation passed
      result.passed = rule.checkFunction(output, validation);

    } catch (error) {
      result.error = error.message;
    }

    return result;
  }

  /**
   * Execute a command in a container
   */
  async executeCommand(containerName, command) {
    try {
      const container = docker.getContainer(containerName);
      
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', command],
        AttachStdout: true,
        AttachStderr: true
      });

      const stream = await exec.start({});
      let output = '';

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => {
          output += chunk.toString();
        });

        stream.on('end', () => {
          resolve(output.trim());
        });

        stream.on('error', (error) => {
          reject(error);
        });
      });

    } catch (error) {
      throw new Error(`Failed to execute command "${command}" in container "${containerName}": ${error.message}`);
    }
  }

  /**
   * Get current device states
   */
  async getDeviceStates(devices) {
    const states = {};

    for (const device of devices) {
      try {
        const containerName = device.containerName;
        const container = docker.getContainer(containerName);
        const info = await container.inspect();
        
        states[device.id] = {
          containerName,
          status: info.State.Status,
          running: info.State.Running,
          networks: Object.keys(info.NetworkSettings.Networks || {}),
          created: info.Created,
          startedAt: info.State.StartedAt
        };
      } catch (error) {
        states[device.id] = {
          containerName: device.containerName,
          status: 'error',
          error: error.message
        };
      }
    }

    return states;
  }

  /**
   * Get validation rule by name
   */
  getValidationRule(ruleName) {
    const parts = ruleName.split('.');
    let rule = this.validationRules;
    
    for (const part of parts) {
      rule = rule[part];
      if (!rule) return null;
    }
    
    return rule;
  }

  /**
   * Get container name for a device
   */
  getContainerName(deviceId, sessionId) {
    return `${sessionId}_${deviceId}`;
  }

  /**
   * Calculate overall score
   */
  calculateScore(tasks) {
    if (tasks.length === 0) return 0;
    
    const totalScore = tasks.reduce((sum, task) => sum + task.score, 0);
    const maxPossibleScore = tasks.reduce((sum, task) => sum + task.maxScore, 0);
    
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Generate hints for incomplete tasks
   */
  generateHints(tasks, labDefinition) {
    const hints = [];

    for (const task of tasks) {
      if (!task.completed) {
        const taskDefinition = labDefinition.tasks.find(t => t.id === task.taskId);
        if (taskDefinition && taskDefinition.hints) {
          // Add relevant hints based on failed validations
          for (const validation of task.validations) {
            if (!validation.passed && taskDefinition.hints[validation.rule]) {
              hints.push({
                taskId: task.taskId,
                rule: validation.rule,
                hint: taskDefinition.hints[validation.rule],
                priority: 'medium'
              });
            }
          }
        }
      }
    }

    return hints;
  }

  // Validation check functions
  checkOSPFAdjacency(output, validation) {
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.match(validation.expectedPattern)) {
        return true;
      }
    }
    return false;
  }

  checkOSPFRoutes(output, validation) {
    return output.includes('O') && output.includes(validation.expected.network);
  }

  checkRouterId(output, validation) {
    return validation.expectedPattern.test(output);
  }

  checkStaticRoutes(output, validation) {
    return output.includes('S') && output.includes(validation.expected.network);
  }

  checkConnectivity(output, validation) {
    return output.includes('64 bytes') && !output.includes('100% packet loss');
  }

  checkInterfaceIP(output, validation) {
    return validation.expectedPattern.test(output);
  }

  checkInterfaceStatus(output, validation) {
    return output.includes('UP') && output.includes(validation.expected.interface);
  }

  checkVLANConfig(output, validation) {
    return output.includes(`vlan ${validation.expected.vlanId}`);
  }

  checkVLANInterfaces(output, validation) {
    return output.includes(validation.expected.vlanId);
  }

  /**
   * Get real-time device monitoring data
   */
  async getDeviceMonitoringData(labSession) {
    const monitoringData = {
      timestamp: new Date(),
      devices: {}
    };

    for (const device of labSession.devices) {
      try {
        const containerName = this.getContainerName(device.id, labSession.sessionId);
        
        // Get basic device info
        const deviceInfo = await this.getDeviceInfo(containerName);
        
        // Get routing information
        const routingInfo = await this.getRoutingInfo(containerName);
        
        // Get interface status
        const interfaceInfo = await this.getInterfaceInfo(containerName);
        
        monitoringData.devices[device.id] = {
          ...deviceInfo,
          routing: routingInfo,
          interfaces: interfaceInfo,
          lastUpdated: new Date()
        };

      } catch (error) {
        monitoringData.devices[device.id] = {
          error: error.message,
          status: 'offline'
        };
      }
    }

    return monitoringData;
  }

  async getDeviceInfo(containerName) {
    try {
      const uptime = await this.executeCommand(containerName, 'uptime');
      const processes = await this.executeCommand(containerName, 'ps aux | grep frr');
      
      return {
        uptime: uptime.trim(),
        frrRunning: processes.includes('frr'),
        status: 'online'
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async getRoutingInfo(containerName) {
    try {
      const routes = await this.executeCommand(containerName, 'vtysh -c "show ip route"');
      const ospfNeighbors = await this.executeCommand(containerName, 'vtysh -c "show ip ospf neighbor"');
      
      return {
        routes: routes.trim(),
        ospfNeighbors: ospfNeighbors.trim(),
        routeCount: (routes.match(/\n/g) || []).length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getInterfaceInfo(containerName) {
    try {
      const interfaces = await this.executeCommand(containerName, 'ip addr show');
      const linkStatus = await this.executeCommand(containerName, 'ip link show');
      
      return {
        addresses: interfaces.trim(),
        linkStatus: linkStatus.trim()
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = ValidationEngine;
