/**
 * Predefined lab topologies for Phase 2
 * These are the labs students can access - no free topology creation yet
 */

const PREDEFINED_LABS = {
  // 2-Router Static Routing Lab
  'static-routing-2routers': {
    id: 'static-routing-2routers',
    title: 'Static Routing - 2 Routers',
    description: 'Configure static routes between two routers to enable connectivity',
    category: 'routing',
    difficulty: 'beginner',
    duration: 30,
    objectives: [
      'Configure IP addresses on router interfaces',
      'Set up static routes between routers',
      'Test connectivity with ping',
      'Verify routing tables'
    ],
    topology: {
      devices: [
        {
          id: 'R1',
          type: 'router',
          name: 'Router 1',
          image: 'matlabx-router:latest'
        },
        {
          id: 'R2',
          type: 'router', 
          name: 'Router 2',
          image: 'matlabx-router:latest'
        }
      ],
      links: [
        {
          id: 'link1',
          source: 'R1',
          target: 'R2',
          type: 'ethernet'
        }
      ]
    },
    tasks: [
      {
        id: 'task1',
        title: 'Configure IP Addresses',
        description: 'Configure IP addresses on both router interfaces',
        commands: [
          'configure terminal',
          'interface eth0',
          'ip address 10.1.1.1 255.255.255.0',
          'no shutdown',
          'exit'
        ],
        verification: {
          type: 'command',
          command: 'show ip interface brief',
          expected: '10.1.1.1'
        },
        points: 25
      },
      {
        id: 'task2',
        title: 'Configure Static Routes',
        description: 'Add static routes to enable connectivity',
        commands: [
          'ip route 10.1.1.0 255.255.255.0 eth0'
        ],
        verification: {
          type: 'command',
          command: 'show ip route',
          expected: '10.1.1.0'
        },
        points: 25
      },
      {
        id: 'task3',
        title: 'Test Connectivity',
        description: 'Test ping between routers',
        commands: [
          'ping 10.1.1.2'
        ],
        verification: {
          type: 'connectivity',
          target: '10.1.1.2',
          expected: 'success'
        },
        points: 25
      }
    ]
  },

  // 3-Router OSPF Lab
  'ospf-3routers': {
    id: 'ospf-3routers',
    title: 'OSPF Routing - 3 Routers',
    description: 'Configure OSPF routing protocol across three routers',
    category: 'routing',
    difficulty: 'intermediate',
    duration: 45,
    objectives: [
      'Configure OSPF on all routers',
      'Verify OSPF neighbor adjacencies',
      'Check OSPF routing tables',
      'Test end-to-end connectivity'
    ],
    topology: {
      devices: [
        {
          id: 'R1',
          type: 'router',
          name: 'Router 1',
          image: 'matlabx-router:latest'
        },
        {
          id: 'R2',
          type: 'router',
          name: 'Router 2', 
          image: 'matlabx-router:latest'
        },
        {
          id: 'R3',
          type: 'router',
          name: 'Router 3',
          image: 'matlabx-router:latest'
        }
      ],
      links: [
        {
          id: 'link1',
          source: 'R1',
          target: 'R2',
          type: 'ethernet'
        },
        {
          id: 'link2',
          source: 'R2',
          target: 'R3',
          type: 'ethernet'
        }
      ]
    },
    tasks: [
      {
        id: 'task1',
        title: 'Configure OSPF on R1',
        description: 'Enable OSPF routing on Router 1',
        commands: [
          'configure terminal',
          'router ospf',
          'network 10.1.1.0/24 area 0',
          'exit'
        ],
        verification: {
          type: 'command',
          command: 'show ip ospf neighbor',
          expected: 'Full'
        },
        points: 30
      },
      {
        id: 'task2',
        title: 'Configure OSPF on R2',
        description: 'Enable OSPF routing on Router 2',
        commands: [
          'configure terminal',
          'router ospf',
          'network 10.1.1.0/24 area 0',
          'network 10.2.1.0/24 area 0',
          'exit'
        ],
        verification: {
          type: 'command',
          command: 'show ip ospf neighbor',
          expected: 'Full'
        },
        points: 30
      },
      {
        id: 'task3',
        title: 'Configure OSPF on R3',
        description: 'Enable OSPF routing on Router 3',
        commands: [
          'configure terminal',
          'router ospf',
          'network 10.2.1.0/24 area 0',
          'exit'
        ],
        verification: {
          type: 'command',
          command: 'show ip ospf neighbor',
          expected: 'Full'
        },
        points: 30
      },
      {
        id: 'task4',
        title: 'Verify OSPF Routes',
        description: 'Check that OSPF routes are learned',
        commands: [
          'show ip route'
        ],
        verification: {
          type: 'command',
          command: 'show ip route',
          expected: 'O'
        },
        points: 10
      }
    ]
  },

  // Simple VLAN Lab
  'vlan-basic': {
    id: 'vlan-basic',
    title: 'Basic VLAN Configuration',
    description: 'Configure VLANs on a switch and test connectivity',
    category: 'switching',
    difficulty: 'intermediate',
    duration: 40,
    objectives: [
      'Create VLANs on the switch',
      'Assign ports to VLANs',
      'Configure trunk ports',
      'Test VLAN connectivity'
    ],
    topology: {
      devices: [
        {
          id: 'SW1',
          type: 'switch',
          name: 'Switch 1',
          image: 'matlabx-router:latest'
        },
        {
          id: 'PC1',
          type: 'host',
          name: 'PC 1',
          image: 'matlabx-router:latest'
        },
        {
          id: 'PC2',
          type: 'host',
          name: 'PC 2',
          image: 'matlabx-router:latest'
        }
      ],
      links: [
        {
          id: 'link1',
          source: 'PC1',
          target: 'SW1',
          type: 'ethernet'
        },
        {
          id: 'link2',
          source: 'PC2',
          target: 'SW1',
          type: 'ethernet'
        }
      ]
    },
    tasks: [
      {
        id: 'task1',
        title: 'Create VLANs',
        description: 'Create VLAN 10 and VLAN 20 on the switch',
        commands: [
          'configure terminal',
          'vlan 10',
          'name Sales',
          'exit',
          'vlan 20',
          'name Engineering',
          'exit'
        ],
        verification: {
          type: 'command',
          command: 'show vlan brief',
          expected: '10'
        },
        points: 25
      },
      {
        id: 'task2',
        title: 'Assign Ports to VLANs',
        description: 'Assign switch ports to appropriate VLANs',
        commands: [
          'interface eth0',
          'switchport mode access',
          'switchport access vlan 10',
          'exit',
          'interface eth1',
          'switchport mode access',
          'switchport access vlan 20',
          'exit'
        ],
        verification: {
          type: 'command',
          command: 'show vlan brief',
          expected: 'eth0'
        },
        points: 35
      },
      {
        id: 'task3',
        title: 'Test VLAN Connectivity',
        description: 'Test connectivity between devices in same VLAN',
        commands: [
          'ping 10.1.1.2'
        ],
        verification: {
          type: 'connectivity',
          target: '10.1.1.2',
          expected: 'success'
        },
        points: 40
      }
    ]
  }
};

module.exports = PREDEFINED_LABS;
