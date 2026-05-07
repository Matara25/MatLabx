import React, { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const CreateLabPage = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'routing',
    difficulty: 'beginner',
    duration: 60,
    tags: [],
    objectives: [],
    prerequisites: []
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = ['routing', 'switching', 'security', 'troubleshooting', 'network-design', 'wireless']
  const difficulties = ['beginner', 'intermediate', 'advanced']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/labs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Lab created successfully!')
        // Invalidate labs query to refresh the list
        queryClient.invalidateQueries(['labs'])
        navigate('/admin')
      } else {
        toast.error(data.message || 'Failed to create lab')
      }
    } catch (error) {
      console.error('Create lab error:', error)
      toast.error('Failed to create lab')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  const handleObjectivesChange = (e) => {
    const objectives = e.target.value.split('\n').map(obj => obj.trim()).filter(obj => obj)
    setFormData(prev => ({
      ...prev,
      objectives
    }))
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 text-dark-muted hover:text-dark-text transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-dark-text">Create New Lab</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-dark-text mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Lab Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter lab title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Describe what students will learn in this lab"
                />
              </div>

              {/* Category and Difficulty */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Difficulty *
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="15"
                  max="480"
                  className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Estimated completion time"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-dark-text mb-6">Additional Details</h2>
            
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas (e.g., routing, protocols, simulation)"
                />
              </div>

              {/* Objectives */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Learning Objectives
                </label>
                <textarea
                  value={formData.objectives.join('\n')}
                  onChange={handleObjectivesChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Enter learning objectives (one per line)"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-6 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateLabPage
