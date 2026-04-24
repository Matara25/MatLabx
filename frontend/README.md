# NetLabX Frontend

A modern, professional React frontend for the NetLabX Intelligent Network Simulation and Training Platform.

## Features Implemented

### 🎨 **Professional UI Design**
- **Modern Dark Theme**: Professional color scheme with primary (blue), secondary (cyan), accent (purple), success (green), warning (yellow), and error (red) colors
- **Glass Morphism Effects**: Translucent backgrounds with backdrop blur for modern aesthetics
- **Smooth Animations**: Hover effects, transitions, and micro-interactions
- **Responsive Design**: Mobile-first approach with breakpoints for all screen sizes

### 🔐 **User Authentication**
- **Login/Registration**: Modern forms with validation and error handling
- **Protected Routes**: Role-based access control (Student, Instructor, Admin)
- **JWT Integration**: Secure token-based authentication
- **Profile Management**: Complete user profile editing and password management

### 📚 **Lab Management**
- **Lab Catalog**: Browse, search, and filter network labs
- **Lab Details**: Comprehensive lab information with objectives and prerequisites
- **Difficulty Levels**: Visual indicators for beginner, intermediate, and advanced labs
- **Rating System**: User ratings and reviews for labs

### 🖥 **Network Simulation**
- **Interactive Terminal**: xterm.js-based terminal with command execution
- **Real-time Output**: Live command results and device status
- **Network Topology**: Visual representation of network devices
- **Multi-device Support**: Routers, switches, servers with different configurations
- **Hint System**: Progressive hint levels for task assistance

### 📊 **Dashboard & Analytics**
- **Progress Tracking**: Lab completion history and statistics
- **Skill Development**: Visual skill progression with levels
- **Performance Charts**: Weekly progress and achievement tracking
- **Leaderboards**: Competitive learning environment
- **Achievement System**: Gamification with badges and rewards

### 🔄 **Real-time Features**
- **Socket.IO Integration**: Live collaboration and updates
- **Command Broadcasting**: Real-time command execution feedback
- **Session Management**: Persistent simulation sessions
- **Live Status Updates**: Device status and connectivity

## Technology Stack

- **React 18**: Modern hooks and concurrent features
- **Vite**: Fast development and optimized builds
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **React Query**: Server state management and caching
- **React Router**: Client-side routing with protected routes
- **Socket.IO Client**: Real-time bidirectional communication
- **xterm.js**: Professional terminal emulation
- **Recharts**: Data visualization and analytics
- **React Hook Form**: Form validation and management
- **Headless UI**: Accessible component library

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn package manager

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthModal.jsx
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   └── ui/
│   │       └── LoadingSpinner.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── LabsPage.jsx
│   │   ├── LabDetailPage.jsx
│   │   ├── SimulationPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── ProfilePage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

## API Integration

The frontend is fully integrated with the NetLabX backend API:

- **Authentication**: `/api/auth/*` endpoints
- **Labs**: `/api/labs/*` endpoints  
- **Simulation**: `/api/simulation/*` endpoints
- **Users**: `/api/users/*` endpoints
- **Real-time**: Socket.IO events for live updates

## Design System

### Color Palette
- **Primary**: Blue gradient (#3b82f6 → #0ea5e9)
- **Secondary**: Cyan gradient (#06b6d4 → #22d3ee)
- **Accent**: Purple gradient (#a855f7 → #7c3aed)
- **Success**: Green (#22c55e → #14532d)
- **Warning**: Yellow (#f59e0b → #451a03)
- **Error**: Red (#ef4444 → #450a0a)
- **Dark Theme**: Professional dark background (#0f172a → #1e293b)

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Monospace Font**: JetBrains Mono for terminal
- **Responsive Scaling**: Fluid typography for all screen sizes

### Components
- **Buttons**: Primary, secondary, and ghost variants
- **Cards**: Glass morphism with hover effects
- **Forms**: Input fields with validation states
- **Navigation**: Responsive navbar with mobile menu
- **Terminal**: Custom styled xterm.js integration

## Features

### 🎯 **Accessibility**
- WCAG 2.1 compliant color contrast ratios
- Keyboard navigation support
- Screen reader friendly semantic HTML
- Focus indicators and skip links

### 📱 **Responsive Design**
- Mobile-first design approach
- Touch-friendly interface elements
- Adaptive layouts for all screen sizes
- Optimized terminal for mobile devices

### ⚡ **Performance**
- Code splitting and lazy loading
- Optimized bundle sizes
- Efficient re-rendering with React Query
- Smooth animations with CSS transforms

### 🔒 **Security**
- XSS protection with content security policy
- CSRF protection with secure headers
- Input sanitization and validation
- Secure token handling

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari, Android Chrome
- **Progressive Enhancement**: Graceful degradation for older browsers

## Contributing

1. Follow the established code patterns
2. Use Tailwind CSS classes for styling
3. Maintain component reusability
4. Test across different screen sizes
5. Ensure accessibility compliance

---

**NetLabX Frontend** - Professional network training platform with modern UX and comprehensive features.
