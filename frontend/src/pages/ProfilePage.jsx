import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  UserIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CameraIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user, logout, getToken } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery(
    'user-profile',
    async () => {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })
      return response.json()
    }
  )

  const updateProfileMutation = useMutation(
    async (profileData) => {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(profileData)
      })
      return response.json()
    },
    {
      onSuccess: () => {
        setIsEditing(false)
        toast.success('Profile updated successfully!')
        queryClient.invalidateQueries('user-profile')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  const updatePasswordMutation = useMutation(
    async (passwordData) => {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(passwordData)
      })
      return response.json()
    },
    {
      onSuccess: () => {
        toast.success('Password changed successfully!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to change password')
      }
    }
  )

  const { data: progress } = useQuery(
    'user-progress',
    async () => {
      const response = await fetch('/api/users/labs/history', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      })
      return response.json()
    }
  )

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'progress', label: 'Progress', icon: ChartBarIcon },
    { id: 'achievements', label: 'Achievements', icon: AcademicCapIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
  ]

  const handleProfileUpdate = (data) => {
    updateProfileMutation.mutate(data)
  }

  const handlePasswordChange = (data) => {
    updatePasswordMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-dark-text">My Profile</h1>
            
            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-dark-text">
                    {user?.profile?.firstName} {user?.profile?.lastName}
                  </h2>
                  <p className="text-primary-400">@{user?.username}</p>
                  <p className="text-dark-muted">{user?.profile?.institution}</p>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  handleProfileUpdate({
                    profile: {
                      firstName: e.target.firstName.value,
                      lastName: e.target.lastName.value,
                      institution: e.target.institution.value,
                      experienceLevel: e.target.experienceLevel.value
                    }
                  })
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue={user?.profile?.firstName || ''}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue={user?.profile?.lastName || ''}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">Institution</label>
                    <input
                      type="text"
                      defaultValue={user?.profile?.institution || ''}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">Experience Level</label>
                    <select
                      defaultValue={user?.profile?.experienceLevel || 'beginner'}
                      className="input-field"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isLoading}
                      className="btn-primary"
                    >
                      {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-dark-muted">Email</span>
                    <span className="text-sm text-dark-text">{user?.email}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-dark-muted">Member Since</span>
                    <span className="text-sm text-dark-text">
                      {new Date(user?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-dark-muted">Last Login</span>
                    <span className="text-sm text-dark-text">
                      {new Date(user?.lastLogin).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats Overview */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Learning Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-400">{profile?.stats?.labsCompleted || 0}</div>
                  <div className="text-sm text-dark-muted">Labs Completed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-success-400">{profile?.stats?.averageScore || 0}%</div>
                  <div className="text-sm text-dark-muted">Average Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent-400">
                    {Math.floor((profile?.stats?.totalLabTime || 0) / 60)}h {Math.floor((profile?.stats?.totalLabTime || 0) % 60)}m
                  </div>
                  <div className="text-sm text-dark-muted">Total Learning Time</div>
                </div>
              </div>

              {/* Skills Progress */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-dark-text mb-3">Skill Development</h4>
                <div className="space-y-3">
                  {profile?.stats?.skills?.map((skill, index) => (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-dark-muted capitalize">{skill.skill}</span>
                        <span className="text-sm font-semibold text-dark-text">{skill.level}%</span>
                      </div>
                      
                      <div className="w-full bg-dark-border rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary transition-all duration-500 ease-out"
                          style={{ width: `${skill.level}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Navigation Tabs */}
            <div className="bg-dark-surface p-4 rounded-xl border border-dark-border">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Menu</h3>
              
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-500 text-white'
                          : 'text-dark-text hover:bg-dark-card'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Security</h3>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                handlePasswordChange({
                  currentPassword: e.target.currentPassword.value,
                  newPassword: e.target.newPassword.value
                })
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    className="input-field"
                    placeholder="Enter current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="input-field"
                    placeholder="Enter new password"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={updatePasswordMutation.isLoading}
                  className="w-full btn-primary"
                >
                  {updatePasswordMutation.isLoading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Logout */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <button
                onClick={() => logout()}
                className="w-full btn-secondary text-error-400 hover:text-error-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
