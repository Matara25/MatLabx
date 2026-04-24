import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  ClockIcon,
  UserGroupIcon,
  PlayIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const LabDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, getToken } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()

  const { data: lab, isLoading, error } = useQuery(
    ['lab', id],
    async () => {
      const response = await fetch(`/api/labs/${id}`)
      return response.json()
    }
  )

  const startLabMutation = useMutation(
    async (labId) => {
      const response = await fetch('/api/simulation/start/' + labId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        }
      })
      return response.json()
    },
    {
      onSuccess: (data) => {
        toast.success('Lab started successfully!')
        navigate(`/simulation/${id}`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to start lab')
      }
    }
  )

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-success-400 bg-success-100/20'
      case 'intermediate': return 'text-warning-400 bg-warning-100/20'
      case 'advanced': return 'text-error-400 bg-error-100/20'
      default: return 'text-dark-muted bg-dark-card'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpenIcon },
    { id: 'objectives', label: 'Learning Objectives', icon: CheckCircleIcon },
    { id: 'topology', label: 'Network Topology', icon: Cog6ToothIcon },
    { id: 'requirements', label: 'Requirements', icon: ExclamationTriangleIcon },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !lab) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-error-400 text-xl mb-4">Lab not found</div>
          <button 
            onClick={() => navigate('/labs')} 
            className="btn-primary"
          >
            Back to Labs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/labs')}
                className="text-dark-muted hover:text-primary-400 transition-colors duration-200"
              >
                ← Back to Labs
              </button>
              <div>
                <h1 className="text-2xl font-bold text-dark-text">{lab.title}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getDifficultyColor(lab.difficulty)}`}>
                    {lab.difficulty.charAt(0).toUpperCase() + lab.difficulty.slice(1)}
                  </span>
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 text-warning-400 mr-1" />
                    <span className="text-sm text-dark-muted">{lab.duration} minutes</span>
                  </div>
                </div>
              </div>
            </div>
            
            {isAuthenticated && (
              <button
                onClick={() => startLabMutation.mutate(lab.id)}
                disabled={startLabMutation.isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                <PlayIcon className="w-4 h-4" />
                {startLabMutation.isLoading ? 'Starting...' : 'Start Lab'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <h2 className="text-xl font-semibold text-dark-text mb-4">Description</h2>
              <p className="text-dark-muted leading-relaxed">{lab.description}</p>
            </div>

            {/* Learning Objectives */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <h2 className="text-xl font-semibold text-dark-text mb-4">Learning Objectives</h2>
              <ul className="space-y-3">
                {lab.objectives?.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-success-400 mt-0.5 flex-shrink-0" />
                    <span className="text-dark-text">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisites */}
            {lab.prerequisites && lab.prerequisites.length > 0 && (
              <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                <h2 className="text-xl font-semibold text-dark-text mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {lab.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-warning-400" />
                      <span className="text-dark-muted">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <h2 className="text-xl font-semibold text-dark-text mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {lab.tags?.map(tag => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-primary-500/20 text-primary-400 text-sm rounded-full border border-primary-500/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Lab Stats */}
            <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Lab Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-dark-muted">Difficulty</span>
                  <span className={`font-semibold ${getDifficultyColor(lab.difficulty)}`}>
                    {lab.difficulty.charAt(0).toUpperCase() + lab.difficulty.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Duration</span>
                  <span className="font-semibold">{lab.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Devices</span>
                  <span className="font-semibold">{lab.topology?.devices?.length || 3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Tasks</span>
                  <span className="font-semibold">{lab.tasks?.length || 5}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-muted">Rating</span>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">{lab.rating?.average || '4.5'}</span>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(lab.rating?.average || 4.5) 
                              ? 'text-warning-400' 
                              : 'text-dark-muted'
                          }`}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isAuthenticated && (
              <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                <h3 className="text-lg font-semibold text-dark-text mb-4">Get Started</h3>
                <p className="text-dark-muted mb-4">
                  Sign in to access this lab and start your network training journey.
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full btn-secondary"
                >
                  Sign In to Start
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabDetailPage
