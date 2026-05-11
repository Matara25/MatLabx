const express = require('express');
const router = express.Router();
const Docker = require('dockerode');
const { protect } = require('../middleware/auth');

// Initialize Docker - configure for Windows Docker Desktop using named pipe
const docker = new Docker({
  socketPath: '//./pipe/docker_engine'
});

// Store test containers
const testContainers = new Map();

// Test connection to Docker
router.post('/test-connection', protect, async (req, res) => {
  try {
    // Test Docker connection
    await docker.ping();
    
    res.json({
      success: true,
      message: 'Docker connection successful'
    });
  } catch (error) {
    console.error('Docker connection failed:', error);
    res.status(500).json({
      success: false,
      message: 'Docker connection failed'
    });
  }
});

// Execute command in test container
router.post('/test-command', protect, async (req, res) => {
  try {
    const { deviceId, command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }

    // Get or create test container
    let container = testContainers.get(deviceId);
    
    if (!container) {
      // Create new container
      const containerConfig = {
        Image: 'matlabx-router:latest',
        name: `terminal-test-${deviceId}`,
        Cmd: ['/bin/bash'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        OpenStdin: true,
        StdinOnce: false,
        HostConfig: {
          Privileged: true,
          Capabilities: ['NET_ADMIN', 'SYS_ADMIN'],
          AutoRemove: false
        }
      };

      container = await docker.createContainer(containerConfig);
      await container.start();
      
      // Wait for container to be ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      testContainers.set(deviceId, container);
    }

    // Execute command
    const exec = await container.exec({
      Cmd: ['/bin/bash', '-c', command],
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
      
      // Timeout after 10 seconds
      setTimeout(() => {
        stream.destroy();
        reject(new Error('Command timeout'));
      }, 10000);
    });

    const execInfo = await exec.inspect();
    
    res.json({
      success: execInfo.ExitCode === 0,
      output: output.trim(),
      exitCode: execInfo.ExitCode
    });

  } catch (error) {
    console.error('Command execution failed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Cleanup test containers
router.post('/cleanup', protect, async (req, res) => {
  try {
    for (const [deviceId, container] of testContainers) {
      try {
        await container.stop({ t: 5 });
        await container.remove();
        console.log(`Cleaned up container for ${deviceId}`);
      } catch (error) {
        console.error(`Failed to cleanup container for ${deviceId}:`, error);
      }
    }
    
    testContainers.clear();
    
    res.json({
      success: true,
      message: 'Test containers cleaned up'
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get container status
router.get('/status', protect, async (req, res) => {
  try {
    const status = {};
    
    for (const [deviceId, container] of testContainers) {
      const info = await container.inspect();
      status[deviceId] = {
        id: container.id,
        status: info.State.Running ? 'running' : 'stopped',
        created: info.Created,
        startedAt: info.State.StartedAt
      };
    }
    
    res.json({
      success: true,
      containers: status
    });
  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
