/**
 * Phase 3 Enhanced Lab Templates with Validation Rules
 * 
 * These labs include:
 * - Intelligent validation rules
 * - Automatic grading
 * - Hint system
 * - Progress tracking
 * - Real-time monitoring
 */

const phase3Labs = {
  // Enhanced OSPF Lab with validation
  'ospf-3routers-advanced': {
    id: 'ospf-3routers-advanced',
    title: 'Advanced OSPF Configuration',
    description: 'Configure OSPF routing protocol across three routers with automatic validation and real-time monitoring',
    category: 'routing',
    difficulty: 'intermediate',
    duration: 45,
    estimatedTime: 45,
    maxScore: 100,
    
    // Enhanced topology with monitoring
    topology: {
      devices: [
        {
          id: 'R1',
          type: 'router',
          image: 'matlabx-router:latest',
          interfaces: [
            { name: 'eth0', ip: '10.0.1.1/24', network: 'net-r1-r2' },
            { name: 'eth1', ip: '10.0.2.1/24', network: 'net-r1-r3' }
          ],
          role: 'backbone-router',
          monitoring: ['cpu', 'memory', 'ospf-neighbor', 'route-count']
        },
        {
          id: 'R2',
          type: 'router',
          image: 'matlabx-router:latest',
          interfaces: [
            { name: 'eth0', ip: '10.0.1.2/24', network: 'net-r1-r2' },
            { name: 'eth1', ip: '10.0.3.1/24', network: 'net-r2-r3' }
          ],
          role: 'transit-router',
          monitoring: ['cpu', 'memory', 'ospf-neighbor', 'route-count']
        },
        {
          id: 'R3',
          type: 'router',
          image: 'matlabx-router:latest',
          interfaces: [
            { name: 'eth0', ip: '10.0.2.2/24', network: 'net-r1-r3' },
            { name: 'eth1', ip: '10.0.3.2/24', network: 'net-r2-r3' }
          ],
          role: 'edge-router',
          monitoring: ['cpu', 'memory', 'ospf-neighbor', 'route-count']
        }
      ],
      links: [
        { id: 'link1', source: 'R1', target: 'R2', network: 'net-r1-r2' },
        { id: 'link2', source: 'R1', target: 'R3', network: 'net-r1-r3' },
        { id: 'link3', source: 'R2', target: 'R3', network: 'net-r2-r3' }
      ]
    },

    // Enhanced tasks with validation
    tasks: [
      {
        id: 'configure-router-ids',
        title: 'Configure Router IDs',
        description: 'Set unique router IDs for all three routers',
        maxScore: 25,
        order: 1,
        validations: [
          {
            rule: 'ospf.routerId',
            device: 'R1',
            command: 'vtysh -c "show running-config | include router-id"',
            expected: { routerId: '1.1.1.1' }
          },
          {
            rule: 'ospf.routerId',
            device: 'R2',
            command: 'vtysh -c "show running-config | include router-id"',
            expected: { routerId: '2.2.2.2' }
          },
          {
            rule: 'ospf.routerId',
            device: 'R3',
            command: 'vtysh -c "show running-config | include router-id"',
            expected: { routerId: '3.3.3.3' }
          }
        ],
        hints: {
          'ospf.routerId': 'Use the command: vtysh -c "router ospf" -c "router-id X.X.X.X" where X.X.X.X is a unique IP address for each router'
        }
      },
      {
        id: 'enable-ospf-process',
        title: 'Enable OSPF Process',
        description: 'Enable OSPF routing process on all routers',
        maxScore: 25,
        order: 2,
        validations: [
          {
            rule: 'ospf.process',
            device: 'R1',
            command: 'vtysh -c "show running-config | section router ospf"',
            expected: { processId: '1' }
          },
          {
            rule: 'ospf.process',
            device: 'R2',
            command: 'vtysh -c "show running-config | section router ospf"',
            expected: { processId: '1' }
          },
          {
            rule: 'ospf.process',
            device: 'R3',
            command: 'vtysh -c "show running-config | section router ospf"',
            expected: { processId: '1' }
          }
        ],
        hints: {
          'ospf.process': 'Use: vtysh -c "router ospf 1" to enable OSPF process 1 on each router'
        }
      },
      {
        id: 'advertise-networks',
        title: 'Advertise Networks',
        description: 'Configure OSPF to advertise all connected networks',
        maxScore: 25,
        order: 3,
        validations: [
          {
            rule: 'ospf.networks',
            device: 'R1',
            command: 'vtysh -c "show running-config | section router ospf"',
            expected: { networks: ['10.0.1.0/24', '10.0.2.0/24'] }
          },
          {
            rule: 'ospf.networks',
            device: 'R2',
            command: 'vtysh -c "show running-config | section router ospf"',
            expected: { networks: ['10.0.1.0/24', '10.0.3.0/24'] }
          },
          {
            rule: 'ospf.networks',
            device: 'R3',
            command: 'vtysh -c "show running-config | section router ospf"',
            expected: { networks: ['10.0.2.0/24', '10.0.3.0/24'] }
          }
        ],
        hints: {
          'ospf.networks': 'Use: vtysh -c "router ospf 1" -c "network X.X.X.0/24 area 0" for each connected network'
        }
      },
      {
        id: 'verify-adjacency',
        title: 'Verify OSPF Adjacency',
        description: 'Ensure all OSPF neighbor adjacencies are established',
        maxScore: 25,
        order: 4,
        validations: [
          {
            rule: 'ospf.adjacency',
            device: 'R1',
            command: 'vtysh -c "show ip ospf neighbor"',
            expected: { neighbors: 2, state: 'Full' }
          },
          {
            rule: 'ospf.adjacency',
            device: 'R2',
            command: 'vtysh -c "show ip ospf neighbor"',
            expected: { neighbors: 2, state: 'Full' }
          },
          {
            rule: 'ospf.adjacency',
            device: 'R3',
            command: 'vtysh -c "show ip ospf neighbor"',
            expected: { neighbors: 2, state: 'Full' }
          }
        ],
        hints: {
          'ospf.adjacency': 'Check OSPF neighbors with: vtysh -c "show ip ospf neighbor". If no neighbors appear, verify network statements and interface statuses.'
        }
      }
    ],

    // Learning objectives with detailed descriptions
    objectives: [
      'Understand OSPF router ID configuration',
      'Configure OSPF routing process',
      'Advertise networks in OSPF',
      'Verify OSPF neighbor adjacencies',
      'Troubleshoot OSPF connectivity issues'
    ],

    // Prerequisites
    prerequisites: [
      'Basic IP addressing knowledge',
      'Understanding of routing concepts',
      'Familiarity with CLI commands'
    ],

    // Success criteria
    successCriteria: {
      minScore: 80,
      requiredTasks: ['configure-router-ids', 'enable-ospf-process', 'advertise-networks', 'verify-adjacency'],
      timeLimit: 60 // minutes
    },

    // Real-time monitoring configuration
    monitoring: {
      interval: 5000, // 5 seconds
      metrics: ['cpu', 'memory', 'ospf-neighbor', 'route-count', 'interface-status'],
      alerts: {
        'ospf-neighbor-down': {
          condition: 'ospf-neighbor-count < expected',
          message: 'OSPF neighbor adjacency lost',
          severity: 'warning'
        },
        'high-cpu': {
          condition: 'cpu-usage > 80',
          message: 'High CPU usage detected',
          severity: 'warning'
        }
      }
    }
  },

  // Enhanced Static Routing Lab
  'static-routing-advanced': {
    id: 'static-routing-advanced',
    title: 'Advanced Static Routing',
    description: 'Configure static routes with validation and automatic verification',
    category: 'routing',
    difficulty: 'beginner',
    duration: 30,
    estimatedTime: 30,
    maxScore: 100,
    
    topology: {
      devices: [
        {
          id: 'R1',
          type: 'router',
          image: 'matlabx-router:latest',
          interfaces: [
            { name: 'eth0', ip: '192.168.1.1/24', network: 'net-r1-r2' },
            { name: 'eth1', ip: '10.1.1.1/24', network: 'net-r1-lan1' }
          ],
          role: 'edge-router',
          monitoring: ['cpu', 'memory', 'route-count']
        },
        {
          id: 'R2',
          type: 'router',
          image: 'matlabx-router:latest',
          interfaces: [
            { name: 'eth0', ip: '192.168.1.2/24', network: 'net-r1-r2' },
            { name: 'eth1', ip: '10.2.1.1/24', network: 'net-r2-lan2' }
          ],
          role: 'core-router',
          monitoring: ['cpu', 'memory', 'route-count']
        }
      ],
      links: [
        { id: 'link1', source: 'R1', target: 'R2', network: 'net-r1-r2' }
      ]
    },

    tasks: [
      {
        id: 'configure-static-routes',
        title: 'Configure Static Routes',
        description: 'Configure static routes for full network connectivity',
        maxScore: 50,
        order: 1,
        validations: [
          {
            rule: 'static.routes',
            device: 'R1',
            command: 'vtysh -c "show ip route static"',
            expected: { routes: ['10.2.1.0/24 via 192.168.1.2'] }
          },
          {
            rule: 'static.routes',
            device: 'R2',
            command: 'vtysh -c "show ip route static"',
            expected: { routes: ['10.1.1.0/24 via 192.168.1.1'] }
          }
        ],
        hints: {
          'static.routes': 'Use: vtysh -c "ip route X.X.X.0/24 Y.Y.Y.Y" where X.X.X.0 is the destination network and Y.Y.Y.Y is the next hop'
        }
      },
      {
        id: 'verify-connectivity',
        title: 'Verify End-to-End Connectivity',
        description: 'Test connectivity between all networks',
        maxScore: 50,
        order: 2,
        validations: [
          {
            rule: 'static.connectivity',
            device: 'R1',
            command: 'ping -c 3 10.2.1.1',
            expected: { target: '10.2.1.1', success: true }
          },
          {
            rule: 'static.connectivity',
            device: 'R2',
            command: 'ping -c 3 10.1.1.1',
            expected: { target: '10.1.1.1', success: true }
          }
        ],
        hints: {
          'static.connectivity': 'Use ping to test connectivity: ping -c 3 <destination-ip>. If ping fails, check static routes and interface configurations.'
        }
      }
    ],

    objectives: [
      'Understand static routing concepts',
      'Configure static routes',
      'Verify network connectivity',
      'Troubleshoot routing issues'
    ],

    prerequisites: [
      'Basic IP addressing knowledge',
      'Understanding of routing fundamentals'
    ],

    successCriteria: {
      minScore: 80,
      requiredTasks: ['configure-static-routes', 'verify-connectivity'],
      timeLimit: 45
    },

    monitoring: {
      interval: 10000,
      metrics: ['cpu', 'memory', 'route-count', 'ping-status'],
      alerts: {
        'route-missing': {
          condition: 'static-route-count < expected',
          message: 'Expected static routes not configured',
          severity: 'error'
        }
      }
    }
  },

  // Enhanced VLAN Lab
  'vlan-advanced': {
    id: 'vlan-advanced',
    title: 'Advanced VLAN Configuration',
    description: 'Configure VLANs with trunking and verification',
    category: 'switching',
    difficulty: 'intermediate',
    duration: 40,
    estimatedTime: 40,
    maxScore: 100,
    
    topology: {
      devices: [
        {
          id: 'SW1',
          type: 'switch',
          image: 'matlabx-router:latest',
          interfaces: [
            { name: 'eth1', ip: '192.168.1.1/24', role: 'management' },
            { name: 'eth2', role: 'access', vlan: 10 },
            { name: 'eth3', role: 'access', vlan: 20 },
            { name: 'eth4', role: 'trunk', vlans: [10, 20] }
          ],
          role: 'core-switch',
          monitoring: ['cpu', 'memory', 'vlan-status', 'interface-status']
        },
        {
          id: 'PC1',
          type: 'host',
          image: 'matlabx-router:latest',
          interfaces: [
            { name: 'eth0', ip: '192.168.10.10/24', vlan: 10 }
          ],
          role: 'vlan10-host',
          monitoring: ['cpu', 'memory', 'ping-status']
        },
        {
          id: 'PC2',
          type: 'host',
          image: 'matlabx-router:latest',
          interfaces: [
            { name: 'eth0', ip: '192.168.20.10/24', vlan: 20 }
          ],
          role: 'vlan20-host',
          monitoring: ['cpu', 'memory', 'ping-status']
        }
      ],
      links: [
        { id: 'link1', source: 'SW1', target: 'PC1', network: 'vlan10-net' },
        { id: 'link2', source: 'SW1', target: 'PC2', network: 'vlan20-net' }
      ]
    },

    tasks: [
      {
        id: 'create-vlans',
        title: 'Create VLANs',
        description: 'Create VLAN 10 and VLAN 20 on the switch',
        maxScore: 33,
        order: 1,
        validations: [
          {
            rule: 'vlan.config',
            device: 'SW1',
            command: 'vtysh -c "show vlan brief"',
            expected: { vlans: [10, 20] }
          }
        ],
        hints: {
          'vlan.config': 'Use: vtysh -c "conf t" -c "vlan X" -c "name VLAN_NAME" -c "exit" where X is the VLAN number'
        }
      },
      {
        id: 'assign-interfaces',
        title: 'Assign Interfaces to VLANs',
        description: 'Configure access ports for VLAN membership',
        maxScore: 33,
        order: 2,
        validations: [
          {
            rule: 'vlan.interfaces',
            device: 'SW1',
            command: 'vtysh -c "show running-config | include switchport access vlan"',
            expected: { assignments: { 'eth2': 10, 'eth3': 20 } }
          }
        ],
        hints: {
          'vlan.interfaces': 'Use: vtysh -c "conf t" -c "interface ethX" -c "switchport mode access" -c "switchport access vlan Y"'
        }
      },
      {
        id: 'verify-vlan-isolation',
        title: 'Verify VLAN Isolation',
        description: 'Test that VLANs are properly isolated',
        maxScore: 34,
        order: 3,
        validations: [
          {
            rule: 'vlan.isolation',
            device: 'PC1',
            command: 'ping -c 3 192.168.20.10',
            expected: { shouldFail: true }
          },
          {
            rule: 'vlan.isolation',
            device: 'PC2',
            command: 'ping -c 3 192.168.10.10',
            expected: { shouldFail: true }
          }
        ],
        hints: {
          'vlan.isolation': 'VLANs should not be able to communicate directly. If ping succeeds, VLAN isolation is not working properly.'
        }
      }
    ],

    objectives: [
      'Understand VLAN concepts',
      'Create and configure VLANs',
      'Assign interfaces to VLANs',
      'Verify VLAN isolation',
      'Troubleshoot VLAN issues'
    ],

    prerequisites: [
      'Basic switching knowledge',
      'Understanding of VLAN concepts',
      'CLI configuration experience'
    ],

    successCriteria: {
      minScore: 80,
      requiredTasks: ['create-vlans', 'assign-interfaces', 'verify-vlan-isolation'],
      timeLimit: 60
    },

    monitoring: {
      interval: 8000,
      metrics: ['cpu', 'memory', 'vlan-status', 'interface-status', 'ping-status'],
      alerts: {
        'vlan-missing': {
          condition: 'vlan-count < expected',
          message: 'Expected VLANs not configured',
          severity: 'error'
        }
      }
    }
  }
};

module.exports = phase3Labs;
