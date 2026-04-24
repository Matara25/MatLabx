# NetLabX: Intelligent Network Simulation and Training Platform

A comprehensive web-based platform for network training and simulation that provides interactive, scalable, and intelligent learning environments for networking students and professionals.

## Features

### Core Functionality
- **Interactive Network Labs**: Pre-configured real-world scenarios (Enterprise networks, ISP environments, Campus networks)
- **Real Device Configuration**: CLI-based interface supporting MikroTik, Cisco-like environments
- **Fault Injection & Troubleshooting**: Simulate real-world network failures
- **Intelligent Feedback System**: Real-time hints, error detection, and suggested corrections
- **Performance Analytics**: Track lab completion time, accuracy, and skill progression
- **Cloud-Based Access**: Browser-based access with no physical hardware requirements

### Technical Features
- **Docker-based Simulation**: Containerized network environments for realistic simulation
- **Real-time Collaboration**: Socket.IO for live lab sessions
- **Multi-vendor Support**: Cisco, MikroTik, Juniper, and generic device types
- **Progress Tracking**: Comprehensive user progress and skill assessment
- **Role-based Access**: Student, Instructor, and Admin roles with appropriate permissions

## Architecture

### Backend Stack
- **Node.js** with Express.js framework
- **MongoDB** for data persistence
- **Socket.IO** for real-time communication
- **Docker** for containerized network simulation
- **JWT** for authentication and authorization

### Frontend Stack (To be implemented)
- **React.js** or **Next.js**
- **TailwindCSS** for styling
- **Socket.IO client** for real-time updates

## Quick Start

### Prerequisites
- Node.js 16+ 
- Docker and Docker Compose
- MongoDB (or use the provided Docker setup)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd netlabx-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```

5. **Or start manually**
   ```bash
   # Start MongoDB
   mongod
   
   # Start the backend server
   npm run dev
   ```

### Default Users
After initial setup, these sample users are available:
- **Admin**: admin@netlabx.com / admin123
- **Instructor**: instructor@netlabx.com / instructor123  
- **Student**: student@netlabx.com / student123

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Lab Management Endpoints
- `GET /api/labs` - Get all labs (with filtering)
- `GET /api/labs/:id` - Get specific lab
- `POST /api/labs` - Create new lab (Instructor/Admin)
- `PUT /api/labs/:id` - Update lab (Instructor/Admin)
- `DELETE /api/labs/:id` - Delete lab (Instructor/Admin)

### Simulation Endpoints
- `POST /api/simulation/start/:labId` - Start lab simulation
- `POST /api/simulation/execute/:sessionId` - Execute command
- `GET /api/simulation/status/:sessionId/:deviceId` - Get device status
- `POST /api/simulation/complete-task/:sessionId` - Complete task
- `POST /api/simulation/hint/:sessionId` - Request hint
- `POST /api/simulation/stop/:sessionId` - Stop simulation

### User Progress Endpoints
- `GET /api/users/profile` - Get user profile with stats
- `GET /api/users/labs/history` - Get lab completion history
- `GET /api/users/achievements` - Get user achievements
- `GET /api/users/skills` - Get skill progression
- `GET /api/users/leaderboard` - Get leaderboard

## Docker Configuration

### Network Device Containers
The platform uses specialized Docker containers for different network device types:

- **Router Container**: Alpine Linux with routing protocols (Quagga, BIRD)
- **Switch Container**: Alpine Linux with Open vSwitch
- **Server Container**: Alpine Linux with web services

### Container Management
- Automatic container creation/destruction for lab sessions
- Network isolation using Docker networks
- Resource management and cleanup

## Database Schema

### Users Collection
- Authentication credentials
- Profile information
- Statistics and achievements
- Skill progression

### Labs Collection  
- Lab metadata and configuration
- Network topology definition
- Tasks and validation rules
- Fault injection scenarios

### Progress Collection
- User lab progress tracking
- Task completion status
- Performance metrics
- Command execution history

## Development

### Project Structure
```
netlabx-backend/
|-- models/                 # Mongoose models
|-- routes/                 # Express route handlers
|-- middleware/             # Custom middleware
|-- services/              # Business logic services
|-- docker/                # Docker configurations
|-- scripts/               # Database and setup scripts
|-- utils/                 # Utility functions
```

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- **AI-driven Lab Recommendations**: Machine learning for personalized learning paths
- **Multi-user Collaborative Labs**: Team-based learning scenarios
- **Advanced Security Simulations**: Complex cybersecurity scenarios
- **Integration with Certification Programs**: Official certification prep
- **Mobile Application**: Native mobile apps for iOS and Android

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

---

**NetLabX** - Transforming network education through intelligent simulation
