import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const AdminDashboardPage = () => {
  const { user } = useAuth()

  const adminStats = [
    { label: 'Total Users', value: '24', change: '+12%', positive: true },
    { label: 'Active Labs', value: '15', change: '+3', positive: true },
    { label: 'Total Curriculum', value: '8', change: '+2', positive: true },
    { label: 'Completion Rate', value: '78%', change: '+5%', positive: true }
  ]

  const quickActions = [
    {
      title: 'Create New Lab',
      description: 'Add a new hands-on lab exercise',
      icon: '🔬',
      link: '/admin/create-lab',
      color: 'bg-blue-500'
    },
    {
      title: 'Add Curriculum',
      description: 'Create new learning curriculum',
      icon: '📚',
      link: '/admin/create-curriculum',
      color: 'bg-green-500'
    },
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      icon: '👥',
      link: '/admin/users',
      color: 'bg-purple-500'
    },
    {
      title: 'Batch Upload',
      description: 'Upload multiple labs or curriculum',
      icon: '📤',
      link: '/batch-upload',
      color: 'bg-orange-500'
    }
  ]

  const recentActivity = [
    { action: 'New lab created', item: 'Basic IP Configuration', time: '2 hours ago', user: 'Admin' },
    { action: 'User registered', item: 'student@matlabx.com', time: '4 hours ago', user: 'System' },
    { action: 'Lab completed', item: 'VLAN Configuration', time: '6 hours ago', user: 'John Doe' },
    { action: 'Curriculum updated', item: 'Network Fundamentals', time: '1 day ago', user: 'Admin' }
  ]

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-dark-muted">Manage your network training platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {adminStats.map((stat, index) => (
            <div key={index} className="bg-dark-surface border border-dark-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-dark-muted">{stat.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  stat.positive ? 'bg-success-500/20 text-success-400' : 'bg-error-500/20 text-error-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="bg-dark-surface border border-dark-border rounded-lg p-6 hover:border-primary-500 transition-colors duration-200"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
                  {action.icon}
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-dark-muted">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-dark-muted"> - {activity.item}</span>
                    </p>
                    <p className="text-xs text-dark-muted mt-1">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-dark-surface border border-dark-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Backend API</span>
                <span className="px-2 py-1 bg-success-500/20 text-success-400 text-xs rounded-full">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="px-2 py-1 bg-success-500/20 text-success-400 text-xs rounded-full">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage</span>
                <span className="px-2 py-1 bg-warning-500/20 text-warning-400 text-xs rounded-full">75% Used</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users</span>
                <span className="text-sm font-medium">12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-dark-surface border border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/labs" className="flex items-center space-x-2 text-primary-400 hover:text-primary-300">
              <span>🔬</span>
              <span>View All Labs</span>
            </Link>
            <Link to="/admin/analytics" className="flex items-center space-x-2 text-primary-400 hover:text-primary-300">
              <span>📊</span>
              <span>Analytics</span>
            </Link>
            <Link to="/admin/settings" className="flex items-center space-x-2 text-primary-400 hover:text-primary-300">
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
