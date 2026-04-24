const Docker = require('dockerode');
const { logger } = require('../utils/logger');
const EventEmitter = require('events');

class NetworkSimulator extends EventEmitter {
  constructor() {
    super();
    this.docker = new Docker();
    this.containers = new Map();
    this.networks = new Map();
    this.activeSessions = new Map();
  }

  // Create a new network simulation session
  async createSession(labId, userId) {
    try {
      const sessionId = `${labId}_${userId}_${Date.now()}`;
      
      const session = {
        id: sessionId,
        labId,
        userId,
        containers: [],
        networks: [],
        status: 'initializing',
        createdAt: new Date()
      };

      this.activeSessions.set(sessionId, session);
      
      logger.info(`Created simulation session: ${sessionId}`);
      this.emit('sessionCreated', sessionId);
      
      return sessionId;
    } catch (error) {
      logger.error(`Error creating session: ${error.message}`);
      throw error;
    }
  }

  // Initialize network topology
  async initializeTopology(sessionId, topology) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      session.status = 'building';
      
      // Create Docker networks for each connection
      for (const connection of topology.connections) {
        const networkName = `net_${sessionId}_${connection.fromDevice}_${connection.toDevice}`;
        
        const network = await this.docker.createNetwork({
          Name: networkName,
          Driver: 'bridge',
          Internal: false,
          CheckDuplicate: true
        });

        session.networks.push({
          id: network.id,
          name: networkName,
          connection
        });

        this.networks.set(network.id, network);
      }

      // Create containers for devices
      for (const device of topology.devices) {
        const container = await this.createDeviceContainer(sessionId, device, topology.connections);
        
        session.containers.push({
          id: container.id,
          deviceId: device.id,
          name: device.name,
          type: device.type,
          vendor: device.vendor
        });

        this.containers.set(container.id, container);
      }

      // Connect containers to networks
      await this.connectDevicesToNetworks(sessionId, topology.connections);

      session.status = 'running';
      
      logger.info(`Initialized topology for session: ${sessionId}`);
      this.emit('topologyInitialized', sessionId);
      
