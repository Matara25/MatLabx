#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_CREDENTIALS = {
  email: 'admin@matlabx.com',
  password: 'MatLabx@2026'
};

class AdminUploader {
  constructor() {
    this.token = null;
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async login() {
    try {
      console.log('🔐 Logging in as admin...');
      const response = await this.client.post('/auth/login', ADMIN_CREDENTIALS);
      this.token = response.data.token;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      console.log('✅ Admin login successful');
      return true;
    } catch (error) {
      console.error('❌ Admin login failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async uploadCurriculum(filePath) {
    try {
      console.log(`📚 Uploading curriculum from: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const curriculumData = JSON.parse(data);

      const response = await this.client.post('/curriculum/batch', {
        curriculumData
      });

      const results = response.data.data;
      console.log(`✅ Curriculum upload completed:`);
      console.log(`   📊 Successful: ${results.successful.length}`);
      console.log(`   ❌ Failed: ${results.failed.length}`);
      console.log(`   📈 Total: ${results.total}`);

      if (results.successful.length > 0) {
        console.log('\n✅ Successfully uploaded:');
        results.successful.forEach(item => {
          console.log(`   - ${item.title}`);
        });
      }

      if (results.failed.length > 0) {
        console.log('\n❌ Failed uploads:');
        results.failed.forEach(item => {
          console.log(`   - ${item.title}: ${item.error}`);
        });
      }

      return results;
    } catch (error) {
      console.error('❌ Curriculum upload error:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  async uploadLabs(filePath) {
    try {
      console.log(`🔬 Uploading labs from: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const labsData = JSON.parse(data);

      const response = await this.client.post('/labs/batch', {
        labsData
      });

      const results = response.data.data;
      console.log(`✅ Labs upload completed:`);
      console.log(`   📊 Successful: ${results.successful.length}`);
      console.log(`   ❌ Failed: ${results.failed.length}`);
      console.log(`   📈 Total: ${results.total}`);

      if (results.successful.length > 0) {
        console.log('\n✅ Successfully uploaded:');
        results.successful.forEach(item => {
          console.log(`   - ${item.title}`);
        });
      }

      if (results.failed.length > 0) {
        console.log('\n❌ Failed uploads:');
        results.failed.forEach(item => {
          console.log(`   - ${item.title}: ${item.error}`);
        });
      }

      return results;
    } catch (error) {
      console.error('❌ Labs upload error:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  async uploadFolder(folderPath, type) {
    try {
      console.log(`📁 Processing folder: ${folderPath}`);
      
      if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder not found: ${folderPath}`);
      }

      const files = fs.readdirSync(folderPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        console.log('⚠️  No JSON files found in folder');
        return [];
      }

      console.log(`📄 Found ${jsonFiles.length} JSON files`);

      const allResults = [];
      
      for (const file of jsonFiles) {
        const filePath = path.join(folderPath, file);
        console.log(`\n📋 Processing: ${file}`);
        
        try {
          let result;
          if (type === 'curriculum') {
            result = await this.uploadCurriculum(filePath);
          } else if (type === 'labs') {
            result = await this.uploadLabs(filePath);
          } else {
            throw new Error('Invalid type. Use "curriculum" or "labs"');
          }
          
          allResults.push({
            file,
            result
          });
        } catch (error) {
          console.error(`❌ Failed to process ${file}:`, error.message);
          allResults.push({
            file,
            error: error.message
          });
        }
      }

      return allResults;
    } catch (error) {
      console.error('❌ Folder upload error:', error.message);
      throw error;
    }
  }

  async createSampleFiles(outputDir = './sample-uploads') {
    try {
      console.log(`📝 Creating sample files in: ${outputDir}`);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Sample curriculum
      const sampleCurriculum = [
        {
          title: "Network Fundamentals",
          description: "Introduction to computer networking concepts",
          category: "networking-fundamentals",
          level: "beginner",
          estimatedDuration: 480,
          tags: ["basics", "networking", "fundamentals"],
          modules: [
            {
              id: "module-1",
              title: "Introduction to Networks",
              description: "Basic networking concepts",
              order: 1,
              content: `# Introduction to Networks

## What is a Network?
A network is a collection of interconnected devices that can communicate with each other.

## Types of Networks
- **LAN**: Local Area Network
- **WAN**: Wide Area Network
- **MAN**: Metropolitan Area Network

## Network Components
- **Devices**: Computers, routers, switches
- **Media**: Cables, wireless signals
- **Services**: File sharing, printing, internet access`,

              type: "text",
              duration: 60,
              objectives: [
                "Understand basic network concepts",
                "Identify network types",
                "Learn network components"
              ],
              resources: [
                {
                  name: "Network Basics PDF",
                  url: "/downloads/network-basics.pdf",
                  type: "pdf"
                }
              ],
              isRequired: true
            },
            {
              id: "module-2",
              title: "OSI Model",
              description: "Understanding the 7-layer OSI model",
              order: 2,
              content: `# OSI Model

The OSI (Open Systems Interconnection) model is a conceptual framework for understanding network interactions.

## 7 Layers of OSI
1. **Physical Layer**: Bits and signals
2. **Data Link Layer**: Frames and MAC addresses
3. **Network Layer**: Packets and IP addresses
4. **Transport Layer**: Segments and ports
5. **Session Layer**: Sessions and dialogs
6. **Presentation Layer**: Data formatting and encryption
7. **Application Layer**: User applications and protocols`,

              type: "text",
              duration: 45,
              objectives: [
                "Explain each OSI layer",
                "Understand layer functions",
                "Identify protocols at each layer"
              ],
              resources: [],
              isRequired: true
            }
          ]
        }
      ];

      // Sample labs
      const sampleLabs = [
        {
          title: "Basic IP Configuration",
          description: "Configure IP addresses on network devices",
          category: "routing",
          difficulty: "beginner",
          duration: 30,
          objectives: [
            "Configure IP addresses",
            "Verify connectivity",
            "Understand subnetting"
          ],
          prerequisites: [
            "Basic networking knowledge"
          ],
          topology: {
            type: "star",
            devices: [
              {
                id: "router1",
                name: "Main Router",
                type: "router",
                vendor: "cisco",
                interfaces: [
                  {
                    name: "GigabitEthernet0/0",
                    ipAddress: "192.168.1.1",
                    subnetMask: "255.255.255.0",
                    status: "up"
                  }
                ],
                configuration: ""
              }
            ],
            connections: []
          },
          tasks: [
            {
              id: "task1",
              title: "Configure Interface",
              description: "Configure router interface with IP address",
              type: "configuration",
              points: 20,
              commands: [
                {
                  command: "show ip interface brief",
                  expectedOutput: "192.168.1.1",
                  validationType: "contains"
                }
              ],
              hints: [
                {
                  level: 1,
                  text: "Use interface configuration mode"
                }
              ]
            }
          ],
          faults: [],
          solution: {
            steps: [
              {
                step: 1,
                description: "Configure interface",
                commands: [
                  "configure terminal",
                  "interface GigabitEthernet0/0",
                  "ip address 192.168.1.1 255.255.255.0",
                  "no shutdown"
                ],
                verification: "Interface should be up with IP address"
              }
            ],
            explanation: "Basic IP configuration on router interface"
          },
          tags: ["ip", "configuration", "basic"],
          isActive: true
        }
      ];

      // Write sample files
      fs.writeFileSync(
        path.join(outputDir, 'sample-curriculum.json'),
        JSON.stringify(sampleCurriculum, null, 2)
      );

      fs.writeFileSync(
        path.join(outputDir, 'sample-labs.json'),
        JSON.stringify(sampleLabs, null, 2)
      );

      console.log('✅ Sample files created:');
      console.log(`   📚 ${path.join(outputDir, 'sample-curriculum.json')}`);
      console.log(`   🔬 ${path.join(outputDir, 'sample-labs.json')}`);
      
      return outputDir;
    } catch (error) {
      console.error('❌ Error creating sample files:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const uploader = new AdminUploader();

  if (args.length === 0) {
    console.log(`
🚀 Admin Batch Upload Tool

Usage:
  node admin-upload.js <command> [options]

Commands:
  curriculum <file>     Upload curriculum from JSON file
  labs <file>          Upload labs from JSON file
  curriculum-folder <dir>  Upload all JSON files from folder
  labs-folder <dir>         Upload all JSON files from folder
  create-samples [dir]     Create sample upload files
  help                    Show this help

Examples:
  node admin-upload.js curriculum ./data/curriculum.json
  node admin-upload.js labs ./data/labs.json
  node admin-upload.js curriculum-folder ./data/curriculum/
  node admin-upload.js labs-folder ./data/labs/
  node admin-upload.js create-samples ./sample-data/
`);
    return;
  }

  const command = args[0];
  const target = args[1];

  try {
    // Login first
    const loginSuccess = await uploader.login();
    if (!loginSuccess) {
      process.exit(1);
    }

    switch (command) {
      case 'curriculum':
        if (!target) {
          console.error('❌ Please provide a JSON file path');
          process.exit(1);
        }
        await uploader.uploadCurriculum(target);
        break;

      case 'labs':
        if (!target) {
          console.error('❌ Please provide a JSON file path');
          process.exit(1);
        }
        await uploader.uploadLabs(target);
        break;

      case 'curriculum-folder':
        if (!target) {
          console.error('❌ Please provide a folder path');
          process.exit(1);
        }
        await uploader.uploadFolder(target, 'curriculum');
        break;

      case 'labs-folder':
        if (!target) {
          console.error('❌ Please provide a folder path');
          process.exit(1);
        }
        await uploader.uploadFolder(target, 'labs');
        break;

      case 'create-samples':
        const outputDir = target || './sample-uploads';
        await uploader.createSampleFiles(outputDir);
        break;

      case 'help':
        console.log(`
🚀 Admin Batch Upload Tool

Commands:
  curriculum <file>     Upload curriculum from JSON file
  labs <file>          Upload labs from JSON file
  curriculum-folder <dir>  Upload all JSON files from folder
  labs-folder <dir>         Upload all JSON files from folder
  create-samples [dir]     Create sample upload files

File Format Examples:
  Curriculum: Array of curriculum objects with modules
  Labs: Array of lab objects with topology and tasks
        `);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Use "help" to see available commands');
        process.exit(1);
    }

    console.log('\n🎉 Upload process completed!');
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AdminUploader;
