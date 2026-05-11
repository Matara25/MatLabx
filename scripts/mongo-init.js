// MongoDB initialization script for NetLabX
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('netlabx');

// Create application user
db.createUser({
  user: 'netlabx_user',
  pwd: 'netlabx_password',
  roles: [
    {
      role: 'readWrite',
      db: 'netlabx'
    }
  ]
});

// Create collections and indexes
print('Creating collections and indexes...');

// Users collection
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ 'profile.institution': 1 });

// Labs collection
db.createCollection('labs');
db.labs.createIndex({ category: 1, difficulty: 1 });
db.labs.createIndex({ tags: 1 });
db.labs.createIndex({ 'rating.average': -1 });
db.labs.createIndex({ createdBy: 1 });
db.labs.createIndex({ isActive: 1 });

// Progress collection
db.createCollection('progresses');
db.progresses.createIndex({ user: 1, lab: 1 }, { unique: true });
db.progresses.createIndex({ user: 1 });
db.progresses.createIndex({ lab: 1 });
db.progresses.createIndex({ status: 1 });
db.progresses.createIndex({ updatedAt: -1 });

// Insert sample data
print('Inserting sample data...');

// Admin user for demo
db.users.insertOne({
  username: 'admin',
  email: 'admin@matlabx.com',
  password: '$2a$12$9LhQdZvzZKZKZKZKZKZKZOzZKZKZKZKZKZKZKZKZKZKZKZKZKZKZKZ', // password: MatLabx@2026
  role: 'admin',
  profile: {
    firstName: 'System',
    lastName: 'Administrator',
    institution: 'NetLabX',
    experienceLevel: 'advanced'
  },
  stats: {
    labsCompleted: 0,
    totalLabTime: 0,
    averageScore: 0,
    skills: []
  },
  isVerified: true,
  hasCompletedOnboarding: true,
  verificationToken: null,
  verificationTokenExpires: null,
  skills: [],
  goals: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Sample labs
const sampleLabs = [
  {
    title: 'Basic Router Configuration',
    description: 'Learn the fundamentals of router configuration including basic IP addressing and interface setup.',
    category: 'routing',
    difficulty: 'beginner',
    duration: 30,
    objectives: [
      'Configure basic IP addressing on router interfaces',
      'Enable interfaces and verify connectivity',
      'Save configuration changes'
    ],
    prerequisites: ['Basic networking knowledge'],
    topology: {
      type: 'star',
      devices: [
        {
          id: 'router1',
          name: 'MainRouter',
          type: 'router',
          vendor: 'cisco',
          interfaces: [
            { name: 'GigabitEthernet0/0', ipAddress: '192.168.1.1', subnetMask: '255.255.255.0', status: 'up' },
            { name: 'GigabitEthernet0/1', ipAddress: '10.0.0.1', subnetMask: '255.255.255.0', status: 'down' }
          ],
          configuration: ''
        },
        {
          id: 'switch1',
          name: 'AccessSwitch',
          type: 'switch',
          vendor: 'generic',
          interfaces: [
            { name: 'FastEthernet0/1', ipAddress: '', subnetMask: '', status: 'up' },
            { name: 'FastEthernet0/2', ipAddress: '', subnetMask: '', status: 'up' }
          ],
          configuration: ''
        }
      ],
      connections: [
        {
          fromDevice: 'router1',
          fromInterface: 'GigabitEthernet0/1',
          toDevice: 'switch1',
          toInterface: 'FastEthernet0/1',
          bandwidth: 1000
        }
      ]
    },
    tasks: [
      {
        id: 'task1',
        title: 'Configure Interface IP Address',
        description: 'Configure the GigabitEthernet0/1 interface with IP address 10.0.0.1/24',
        type: 'configuration',
        points: 25,
        commands: [
          {
            command: 'show ip interface brief',
            expectedOutput: '10.0.0.1',
            validationType: 'contains'
          }
        ],
        hints: [
          { level: 1, text: 'Use the interface configuration mode' },
          { level: 2, text: 'Command: interface GigabitEthernet0/1' },
          { level: 3, text: 'Command: ip address 10.0.0.1 255.255.255.0' }
        ]
      },
      {
        id: 'task2',
        title: 'Enable the Interface',
        description: 'Enable the GigabitEthernet0/1 interface',
        type: 'configuration',
        points: 25,
        commands: [
          {
            command: 'show ip interface brief',
            expectedOutput: 'up',
            validationType: 'contains'
          }
        ],
        hints: [
          { level: 1, text: 'Interfaces need to be manually enabled' },
          { level: 2, text: 'Use the no shutdown command' },
          { level: 3, text: 'Command: no shutdown' }
        ]
      }
    ],
    faults: [],
    solution: {
      steps: [
        {
          step: 1,
          description: 'Enter global configuration mode',
          commands: ['configure terminal'],
          verification: 'Router# configure terminal'
        },
        {
          step: 2,
          description: 'Select the interface to configure',
          commands: ['interface GigabitEthernet0/1'],
          verification: 'Router(config-if)#'
        },
        {
          step: 3,
          description: 'Configure IP address and subnet mask',
          commands: ['ip address 10.0.0.1 255.255.255.0'],
          verification: 'IP address assigned'
        },
        {
          step: 4,
          description: 'Enable the interface',
          commands: ['no shutdown'],
          verification: 'Interface is now up'
        },
        {
          step: 5,
          description: 'Exit configuration mode',
          commands: ['end', 'write memory'],
          verification: 'Configuration saved'
        }
      ],
      explanation: 'This lab teaches basic router interface configuration including IP addressing and interface activation.'
    },
    isActive: true,
    createdBy: db.users.findOne({ username: 'instructor' })._id,
    tags: ['basic', 'router', 'configuration', 'cisco'],
    rating: { average: 4.5, count: 0 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: 'VLAN Configuration',
    description: 'Learn how to configure VLANs on a switch and implement basic network segmentation.',
    category: 'switching',
    difficulty: 'intermediate',
    duration: 45,
    objectives: [
      'Create multiple VLANs',
      'Assign switch ports to VLANs',
      'Verify VLAN configuration'
    ],
    prerequisites: ['Basic switch knowledge', 'Understanding of VLANs'],
    topology: {
      type: 'star',
      devices: [
        {
          id: 'switch1',
          name: 'CoreSwitch',
          type: 'switch',
          vendor: 'cisco',
          interfaces: [
            { name: 'FastEthernet0/1', ipAddress: '', subnetMask: '', status: 'up' },
            { name: 'FastEthernet0/2', ipAddress: '', subnetMask: '', status: 'up' },
            { name: 'FastEthernet0/3', ipAddress: '', subnetMask: '', status: 'up' }
          ],
          configuration: ''
        }
      ],
      connections: []
    },
    tasks: [
      {
        id: 'task1',
        title: 'Create VLAN 10',
        description: 'Create VLAN 10 named SALES',
        type: 'configuration',
        points: 30,
        commands: [
          {
            command: 'show vlan brief',
            expectedOutput: 'SALES',
            validationType: 'contains'
          }
        ],
        hints: [
          { level: 1, text: 'VLANs are created in global configuration mode' },
          { level: 2, text: 'Use the vlan command followed by the VLAN number' },
          { level: 3, text: 'Command: vlan 10, name SALES' }
        ]
      }
    ],
    faults: [],
    solution: {
      steps: [
        {
          step: 1,
          description: 'Enter global configuration mode',
          commands: ['configure terminal'],
          verification: 'Switch# configure terminal'
        },
        {
          step: 2,
          description: 'Create VLAN 10',
          commands: ['vlan 10', 'name SALES'],
          verification: 'VLAN 10 created'
        }
      ],
      explanation: 'This lab demonstrates VLAN creation and basic switch configuration.'
    },
    isActive: true,
    createdBy: db.users.findOne({ username: 'instructor' })._id,
    tags: ['vlan', 'switching', 'intermediate', 'cisco'],
    rating: { average: 4.0, count: 0 },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Insert sample labs
try {
  const instructorUser = db.users.findOne({ username: 'instructor' });
  if (instructorUser) {
    sampleLabs.forEach(lab => {
      lab.createdBy = instructorUser._id;
    });
    db.labs.insertMany(sampleLabs);
  }
} catch (error) {
  print('Error inserting labs:', error.message);
}

print('MongoDB initialization completed successfully!');
print('Admin user created:');
print('- admin@matlabx.com / MatLabx@2026');
