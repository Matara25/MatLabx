const Docker = require('dockerode');
const { logger } = require('../utils/logger');
const EventEmitter = require('events');

class LabOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.docker = new Docker({
      socketPath: '//./pipe/docker_engine'
    });
    this.activeLabs = new Map(); // labId -> lab session
    this.labSessions = new Map(); // sessionId -> lab data
  }

  /**
   * Start a lab session with multi-device topology
   */
  async startLab(labId, userId, labConfig) {
    try {
      const sessionId = `${labId}_${userId}_${Date.now()}`;
      
      const labSession = {
        id: sessionId,
        labId,
        userId,
        topology: labConfig.topology,
        devices: new Map(),
        networks: new Map(),
        status: 'initializing',
        createdAt: new Date(),
        ipAddressing: new Map()
      };

      this.labSessions.set(sessionId, labSession);
      this.activeLabs.set(labId, sessionId);
      
      logger.info(`Starting lab session: ${sessionId}`);
      this.emit('labStarted', sessionId);
      
      // Create topology
      await this.createTopology(labSession);
      
      // Assign IP addresses
      await this.assignIPAddresses(labSession);
      
      // Update status
      labSession.status = 'running';
      this.emit('labReady', sessionId);
      
      return sessionId;
    } catch (error) {
      logger.error(`Error starting lab: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create multi-container topology
   */
  async createTopology(labSession) {
    const { topology } = labSession;
    
    // Step 1: Create containers for each device
    for (const device of topology.devices) {
      await this.createDeviceContainer(labSession, device);
    }
    
    // Step 2: Create networks and connect devices
    for (const link of topology.links) {
      await this.createNetworkLink(labSession, link);
    }
    
    logger.info(`Topology created for lab ${labSession.id}`);
  }

  /**
   * Create a device container
   */
  async createDeviceContainer(labSession, device) {
    try {
      const containerName = `${labSession.id}_${device.id}`;
      
      // Create container
      const container = await this.docker.createContainer({
        Image: 'matlabx-router:latest',
        name: containerName,
        Hostname: device.id,
        Cmd: ['/bin/sh', '-c', 'tail -f /dev/null'], // Keep container running
        Tty: true,
        OpenStdin: true,
        StdinOnce: false,
        WorkingDir: '/root',
        Env: [
          `DEVICE_ID=${device.id}`,
          `DEVICE_TYPE=${device.type}`,
          `LAB_SESSION=${labSession.id}`
        ],
        Labels: {
          'lab-session': labSession.id,
          'device-id': device.id,
          'device-type': device.type
        }
      });

      // Start container
      await container.start();
      
      // Store container reference
      labSession.devices.set(device.id, {
        container,
        device,
        status: 'running'
      });
      
      logger.info(`Created device container: ${containerName}`);
    } catch (error) {
      logger.error(`Error creating device ${device.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create network link between devices
   */
  async createNetworkLink(labSession, link) {
    try {
      const networkName = `${labSession.id}_net_${link.id}`;
      
      // Create Docker network
      const network = await this.docker.createNetwork({
        Name: networkName,
        Driver: 'bridge',
        Internal: false,
        Labels: {
          'lab-session': labSession.id,
          'link-id': link.id
        }
      });
      
      // Connect devices to network
      const device1 = labSession.devices.get(link.source);
      const device2 = labSession.devices.get(link.target);
      
      if (device1 && device2) {
        await network.connect({
          Container: device1.container.id,
          EndpointConfig: {
            NetworkID: network.id,
            Aliases: [`${link.source}-${link.id}`]
          }
        });
        
        await network.connect({
          Container: device2.container.id,
          EndpointConfig: {
            NetworkID: network.id,
            Aliases: [`${link.target}-${link.id}`]
          }
        });
      }
      
      // Store network reference
      labSession.networks.set(link.id, {
        network,
        link,
        devices: [link.source, link.target]
      });
      
      logger.info(`Created network link: ${networkName}`);
    } catch (error) {
      logger.error(`Error creating link ${link.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign IP addresses to device interfaces
   */
  async assignIPAddresses(labSession) {
    const { topology } = labSession;
    let ipCounter = 1;
    
    // Assign IP addresses for each link
    for (const link of topology.links) {
      const networkName = `${labSession.id}_net_${link.id}`;
      const subnet = `10.${ipCounter}.0.0/24`;
      
      // Assign IPs to devices on this link
      const sourceIP = `10.${ipCounter}.1.1`;
      const targetIP = `10.${ipCounter}.1.2`;
      
      // Configure network interfaces
      await this.configureDeviceInterface(labSession, link.source, link.id, sourceIP, '24');
      await this.configureDeviceInterface(labSession, link.target, link.id, targetIP, '24');
      
      // Store IP addressing info
      labSession.ipAddressing.set(`${link.source}-${link.id}`, {
        ip: sourceIP,
        subnet,
        network: networkName
      });
      
      labSession.ipAddressing.set(`${link.target}-${link.id}`, {
        ip: targetIP,
        subnet,
        network: networkName
      });
      
      ipCounter++;
    }
    
    logger.info(`IP addresses assigned for lab ${labSession.id}`);
  }

  /**
   * Configure device network interface
   */
  async configureDeviceInterface(labSession, deviceId, linkId, ipAddress, subnet) {
    try {
      const device = labSession.devices.get(deviceId);
      if (!device) return;
      
      // Find the interface name for this link
      const interfaceName = await this.getInterfaceName(device.container, linkId);
      
      // Configure IP address
      await this.executeCommand(device.container, `ip addr add ${ipAddress}/${subnet} dev ${interfaceName}`);
      await this.executeCommand(device.container, `ip link set ${interfaceName} up`);
      
      logger.info(`Configured ${deviceId} interface ${interfaceName} with IP ${ipAddress}`);
    } catch (error) {
      logger.error(`Error configuring interface for ${deviceId}: ${error.message}`);
    }
  }

  /**
   * Get interface name for a specific link
   */
  async getInterfaceName(container, linkId) {
    try {
      // List interfaces and find the one connected to this link's network
      const result = await this.executeCommand(container, 'ip link show');
      const interfaces = result.split('\n');
      
      // Skip lo and find the first available interface
      for (const line of interfaces) {
        const match = line.match(/^\d+:\s+(\w+):/);
        if (match && match[1] !== 'lo') {
          return match[1];
        }
      }
      
      return 'eth0'; // fallback
    } catch (error) {
      return 'eth0';
    }
  }

  /**
   * Execute command in container
   */
  async executeCommand(container, command) {
    try {
      const exec = await container.exec({
        Cmd: ['/bin/sh', '-c', command],
        AttachStdout: true,
        AttachStderr: true
      });
      
      const stream = await exec.start();
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
      logger.error(`Command execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Attach terminal to device container
   */
  async attachTerminal(sessionId, deviceId) {
    try {
      const labSession = this.labSessions.get(sessionId);
      if (!labSession) {
        throw new Error('Lab session not found');
      }
      
      const device = labSession.devices.get(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }
      
      // Create exec for terminal
      const exec = await device.container.exec({
        Cmd: ['/bin/bash'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true
      });
      
      const stream = await exec.start({
        hijack: true,
        stdin: true
      });
      
      logger.info(`Terminal attached to device ${deviceId} in session ${sessionId}`);
      
      return {
        exec,
        stream,
        device,
        sessionId
      };
    } catch (error) {
      logger.error(`Error attaching terminal: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop lab session
   */
  async stopLab(sessionId) {
    try {
      const labSession = this.labSessions.get(sessionId);
      if (!labSession) return;
      
      // Stop and remove containers
      for (const [deviceId, device] of labSession.devices) {
        try {
          await device.container.stop();
          await device.container.remove();
          logger.info(`Stopped device container: ${deviceId}`);
        } catch (error) {
          logger.error(`Error stopping device ${deviceId}: ${error.message}`);
        }
      }
      
      // Remove networks
      for (const [linkId, network] of labSession.networks) {
        try {
          await network.network.remove();
          logger.info(`Removed network: ${linkId}`);
        } catch (error) {
          logger.error(`Error removing network ${linkId}: ${error.message}`);
        }
      }
      
      // Clean up session
      this.labSessions.delete(sessionId);
      this.activeLabs.delete(labSession.labId);
      
      this.emit('labStopped', sessionId);
      logger.info(`Lab session stopped: ${sessionId}`);
    } catch (error) {
      logger.error(`Error stopping lab: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get lab session info
   */
  getLabSession(sessionId) {
    return this.labSessions.get(sessionId);
  }

  /**
   * Get all active labs
   */
  getActiveLabs() {
    return Array.from(this.labSessions.values());
  }
}

module.exports = LabOrchestrator;