      return true;
    } catch (error) {
      logger.error(`Error initializing topology: ${error.message}`);
      session.status = 'error';
      throw error;
    }
  }

  // Create a device container
  async createDeviceContainer(sessionId, device, connections) {
    try {
      let image = 'alpine:latest';
      
      // Select appropriate image based on device type and vendor
      switch (device.vendor) {
        case 'cisco':
          image = 'cisco/csr1000v:latest';
          break;
        case 'mikrotik':
          image = 'mikrotik/chr:latest';
          break;
        case 'juniper':
          image = 'juniper/vmx:latest';
          break;
        default:
          image = 'alpine:latest';
      }

      // Create container configuration
      const containerConfig = {
        Image: image,
        name: `device_${sessionId}_${device.id}`,
        Hostname: device.name,
        Tty: true,
        OpenStdin: true,
        StdinOnce: false,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        WorkingDir: '/',
        Env: [
          `DEVICE_ID=${device.id}`,
          `DEVICE_TYPE=${device.type}`,
          `DEVICE_VENDOR=${device.vendor}`
        ],
        HostConfig: {
          Privileged: true,
          NetworkMode: 'none', // We'll connect manually
          Capabilities: ['NET_ADMIN', 'SYS_ADMIN'],
          Binds: [
            `${__dirname}/../configs/${sessionId}:/etc/network/configs:rw`
          ]
        }
      };

      const container = await this.docker.createContainer(containerConfig);
      await container.start();

      // Wait for container to be ready
      await this.waitForContainer(container, 30);

      // Configure device interfaces
      await this.configureDeviceInterfaces(container, device);

      return container;
    } catch (error) {
      logger.error(`Error creating device container: ${error.message}`);
      throw error;
    }
  }

  // Connect devices to networks
  async connectDevicesToNetworks(sessionId, connections) {
    try {
      const session = this.activeSessions.get(sessionId);
      
      for (const connection of connections) {
        const network = session.networks.find(n => 
          n.connection.fromDevice === connection.fromDevice && 
          n.connection.toDevice === connection.toDevice
        );
        
        if (!network) continue;

        const fromContainer = session.containers.find(c => c.deviceId === connection.fromDevice);
        const toContainer = session.containers.find(c => c.deviceId === connection.toDevice);

        if (fromContainer && toContainer) {
          const fromDockerContainer = this.containers.get(fromContainer.id);
          const toDockerContainer = this.containers.get(toContainer.id);
          const dockerNetwork = this.networks.get(network.id);

          // Connect containers to network
          await fromDockerContainer.connect({
            Container: fromDockerContainer.id,
            EndpointConfig: {
              NetworkID: dockerNetwork.id,
              IPv4Address: this.generateIPAddress(connection.fromInterface)
            }
          });

          await toDockerContainer.connect({
            Container: toDockerContainer.id,
            EndpointConfig: {
              NetworkID: dockerNetwork.id,
              IPv4Address: this.generateIPAddress(connection.toInterface)
            }
          });
        }
      }
    } catch (error) {
      logger.error(`Error connecting devices to networks: ${error.message}`);
      throw error;
    }
  }

  // Execute command in device
  async executeCommand(sessionId, deviceId, command) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const containerInfo = session.containers.find(c => c.deviceId === deviceId);
      if (!containerInfo) {
        throw new Error('Device not found');
      }

      const container = this.containers.get(containerInfo.id);
      
      // Create exec instance
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', command],
        AttachStdout: true,
        AttachStderr: true,
        Tty: false
      });

      const stream = await exec.start();
      
      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      // Wait for command to complete
      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          stream.destroy();
          reject(new Error('Command timeout'));
        }, 30000);
      });

      const execInfo = await exec.inspect();
      
      logger.info(`Command executed in ${deviceId}: ${command}`);
      
      return {
        success: execInfo.ExitCode === 0,
        output: output.trim(),
        exitCode: execInfo.ExitCode
      };
    } catch (error) {
      logger.error(`Error executing command: ${error.message}`);
      return {
        success: false,
        output: `Error: ${error.message}`,
        exitCode: -1
      };
    }
  }

  // Inject fault into network
  async injectFault(sessionId, fault) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      let result = { success: false, message: '' };

      switch (fault.type) {
        case 'interface-down':
          result = await this.shutdownInterface(sessionId, fault.affectedDevice, fault.affectedInterface);
          break;
        case 'ip-conflict':
          result = await this.createIPConflict(sessionId, fault.affectedDevice, fault.affectedInterface);
          break;
        case 'routing-loop':
          result = await this.createRoutingLoop(sessionId, fault.affectedDevice);
          break;
        case 'misconfiguration':
          result = await this.misconfigureDevice(sessionId, fault.affectedDevice, fault.configuration);
          break;
        case 'bandwidth-limit':
          result = await this.limitBandwidth(sessionId, fault.affectedDevice, fault.affectedInterface, fault.limit);
          break;
        default:
          throw new Error(`Unknown fault type: ${fault.type}`);
      }

      logger.info(`Fault injected: ${fault.type} in ${fault.affectedDevice}`);
      this.emit('faultInjected', { sessionId, fault });
      
      return result;
    } catch (error) {
      logger.error(`Error injecting fault: ${error.message}`);
      throw error;
    }
  }

  // Get device status
  async getDeviceStatus(sessionId, deviceId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const containerInfo = session.containers.find(c => c.deviceId === deviceId);
      if (!containerInfo) {
        throw new Error('Device not found');
      }

      const container = this.containers.get(containerInfo.id);
      const containerInfoData = await container.inspect();

      // Get network interfaces status
      const interfaces = await this.getInterfaceStatus(container);

      return {
        deviceId,
        status: containerInfoData.State.Running ? 'running' : 'stopped',
        interfaces,
        uptime: containerInfoData.State.StartedAt
      };
    } catch (error) {
      logger.error(`Error getting device status: ${error.message}`);
      throw error;
    }
  }

  // Cleanup session
  async cleanupSession(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return;
      }

      // Stop and remove containers
      for (const containerInfo of session.containers) {
        try {
          const container = this.containers.get(containerInfo.id);
          if (container) {
            await container.stop({ t: 10 });
            await container.remove();
            this.containers.delete(containerInfo.id);
          }
        } catch (error) {
          logger.error(`Error removing container ${containerInfo.id}: ${error.message}`);
        }
      }

      // Remove networks
      for (const networkInfo of session.networks) {
        try {
          const network = this.networks.get(networkInfo.id);
          if (network) {
            await network.remove();
            this.networks.delete(networkInfo.id);
          }
        } catch (error) {
          logger.error(`Error removing network ${networkInfo.id}: ${error.message}`);
        }
      }

      this.activeSessions.delete(sessionId);
      
      logger.info(`Cleaned up session: ${sessionId}`);
      this.emit('sessionCleanedUp', sessionId);
    } catch (error) {
      logger.error(`Error cleaning up session: ${error.message}`);
      throw error;
    }
  }

  // Helper methods
  async waitForContainer(container, timeout = 30) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout * 1000) {
      const info = await container.inspect();
      if (info.State.Running) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Container not ready after ${timeout} seconds`);
  }

  async configureDeviceInterfaces(container, device) {
    // This would configure interfaces based on device type
    // Implementation would vary by vendor and device type
    logger.info(`Configuring interfaces for device: ${device.id}`);
  }

  generateIPAddress(interfaceName) {
    // Generate a unique IP address for the interface
    const subnet = '192.168.';
    const randomPart = Math.floor(Math.random() * 254) + 1;
    return `${subnet}${randomPart}.1/24`;
  }

  async getInterfaceStatus(container) {
    // Get network interface status
    const exec = await container.exec({
      Cmd: ['ip', 'link', 'show'],
      AttachStdout: true
    });

    const stream = await exec.start();
    let output = '';
    
    return new Promise((resolve) => {
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });
      
      stream.on('end', () => {
        // Parse interface information
        const interfaces = this.parseInterfaceOutput(output);
        resolve(interfaces);
      });
    });
  }

  parseInterfaceOutput(output) {
    // Parse ip link show output
    const interfaces = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const parts = line.split(':');
        if (parts.length >= 3) {
          interfaces.push({
            name: parts[1].trim(),
            status: line.includes('UP') ? 'up' : 'down'
          });
        }
      }
    }
    
    return interfaces;
  }

  async shutdownInterface(sessionId, deviceId, interfaceName) {
    const command = `ip link set ${interfaceName} down`;
    return await this.executeCommand(sessionId, deviceId, command);
  }

  async createIPConflict(sessionId, deviceId, interfaceName) {
    // Implementation for IP conflict simulation
    const command = `ip addr add 192.168.1.100/24 dev ${interfaceName}`;
    return await this.executeCommand(sessionId, deviceId, command);
  }

  async createRoutingLoop(sessionId, deviceId) {
    // Implementation for routing loop simulation
    const command = 'ip route add 10.0.0.0/24 via 192.168.1.1';
    return await this.executeCommand(sessionId, deviceId, command);
  }

  async misconfigureDevice(sessionId, deviceId, configuration) {
    // Implementation for device misconfiguration
    const command = configuration;
    return await this.executeCommand(sessionId, deviceId, command);
  }

  async limitBandwidth(sessionId, deviceId, interfaceName, limit) {
    // Implementation for bandwidth limiting
    const command = `tc qdisc add dev ${interfaceName} root tbf rate ${limit}kbit latency 50ms burst 1540`;
    return await this.executeCommand(sessionId, deviceId, command);
  }
}

module.exports = NetworkSimulator;
